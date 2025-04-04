import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { enableSwapper } from './transactions/enable'
import { SafeTxContext } from '../../SafeTxProvider'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'

const SetupSwapperRoleReview = ({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement => {
  const { safe } = useSafeInfo()
  const sdk = useSafeSDK()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    if (!sdk) return

    const createTx = async () => {
      const transactions = await enableSwapper(safe, data.swapperAddress as `0x${string}`)
      return await sdk.createTransaction({ transactions, onlyCalls: true })
    }

    createTx().then(setSafeTx).catch(setSafeTxError)
  }, [sdk, safe.address.value, setSafeTx, safe, setSafeTxError, data.swapperAddress])

  return (
    <TxCard>
      <ReviewTransaction onSubmit={() => onSubmit(data)} />
    </TxCard>
  )
}

export default SetupSwapperRoleReview
