import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { enableSwapper } from './transactions/enable'
import { SafeTxContext } from '../../SafeTxProvider'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'

const SetupSwapperRoleReview = ({ data }: { data: SetupSwapperRoleData }): ReactElement => {
  const { safe } = useSafeInfo()
  const sdk = useSafeSDK()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    if (!sdk) return

    const createTx = async () => {
      const members = data.members.map((member) => member.address as `0x${string}`)

      const sell = data.sell.map((asset) => ({
        token: asset.token as `0x${string}`,
        periodInSeconds: asset.periodInSeconds,
        amount: BigInt(asset.amount),
        type: 'sell' as const,
      }))

      const buy = data.buy.map((asset) => ({
        token: asset.token as `0x${string}`,
        periodInSeconds: asset.periodInSeconds,
        amount: BigInt(asset.amount),
        type: 'buy' as const,
      }))

      const transactions = await enableSwapper(safe, members, [...sell, ...buy])
      return await sdk.createTransaction({ transactions, onlyCalls: true })
    }

    createTx().then(setSafeTx).catch(setSafeTxError)
  }, [sdk, safe.address.value, setSafeTx, safe, setSafeTxError, data.members, data.sell, data.buy])

  return (
    <TxCard>
      <ReviewTransaction />
    </TxCard>
  )
}

export default SetupSwapperRoleReview
