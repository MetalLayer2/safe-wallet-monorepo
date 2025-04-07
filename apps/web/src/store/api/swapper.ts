import { createApi, skipToken } from '@reduxjs/toolkit/query/react'
import { AbiCoder, Contract, getAddress, Interface, isHexString } from 'ethers'
import { fetchRole, Operator } from 'zodiac-roles-sdk'
import type { Role } from 'zodiac-roles-sdk'
import type { JsonRpcProvider } from 'ethers'

import {
  CowOrderSignerAbi,
  isSwapperRoleChain,
  SwapperRoleContracts,
} from '@/components/tx-flow/flows/SetupSwapperRole/transactions/constants'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import useBalances from '@/hooks/useBalances'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const RolesModifierInterface = new Interface([
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'allowances',
    outputs: [
      { internalType: 'uint128', name: 'refill', type: 'uint128' },
      { internalType: 'uint128', name: 'maxRefill', type: 'uint128' },
      { internalType: 'uint64', name: 'period', type: 'uint64' },
      { internalType: 'uint128', name: 'balance', type: 'uint128' },
      { internalType: 'uint64', name: 'timestamp', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
])

const noopBaseQuery = async () => ({ data: null })

const createBadRequestError = (message: string) => ({
  error: { status: 400, statusText: 'Bad Request', data: message },
})

// TODO: Invalidate with txHistoryTag

export const swapperApi = createApi({
  reducerPath: 'swapperApi',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getRolesModifier: builder.query<string | null, { provider: JsonRpcProvider; safe: SafeInfo }>({
      async queryFn(args) {
        const modules = args.safe.modules

        if (!modules || modules.length === 0) {
          return {
            data: null,
          }
        }

        const chainId = args.safe.chainId

        if (!isSwapperRoleChain(chainId)) {
          return createBadRequestError('Unsupported chain')
        }

        const expectedByteCode = `0x363d3d373d3d3d363d73${SwapperRoleContracts[chainId].roles.slice(2).toLowerCase()}5af43d82803e903d91602b57fd5bf3`

        for (const { value } of modules) {
          const code = await args.provider.getCode(value, 'latest')

          if (code === expectedByteCode) {
            return {
              data: value,
            }
          }
        }

        return {
          data: null,
        }
      },
    }),
    getRole: builder.query<
      Role | null,
      { safe: SafeInfo; provider: JsonRpcProvider; roleKey: string; rolesModifierAddress: string }
    >({
      async queryFn(args) {
        if (!args.rolesModifierAddress) {
          return { data: null }
        }

        const chainId = Number(args.safe.chainId)

        // TODO: Improve type handling
        if (!isHexString(args.rolesModifierAddress) || !isHexString(args.roleKey) || chainId !== 11155111) {
          return createBadRequestError('Invalid address or role key')
        }

        return {
          data: await fetchRole({
            address: args.rolesModifierAddress,
            roleKey: args.roleKey,
            chainId,
          }),
        }
      },
    }),
    getAllowances: builder.query<
      Array<{
        token: string
        type: 'sell' | 'buy'
        allowanceKey: string
        allowance: {
          refill: string
          maxRefill: string
          period: string
          balance: string
          timestamp: string
          isUnset: boolean
        }
      }> | null,
      { safe: SafeInfo; balances: Balances; provider: JsonRpcProvider; roleKey: string; rolesModifierAddress: string }
    >({
      async queryFn(args) {
        if (!args.rolesModifierAddress) {
          return { data: null }
        }

        const chainId = Number(args.safe.chainId)

        // TODO: Improve type handling
        if (!isHexString(args.rolesModifierAddress) || !isHexString(args.roleKey) || chainId !== 11155111) {
          return createBadRequestError('Invalid address or role key')
        }

        const role = await fetchRole({
          address: args.rolesModifierAddress,
          roleKey: args.roleKey,
          chainId,
        })

        const orderSignerTarget = role?.targets.find((target) => {
          if (!isSwapperRoleChain(args.safe.chainId)) {
            return false
          }
          return sameAddress(target.address, SwapperRoleContracts[args.safe.chainId].cowSwap.orderSigner)
        })

        if (!orderSignerTarget) {
          return { data: null }
        }

        const signOrderScope = orderSignerTarget.functions.find((func) => {
          return func.selector === CowOrderSignerInterface.getFunction('signOrder')!.selector
        })

        if (!signOrderScope?.condition) {
          return { data: null }
        }

        const signOrderConditions = signOrderScope.condition.children
          ?.find((child) => {
            return 'children' in child
          })
          ?.children?.filter((grandChild) => {
            return (
              'children' in grandChild &&
              grandChild.children?.some((greatGrandChild) => {
                return greatGrandChild.operator === Operator.WithinAllowance
              })
            )
          })

        if (!signOrderConditions) {
          return { data: null }
        }

        const allowances = signOrderConditions
          .map((condition) => {
            if (condition.operator !== Operator.Matches || !condition.children) {
              return null
            }

            const [_sellToken, _buyToken, _receiver, _sellAmount, _buyAmount] = condition.children

            let sellToken: string | undefined
            let buyToken: string | undefined
            let receiver: string | undefined
            let sellAmountAllowanceKey: string | undefined
            let buyAmountAllowanceKey: string | undefined

            // TODO: Also check ParamType
            if (_sellToken.operator === Operator.EqualTo && _sellToken.compValue) {
              sellToken = decodeAddress(_sellToken.compValue)
            }
            if (_buyToken.operator === Operator.EqualTo && _buyToken.compValue) {
              buyToken = decodeAddress(_buyToken.compValue)
            }
            if (_receiver.operator === Operator.EqualTo && _receiver.compValue) {
              receiver = decodeAddress(_receiver.compValue)
            }
            if (_sellAmount.operator === Operator.WithinAllowance && _sellAmount.compValue) {
              sellAmountAllowanceKey = decodeAllowanceKey(_sellAmount.compValue)
            }
            if (_buyAmount.operator === Operator.WithinAllowance && _buyAmount.compValue) {
              buyAmountAllowanceKey = decodeAllowanceKey(_buyAmount.compValue)
            }
            return {
              sellToken,
              buyToken,
              receiver,
              sellAmountAllowanceKey,
              buyAmountAllowanceKey,
            }
          })
          .filter((value) => value != null)

        const MAX_UINT128 = (BigInt(1) << BigInt(128)) - BigInt(1)

        const signer = await args.provider.getSigner()
        const rolesModifier = new Contract(args.rolesModifierAddress, RolesModifierInterface, signer)

        const data = await Promise.all(
          allowances.map(async (a) => {
            const token = a.sellToken ?? a.buyToken
            const allowanceKey = a.sellAmountAllowanceKey ?? a.buyAmountAllowanceKey

            if (!token || !allowanceKey) {
              return null
            }

            const allowance = (await rolesModifier.allowances(allowanceKey)) as {
              refill: bigint
              maxRefill: bigint
              period: bigint
              balance: bigint
              timestamp: bigint
            }

            const isUnset =
              allowance.balance === BigInt(0) &&
              allowance.period === BigInt(0) &&
              allowance.refill === BigInt(0) &&
              allowance.maxRefill === MAX_UINT128

            return {
              token,
              type: a.sellAmountAllowanceKey ? ('sell' as const) : ('buy' as const),
              allowanceKey,
              allowance: {
                refill: allowance.refill.toString(),
                maxRefill: allowance.maxRefill.toString(),
                period: allowance.period.toString(),
                balance: allowance.balance.toString(),
                timestamp: allowance.timestamp.toString(),
                isUnset,
              },
            }
          }),
        )

        return { data: data.filter((d) => d != null) }
      },
    }),
  }),
})

function decodeAddress(compValue: `0x${string}`): string {
  return getAddress(`0x${compValue.slice(-40)}`)
}

const defaultAbiCoder = AbiCoder.defaultAbiCoder()
function decodeAllowanceKey(compValue: `0x${string}`): string {
  const [allowanceKey] = defaultAbiCoder.decode(['bytes32'], compValue)
  return allowanceKey
}

const {
  useGetRolesModifierQuery: _useGetRolesModifierQuery,
  useGetRoleQuery: _useGetRoleQuery,
  useGetAllowancesQuery: _useGetAllowancesQuery,
} = swapperApi

// TODO: Reconsider the following abstractions

export function useGetRolesModifierQuery() {
  const { safeLoaded, safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  return _useGetRolesModifierQuery(safeLoaded && web3ReadOnly ? { provider: web3ReadOnly, safe } : skipToken)
}

export function useGetRoleQuery(roleKey: string) {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const { data: rolesModifierAddress } = useGetRolesModifierQuery()

  return _useGetRoleQuery(
    web3ReadOnly && rolesModifierAddress ? { provider: web3ReadOnly, safe, roleKey, rolesModifierAddress } : skipToken,
  )
}

export function useGetAllowancesQuery(roleKey: string) {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const { data: rolesModifierAddress } = useGetRolesModifierQuery()
  const { balances } = useBalances()
  return _useGetAllowancesQuery(
    web3ReadOnly && rolesModifierAddress && balances
      ? { provider: web3ReadOnly, safe, balances, roleKey, rolesModifierAddress }
      : skipToken,
  )
}
