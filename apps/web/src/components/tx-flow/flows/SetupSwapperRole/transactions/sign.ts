import { id, Interface } from 'ethers'
import { encodeRoleKey } from 'zodiac-roles-sdk'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk/dist/types'

import { CowOrderSignerAbi, SwapperRoleContracts } from './constants'
import { SWAPPER_ROLE_KEY } from './enable'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

const COW_SWAP_API = {
  ['11155111']: 'https://api.cow.fi/sepolia',
}

const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const GPv2Interface = new Interface(['function setPreSignature(bytes,bool)'])
const RolesModifierInterface = new Interface([
  'function execTransactionWithRoleReturnData(address,uint256,bytes,uint8,bytes32,bool)',
])

function isSupportChain(chainId: string): chainId is keyof typeof COW_SWAP_API & keyof typeof SwapperRoleContracts {
  return chainId in COW_SWAP_API && chainId in SwapperRoleContracts
}

export async function signAsSwapper(wallet: ConnectedWallet, transactions: Array<BaseTransaction>) {
  const setPreSignature = transactions.find((tx) => {
    const fragment = GPv2Interface.getFunction('setPreSignature')
    return fragment && tx.data.startsWith(fragment.selector)
  })

  if (!setPreSignature) {
    return
  }

  if (!isSupportChain(wallet.chainId)) {
    throw new Error('Unsupported chain')
  }

  const [orderUid] = GPv2Interface.decodeFunctionData('setPreSignature', setPreSignature.data)
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

  const execTransactionWithRoleData = RolesModifierInterface.encodeFunctionData('execTransactionWithRole', [
    SwapperRoleContracts[wallet.chainId].cowSwap.orderSigner,
    0,
    signOrderData,
    1,
    encodeRoleKey(SWAPPER_ROLE_KEY),
    false,
  ])

  return await wallet.provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        // TODO: Fetch role modifier from SafeInfo
        to: '0x67fdBb46AD5e85ade9E129D1E7E7fAFA2789949B',
        from: wallet.address,
        data: execTransactionWithRoleData,
        value: '0x0',
      },
    ],
  })
}
