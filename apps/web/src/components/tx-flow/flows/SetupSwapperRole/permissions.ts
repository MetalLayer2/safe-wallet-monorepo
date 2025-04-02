import { c, forAll, type Permission } from 'zodiac-roles-sdk'
import { CowOrderSignerAbi, SwapperRoleContracts } from './constants'
import { Interface } from 'ethers'

const WrappedNativeTokenInterface = new Interface(['function deposit()'])
const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)

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

const orderStructAbi = [
  'tuple(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance)',
]

export const allowCreatingOrders = (
  chainId: '1' | '100' | '42161' | '11155111',
  sellTokens: `0x${string}`[],
  receiver: `0x${string}`,
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
        c.pass,
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
      orderStructAbi[0], // order struct
      'uint32', // validDuration
      'uint256', // feeAmountBP
    ],
  ),
})
