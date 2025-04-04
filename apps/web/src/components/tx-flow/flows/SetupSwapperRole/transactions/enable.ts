import { id } from 'ethers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { setUpRolesMod, setUpRoles, applyAllowances } from 'zodiac-roles-sdk'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Allowance, Permission } from 'zodiac-roles-sdk'

import { SwapperRoleContracts } from './constants'
import {
  allowErc20Approve,
  allowWrappingNativeTokens,
  allowCreatingOrders,
  allowUnwrappingNativeTokens,
} from './permissions'
import { createAllowanceKey } from './allowances'

export const SWAPPER_ROLE_KEY = 'SafeSwapperRole'

const SafeInterface = Safe__factory.createInterface()

function isSupportChain(chainId: string): chainId is keyof typeof SwapperRoleContracts {
  return chainId in SwapperRoleContracts
}

export async function enableSwapper(
  safe: SafeInfo,
  swapperAddress: `0x${string}`,
): Promise<Array<MetaTransactionData>> {
  if (!isSupportChain(safe.chainId)) {
    throw new Error('Unsupported chain')
  }

  const transactions = setUpRolesMod({
    avatar: safe.address.value as `0x${string}`,
    saltNonce: id(SWAPPER_ROLE_KEY + Date.now()) as `0x${string}`,
  })

  const enableModuleFragment = SafeInterface.getFunction('enableModule')!
  const enableModule = transactions.find((transaction) => {
    return transaction.data.startsWith(enableModuleFragment.selector)
  })

  if (!enableModule) {
    throw new Error('No enableModule not found')
  }

  const [rolesModifierAddress] = SafeInterface.decodeFunctionData('enableModule', enableModule.data)

  const permissions: Array<Permission> = []

  const { weth } = SwapperRoleContracts[safe.chainId]

  // Allow ERC-20 approve for CowSwap on WETH
  permissions.push(...allowErc20Approve([weth], [SwapperRoleContracts[safe.chainId].cowSwap.gpv2VaultRelayer]))

  // Allow wrapping of WETH
  permissions.push(allowWrappingNativeTokens(weth))

  // Allow unwrapping of WETH
  permissions.push(allowUnwrappingNativeTokens(weth))

  const allowances: Allowance[] = []

  // Create allowance for WETH
  const maxAmount = BigInt(10 ** 18 * 0.01)

  const allowanceKey = createAllowanceKey({
    swapperAddress,
    tokenAddress: weth,
    buyOrSell: 'sell',
  })

  allowances.push({
    key: allowanceKey,
    balance: maxAmount,
    refill: maxAmount,
    maxRefill: maxAmount,
    period: BigInt(5 * 60),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  })

  // Apply allowances
  transactions.push(
    ...(
      await applyAllowances(allowances, {
        currentAllowances: [],
        mode: 'extend',
      })
    ).map((allowanceCallData) => ({
      data: allowanceCallData,
      to: rolesModifierAddress,
      value: '0',
    })),
  )

  // Allow creating orders using OrderSigner
  permissions.push(allowCreatingOrders(safe, [weth], allowanceKey))

  transactions.push(
    ...setUpRoles({
      address: rolesModifierAddress,
      roles: [
        {
          key: SWAPPER_ROLE_KEY,
          members: [swapperAddress],
          permissions,
        },
      ],
    }),
  )

  return transactions
}
