import { useEffect, type ReactElement } from 'react'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { type MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { SafeTxContext } from '../../SafeTxProvider'
import { useContext } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '../../common/TxCard'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

import { type Permission, setUpRoles, setUpRolesMod } from 'zodiac-roles-sdk'
import { SwapperRoleContracts } from './constants'
import { allowCreatingOrders, allowErc20Approve, allowWrappingNativeTokens } from './permissions'
import { ethers, id, keccak256 } from 'ethers'

const SafeInterface = Safe__factory.createInterface()

const SWAPPER_ADDRESS = '0xB5E64e857bb7b5350196C5BAc8d639ceC1072745'

const SetupSwapperRoleReview = ({ onSubmit }: { onSubmit: () => void }): ReactElement => {
  const { safe } = useSafeInfo()
  const sdk = useSafeSDK()
  const { setSafeTx } = useContext(SafeTxContext)

  useEffect(() => {
    const createTx = async () => {
      if (!sdk) return

      const txs: MetaTransactionData[] = setUpRolesMod({
        avatar: safe.address.value as `0x${string}`,
        saltNonce: id('Vibez' + Date.now()) as `0x${string}`,
      })

      const rolesModifierAddress = SafeInterface.decodeFunctionData(
        'enableModule',
        txs[txs.length - 1].data,
      )[0] as `0x${string}`

      // create example persmission using zodiac roles modifier
      const permissions: Permission[] = []

      // Allow ERC20 approve for CowSwap on WETH
      permissions.push(
        ...allowErc20Approve(
          [SwapperRoleContracts['11155111'].weth],
          [SwapperRoleContracts['11155111'].cowSwap.gpv2VaultRelayer],
        ),
      )

      // Allow wrapping of WETH
      permissions.push(allowWrappingNativeTokens(SwapperRoleContracts['11155111'].weth))

      // Allow creating orders using OrderSigner
      permissions.push(
        allowCreatingOrders('11155111', [SwapperRoleContracts['11155111'].weth], safe.address.value as `0x${string}`),
      )

      txs.push(
        ...setUpRoles({
          address: rolesModifierAddress,
          roles: [
            {
              key: 'SafeSwapperRole',
              members: [SWAPPER_ADDRESS],
              permissions,
            },
          ],
        }),
      )

      const tx = await sdk.createTransaction({ transactions: txs, onlyCalls: true })
      setSafeTx(tx)
    }

    createTx()
  }, [sdk, safe.address.value, setSafeTx])

  return (
    <TxCard>
      <ReviewTransaction onSubmit={onSubmit} />
    </TxCard>
  )
}

export default SetupSwapperRoleReview
