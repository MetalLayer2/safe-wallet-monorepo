import { useContext, type ReactElement } from 'react'
import { Button, Grid2, Paper, Typography } from '@mui/material'
import { SetupSwapperRoleFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '../tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAsync from '@/hooks/useAsync'
import { fetchRole } from 'zodiac-roles-deployments'
import { encodeRoleKey, Operator } from 'zodiac-roles-sdk'
import {
  CowOrderSignerAbi,
  isSwapperRoleChain,
  SWAPPER_ROLE_KEY,
  SwapperRoleContracts,
} from '../tx-flow/flows/SetupSwapperRole/transactions/constants'
import { AbiCoder, Contract, getAddress, Interface } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useWeb3 } from '@/hooks/wallets/web3'

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

const defaultAbiCoder = AbiCoder.defaultAbiCoder()

const SetupSwapperRoleButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const { safe } = useSafeInfo()

  const firstModule = safe.modules?.[0].value

  const handleClick = () => {
    setTxFlow(<SetupSwapperRoleFlow />)
  }

  const [rolesModifier] = useAsync(async () => {
    if (!firstModule) {
      return
    }
    return fetchRole({
      address: firstModule as `0x${string}`,
      chainId: Number(safe.chainId) as 11155111,
      roleKey: encodeRoleKey(SWAPPER_ROLE_KEY) as `0x${string}`,
    })
  }, [firstModule, safe.chainId])

  const orderSignerConditions = rolesModifier?.targets
    .find((target) => {
      if (!isSwapperRoleChain(safe.chainId)) {
        return false
      }
      return sameAddress(target.address, SwapperRoleContracts[safe.chainId].cowSwap.orderSigner)
    })
    ?.functions.find(({ selector }) => {
      return selector === CowOrderSignerInterface.getFunction('signOrder')!.selector
    })
    ?.condition?.children?.find((child) => {
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

  const allowances = (() => {
    if (!orderSignerConditions) {
      return []
    }

    return orderSignerConditions.map((condition) => {
      if (condition.operator !== Operator.Matches || !condition.children) {
        return null
      }

      const [_sellToken, _buyToken, _receiver, _sellAmount, _buyAmount] = condition.children

      let sellToken: string | undefined
      let buyToken: string | undefined
      let receiver: string | undefined
      let sellAmountAllowanceKey: string | undefined
      let buyAmountAllowanceKey: string | undefined

      if (_sellToken.operator === Operator.EqualTo && _sellToken.compValue) {
        sellToken = getAddress(`0x${_sellToken.compValue.slice(-40)}`)
      }
      if (_buyToken.operator === Operator.EqualTo && _buyToken.compValue) {
        buyToken = getAddress(`0x${_buyToken.compValue.slice(-40)}`)
      }
      if (_receiver.operator === Operator.EqualTo && _receiver.compValue) {
        receiver = getAddress(`0x${_receiver.compValue.slice(-40)}`)
      }

      // TODO: How do we decode these?
      if (_sellAmount.operator === Operator.WithinAllowance && _sellAmount.compValue) {
        const [allowanceKey] = defaultAbiCoder.decode(['bytes32'], _sellAmount.compValue)
        sellAmountAllowanceKey = allowanceKey
      }
      if (_buyAmount.operator === Operator.WithinAllowance && _buyAmount.compValue) {
        const [allowanceKey] = defaultAbiCoder.decode(['bytes32'], _buyAmount.compValue)
        buyAmountAllowanceKey = allowanceKey
      }
      return {
        sellToken,
        buyToken,
        receiver,
        sellAmountAllowanceKey,
        buyAmountAllowanceKey,
      }
    })
  })()

  return (
    <Paper sx={{ p: 4 }}>
      <Grid2
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid2 size={{ lg: 4, xs: 12 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Swapper Role
          </Typography>
        </Grid2>
        {allowances.length > 0 && (
          <Grid2 size={{ xs: 12 }}>
            Note: values below are incorrect
            <ul>
              {allowances.map((allowance, index) => {
                if (allowance?.sellToken) {
                  return (
                    <li key={index}>
                      SELL {allowance.sellToken}{' '}
                      <Allowance rolesModifierAddress={firstModule!} allowanceKey={allowance.sellAmountAllowanceKey!} />
                    </li>
                  )
                }
                if (allowance?.buyToken) {
                  return (
                    <li key={index}>
                      BUY {allowance.buyToken}{' '}
                      <Allowance rolesModifierAddress={firstModule!} allowanceKey={allowance.buyAmountAllowanceKey!} />
                    </li>
                  )
                }
                return null
              })}
            </ul>
          </Grid2>
        )}
        <Grid2 size={{ lg: 8, xs: 12 }}>
          <Button variant="contained" onClick={handleClick}>
            Setup Swapper Role
          </Button>
        </Grid2>
      </Grid2>
    </Paper>
  )
}

function Allowance({ rolesModifierAddress, allowanceKey }: { rolesModifierAddress: string; allowanceKey: string }) {
  const web3 = useWeb3()

  const [allowance] = useAsync(async () => {
    if (!web3) {
      return
    }
    const signer = await web3.getSigner()
    const rolesModifier = new Contract(rolesModifierAddress, RolesModifierInterface, signer)
    return rolesModifier.allowances(allowanceKey)
  }, [allowanceKey, rolesModifierAddress, web3])

  return <>{allowance?.balance ?? 'Loading...'}</>
}

export default SetupSwapperRoleButton
