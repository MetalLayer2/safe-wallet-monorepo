import { id } from 'ethers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { setUpRolesMod, setUpRoles } from 'zodiac-roles-sdk'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Permission } from 'zodiac-roles-sdk'

import { SwapperRoleContracts } from './constants'
import { allowErc20Approve, allowWrappingNativeTokens, allowCreatingOrders } from './permissions'

// TODO: Set this dynamically
const SWAPPER_ADDRESS = '0xB5E64e857bb7b5350196C5BAc8d639ceC1072745'
export const SWAPPER_ROLE_KEY = 'SafeSwapperRole'

const SafeInterface = Safe__factory.createInterface()

function isSupportChain(chainId: string): chainId is keyof typeof SwapperRoleContracts {
  return chainId in SwapperRoleContracts
}

function getSaltNonce(): `0x${string}` {
  return id('Vibez' + Date.now()) as `0x${string}`
}

export function enableSwapper(safe: SafeInfo): Array<MetaTransactionData> {
  if (!isSupportChain(safe.chainId)) {
    throw new Error('Unsupported chain')
  }

  const transactions = setUpRolesMod({
    avatar: safe.address.value as `0x${string}`,
    saltNonce: getSaltNonce(),
  })

  const enableModule = transactions.find((transaction) => {
    const fragment = SafeInterface.getFunction('enableModule')
    return fragment && transaction.data.startsWith(fragment.selector)
  })

  if (!enableModule) {
    throw new Error('No enableModule not found')
  }

  const [rolesModifierAddress] = SafeInterface.decodeFunctionData('enableModule', enableModule.data)

  const permissions: Array<Permission> = []

  // Allow ERC-20 approve for CowSwap on WETH
  permissions.push(
    ...allowErc20Approve(
      [SwapperRoleContracts[safe.chainId].weth],
      [SwapperRoleContracts[safe.chainId].cowSwap.gpv2VaultRelayer],
    ),
  )

  // Allow wrapping of WETH
  permissions.push(allowWrappingNativeTokens(SwapperRoleContracts[safe.chainId].weth))

  // Allow creating orders using OrderSigner
  permissions.push(
    allowCreatingOrders(safe.chainId, [SwapperRoleContracts[safe.chainId].weth], safe.address.value as `0x${string}`),
  )

  transactions.push(
    ...setUpRoles({
      address: rolesModifierAddress,
      roles: [
        {
          key: SWAPPER_ROLE_KEY,
          members: [SWAPPER_ADDRESS],
          permissions,
        },
      ],
    }),
  )

  return transactions
}
