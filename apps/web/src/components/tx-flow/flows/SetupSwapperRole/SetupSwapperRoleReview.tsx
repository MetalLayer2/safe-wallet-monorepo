import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { enableSwapper } from './transactions/enable'
import { SafeTxContext } from '../../SafeTxProvider'
import TxCard from '../../common/TxCard'

const SetupSwapperRoleReview = ({ onSubmit }: { onSubmit: () => void }): ReactElement => {
  const { safe } = useSafeInfo()
  const sdk = useSafeSDK()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    if (!sdk) return

    const createTx = async () => {
      return await sdk.createTransaction({ transactions: enableSwapper(safe), onlyCalls: true })
    }

    createTx().then(setSafeTx).catch(setSafeTxError)
  }, [sdk, safe.address.value, setSafeTx, safe, setSafeTxError])

  return (
    <TxCard>
      <ReviewTransaction onSubmit={onSubmit} />
    </TxCard>
  )
}

export default SetupSwapperRoleReview
