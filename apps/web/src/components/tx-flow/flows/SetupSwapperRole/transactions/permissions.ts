import { ethers, Interface, keccak256 } from 'ethers'
import { c, forAll, type Permission } from 'zodiac-roles-sdk'

import { CowOrderSignerAbi, SwapperRoleContracts } from './constants'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const GPv2OrderStructAbi = [
  'tuple(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance)',
]
const WrappedNativeTokenInterface = new Interface(['function deposit()'])

const oneOf = <T extends unknown>(values: readonly T[]) => {
  if (values.length === 0) {
    throw new Error('`oneOf` values must not be empty')
  }

  return values.length === 1 ? values[0] : c.or(...(values as [T, T, ...T[]]))
}

export const allowErc20Approve = (tokens: readonly `0x${string}`[], spenders: readonly `0x${string}`[]) =>
  forAll(tokens, {
    signature: 'approve(address,uint256)',
    condition: c.calldataMatches([oneOf(spenders)], ['address', 'uint256']),
  })

export const allowWrappingNativeTokens = (tokenAddress: `0x${string}`): Permission => ({
  targetAddress: tokenAddress,
  send: true,
  delegatecall: false,
  selector: WrappedNativeTokenInterface.getFunction('deposit')!.selector as `0x${string}`,
})

export const createAllowanceKey = (tokenAddress: `0x${string}`, buyOrSell: 'buy' | 'sell'): `0x${string}` =>
  keccak256(ethers.concat([tokenAddress, buyOrSell === 'buy' ? '0x00' : '0x01'])) as `0x${string}`

export const allowCreatingOrders = (
  chainId: keyof typeof SwapperRoleContracts,
  sellTokens: `0x${string}`[],
  receiver: `0x${string}`,
  amountAllowanceKey?: `0x${string}`,
): Permission => ({
  targetAddress: SwapperRoleContracts[chainId].cowSwap.orderSigner,
  delegatecall: true,
  selector: CowOrderSignerInterface.getFunction('signOrder')!.selector as `0x${string}`,
  condition: c.calldataMatches(
    [
      c.matches([
        oneOf(sellTokens),
        c.pass,
        c.eq(receiver),
        amountAllowanceKey ? c.withinAllowance(amountAllowanceKey) : c.pass,
        c.pass,
        c.pass,
        c.pass,
        c.pass,
        c.pass,
        c.pass,
        c.pass,
        c.pass,
      ]),
    ],
    [
      GPv2OrderStructAbi[0], // order struct
      'uint32', // validDuration
      'uint256', // feeAmountBP
    ],
  ),
})
