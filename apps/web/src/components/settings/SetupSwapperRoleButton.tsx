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
import { AbiCoder, getAddress, Interface } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)

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
      let sellAmount: string | undefined
      let buyAmount: string | undefined

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
        ;[sellAmount] = defaultAbiCoder.decode(['uint128'], _sellAmount.compValue)
      }
      if (_buyAmount.operator === Operator.WithinAllowance && _buyAmount.compValue) {
        ;[buyAmount] = defaultAbiCoder.decode(['uint128'], _buyAmount.compValue)
      }
      return {
        sellToken,
        buyToken,
        receiver,
        sellAmount,
        buyAmount,
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
                      SELL {allowance.sellToken} {allowance.sellAmount}
                    </li>
                  )
                }
                if (allowance?.buyToken) {
                  return (
                    <li key={index}>
                      BUY {allowance.buyToken} {allowance.buyAmount}
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

export default SetupSwapperRoleButton
