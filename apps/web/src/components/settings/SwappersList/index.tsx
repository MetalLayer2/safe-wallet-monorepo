import { Box, Button, Grid2, SvgIcon, Typography } from '@mui/material'
import { AbiCoder, Contract, getAddress, Interface, isHexString } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { fetchRole } from 'zodiac-roles-deployments'
import { useContext, useMemo } from 'react'
import { encodeRoleKey, Operator } from 'zodiac-roles-sdk'
import type { ReactElement } from 'react'
import type { Role } from 'zodiac-roles-sdk'

import { Chip } from '@/components/common/Chip'
import OnlyOwner from '@/components/common/OnlyOwner'
import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { TxModalContext } from '@/components/tx-flow'
import { SetupSwapperRoleFlow } from '@/components/tx-flow/flows'
import {
  CowOrderSignerAbi,
  isSwapperRoleChain,
  SWAPPER_ROLE_KEY,
  SwapperRoleContracts,
} from '@/components/tx-flow/flows/SetupSwapperRole/transactions/constants'
import useAsync from '@/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3 } from '@/hooks/wallets/web3'
import AddIcon from '@/public/images/common/add.svg'
import useBalances from '@/hooks/useBalances'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import { useSwapperRoleMod } from '@/components/tx-flow/flows/SetupSwapperRole/hooks/useSwapperRoleMod'

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

type Allowance = {
  refill: bigint
  maxRefill: bigint
  period: bigint
  balance: bigint
  timestamp: bigint
}

export function SwappersList(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { safe } = useSafeInfo()

  const [rolesMod] = useSwapperRoleMod()
  // TODO: Migrate to RTK query for caching
  const [role] = useAsync(async () => {
    if (!rolesMod) {
      return
    }

    const roleKey = encodeRoleKey(SWAPPER_ROLE_KEY)
    const chainId = Number(safe.chainId)
    if (!isHexString(rolesMod) || !isHexString(roleKey) || chainId !== 11155111) {
      return
    }

    return fetchRole({
      address: rolesMod,
      roleKey,
      chainId,
    })
  }, [rolesMod, safe.chainId])

  const onAdd = () => {
    setTxFlow(<SetupSwapperRoleFlow />)
  }

  return (
    <Grid2 container spacing={3} display="flex" mt={2} justifyContent="flex-end">
      <Grid2 size={{ lg: 8, xs: 12 }}>
        <Typography fontWeight="bold" mb={2}>
          Swappers <Chip label="New" sx={{ backgroundColor: 'secondary.light', color: 'static.main' }} />
        </Typography>
        <Typography mb={2}>
          Swappers can execute swap and limit orders without collecting signatures for each trade. You can define limits
          of the tokens and amounts they can trade.
        </Typography>

        <Box>
          <OnlyOwner>
            {(isOk) => (
              <Button
                onClick={onAdd}
                variant="text"
                startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
                disabled={!isOk}
                size="compact"
              >
                Add Swapper
              </Button>
            )}
          </OnlyOwner>
        </Box>

        {role && <MemberList role={role} />}

        {rolesMod && role && <AllowanceList rolesModifierAddress={rolesMod as `0x${string}`} role={role} />}
      </Grid2>
    </Grid2>
  )
}

function MemberList({ role }: { role: Role }): ReactElement | null {
  const rows = useMemo(() => {
    if (!role?.members) {
      return []
    }

    return role.members.map((member) => {
      return {
        cells: {
          member: {
            rawValue: member,
            content: <EthHashInfo address={member} showCopyButton hasExplorer shortAddress={false} />,
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: null,
          },
        },
      }
    })
  }, [role])

  if (rows.length === 0) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={[]} />
}

function AllowanceList({
  rolesModifierAddress,
  role,
}: {
  rolesModifierAddress: `0x${string}`
  role: Role
}): ReactElement | null {
  const { safe } = useSafeInfo()

  const orderSignerTarget = role?.targets.find((target) => {
    if (!isSwapperRoleChain(safe.chainId)) {
      return false
    }
    return sameAddress(target.address, SwapperRoleContracts[safe.chainId].cowSwap.orderSigner)
  })

  const signOrderScope = orderSignerTarget?.functions.find((func) => {
    return func.selector === CowOrderSignerInterface.getFunction('signOrder')!.selector
  })

  const signOrderConditions = signOrderScope?.condition?.children
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

  const allowances = signOrderConditions
    ?.map((condition) => {
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

      // TODO: How do we decode these?
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

  const rows = useMemo(() => {
    if (!allowances || allowances.length === 0) {
      return []
    }

    return allowances?.map((allowance) => {
      const token = allowance.sellToken ?? allowance.buyToken
      const allowanceKey = allowance.sellAmountAllowanceKey ?? allowance.buyAmountAllowanceKey

      if (!token || !allowanceKey) {
        return {
          cells: {
            type: {
              rawValue: '',
              content: 'Unknown',
            },
            token: {
              rawValue: '',
              content: 'Unknown',
            },
            value: {
              rawValue: '',
              content: 'Unknown',
            },
            actions: {
              rawValue: '',
              sticky: true,
              content: null,
            },
          },
        }
      }

      const type = allowance.sellToken ? 'sell' : 'buy'

      return {
        cells: {
          type: {
            rawValue: type,
            content: type,
          },
          token: {
            rawValue: token,
            content: <EthHashInfo address={token} showCopyButton hasExplorer shortAddress={false} />,
          },
          value: {
            rawValue: allowanceKey,
            content: (
              <AllowanceBalance rolesModifierAddress={rolesModifierAddress} allowanceKey={allowanceKey} token={token} />
            ),
          },
          actions: {
            rawValue: '',
            sticky: true,
            content: null,
          },
        },
      }
    })
  }, [allowances, rolesModifierAddress])

  if (rows.length === 0) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={[]} />
}

function decodeAddress(compValue: `0x${string}`): string {
  return getAddress(`0x${compValue.slice(-40)}`)
}

const defaultAbiCoder = AbiCoder.defaultAbiCoder()
function decodeAllowanceKey(compValue: `0x${string}`): string {
  const [allowanceKey] = defaultAbiCoder.decode(['bytes32'], compValue)
  return allowanceKey
}

function AllowanceBalance({
  rolesModifierAddress,
  allowanceKey,
  token,
}: {
  rolesModifierAddress: string
  allowanceKey: string
  token: string
}): ReactElement | null {
  const web3 = useWeb3()

  // TODO: Migrate to RTK query for caching
  const [allowance] = useAsync<Allowance>(async () => {
    if (!web3) {
      return
    }
    const signer = await web3.getSigner()
    const rolesModifier = new Contract(rolesModifierAddress, RolesModifierInterface, signer)
    return rolesModifier.allowances(allowanceKey)
  }, [allowanceKey, rolesModifierAddress, web3])

  if (!allowance) {
    return null
  }

  return <AllowanceBalanceItem allowance={allowance} token={token} />
}

function AllowanceBalanceItem({ allowance, token }: { allowance: Allowance; token: string }): ReactElement {
  const web3 = useWeb3()
  const { balances } = useBalances()
  const balance = allowance.balance.toString()

  // TODO: Migrate to RTK query for caching
  const [tokenInfo] = useAsync(async () => {
    const item = balances.items.find((item) => {
      return sameAddress(item.tokenInfo.address, token)
    })

    if (item?.tokenInfo) {
      return item.tokenInfo
    }

    if (!web3) {
      return
    }

    return getERC20TokenInfoOnChain(token)
  }, [balances.items, token, web3])

  if (!tokenInfo?.decimals) {
    return <>{balance}</>
  }

  return (
    <>
      {formatVisualAmount(balance, tokenInfo.decimals)} {tokenInfo.symbol}
    </>
  )
}
