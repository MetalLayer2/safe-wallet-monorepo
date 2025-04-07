import { id, Interface } from 'ethers'
import { encodeRoleKey } from 'zodiac-roles-sdk'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk/dist/types'

import { CowOrderSignerAbi, isSwapperRoleChain, SwapperRoleContracts } from './constants'
import { SWAPPER_ROLE_KEY } from './constants'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'

const COW_SWAP_API = {
  ['11155111']: 'https://api.cow.fi/sepolia',
}

// setTransactionUnwrapper is called with this by default in setUpRolesMod
const MULTI_SEND = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526'

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const GPv2Interface = new Interface(['function setPreSignature(bytes,bool)'])
const MultiSendInterface = Multi_send__factory.createInterface()
const RolesModifierInterface = new Interface([
  'function execTransactionWithRole(address,uint256,bytes,uint8,bytes32,bool)',
])

export async function signAsSwapper(
  wallet: ConnectedWallet,
  transactions: Array<BaseTransaction>,
  safeInfo: SafeInfo,
  swapperRoleMod: string,
) {
  const txs = await Promise.all(
    transactions.map(async (transaction) => {
      const isSetPreSignature = transaction.data.startsWith(GPv2Interface.getFunction('setPreSignature')!.selector)
      if (!isSetPreSignature) {
        return {
          ...transaction,
          operation: 0,
        }
      }

      if (!isSwapperRoleChain(wallet.chainId)) {
        throw new Error('Unsupported chain')
      }

      const [orderUid] = GPv2Interface.decodeFunctionData('setPreSignature', transaction.data)
      const order = await fetch(`${COW_SWAP_API[wallet.chainId]}/api/v1/orders/${orderUid}`).then((res) => res.json())

      const signOrderData = CowOrderSignerInterface.encodeFunctionData('signOrder', [
        [
          order.sellToken,
          order.buyToken,
          order.receiver,
          order.sellAmount,
          order.buyAmount,
          order.validTo,
          order.appData,
          order.feeAmount,
          id(order.kind),
          order.partiallyFillable,
          id(order.sellTokenBalance),
          id(order.buyTokenBalance),
        ],
        order.validTo,
        order.feeAmount,
      ])

      return {
        to: SwapperRoleContracts[wallet.chainId].cowSwap.orderSigner,
        data: signOrderData,
        value: '0',
        // signOrder requires delegate call
        operation: 1,
      }
    }),
  )

  const isMultiSend = txs.length > 1

  const recipient = isMultiSend ? MULTI_SEND : txs[0].to
  const data = isMultiSend
    ? MultiSendInterface.encodeFunctionData('multiSend', [encodeMultiSendData(txs)])
    : txs[0].data

  const execTransactionWithRoleData = RolesModifierInterface.encodeFunctionData('execTransactionWithRole', [
    recipient,
    0,
    data,
    1,
    encodeRoleKey(SWAPPER_ROLE_KEY),
    false,
  ])

  return await wallet.provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        to: swapperRoleMod,
        from: wallet.address,
        data: execTransactionWithRoleData,
        value: '0x0',
      },
    ],
  })
}
