import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { createConfigurePolicyTx, createConfirmPolicyTx, PolicyType } from '@/features/policies/contracts/policyContracts'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createEnableGuardTx, createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { ExtendedSafeInfo, selectPolicies } from '@/store/slices'
import { sameAddress } from '@/utils/addresses'
import { Typography } from '@mui/material'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { useContext, useEffect } from 'react'
import { defaultValues, type AddPolicyFlowProps } from '.'
import { POLICY_TYPE_OPTIONS } from './CreatePolicy'
import SendToBlock from '@/components/tx/SendToBlock'
import FieldsGrid from '@/components/tx/FieldsGrid'

const createNewPolicyTx = async (
  params: AddPolicyFlowProps,
  safe: ExtendedSafeInfo,
) => {
  const sdk = getSafeSDK()
  if (!sdk) return

  const safePolicyGuardAddress = policyContracts.safePolicyGuard
  const policyAddress = policyContracts.policies[params.policyType]
  if (!safePolicyGuardAddress || !policyAddress) return

  const currentGuard = await sdk.getGuard()
  const isGuardEnabled = sameAddress(currentGuard, safePolicyGuardAddress)

  const txs: MetaTransactionData[] = []

  if (!isGuardEnabled) {
    const enableGuardTx = await createEnableGuardTx(safePolicyGuardAddress)
    const tx = {
      to: enableGuardTx.data.to,
      value: '0',
      data: enableGuardTx.data.data,
    }
    txs.push(tx)
  }

  const configurePolicyTx = createConfigurePolicyTx({
    targetAddress: params.targetAddress,
    selector: params.selector,
    safePolicyGuardAddress,
    operation: params.operation,
    policyAddress,
    data: params.data
  })
  txs.push(configurePolicyTx)

  // TODO: If DELAY === 0
  const confirmPolicyTx = createConfirmPolicyTx({
    safeAddress: safe.address.value,
    target: params.targetAddress,
    selector: params.selector,
    operation: params.operation,
    policyAddress,
    data: params.data
  })
  txs.push(confirmPolicyTx)

  return createMultiSendCallOnlyTx(txs)
}

const ReviewPolicy = ({ params, onSubmit }: { params: AddPolicyFlowProps; onSubmit: () => void }) => {
  const { safe } = useSafeInfo()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createNewPolicyTx(
      params,
      safe
    )
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [
    params,
    safe,
    setSafeTx,
    setSafeTxError,
  ])

  const onFormSubmit = () => {
    onSubmit()
  }

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <FieldsGrid title="Policy type:">
        <Typography variant="body1">
          {POLICY_TYPE_OPTIONS.find((policyType) => policyType.value === params.policyType)?.label}
        </Typography>
      </FieldsGrid>

      {params.targetAddress && (
        <SendToBlock address={params.targetAddress} title="Target address:" />
      )}

      {params.selector !== '0x00000000' && (
        <FieldsGrid title="Selector:">
          <Typography
            component="span"
            variant="body2"
            alignContent="center"
            color="primary.light"
            py={0.5}
            px={1}
            borderRadius={0.5}
            bgcolor="background.light"
          >
            {params.selector}
          </Typography>
        </FieldsGrid>
      )}

      {params.data !== defaultValues.data && (
        <FieldsGrid title="Data:">
          <Typography variant="body1">{params.data}</Typography>
        </FieldsGrid>
      )}

      {/*params.tokenAddress && (
        <SendAmountBlock
          title="Token"
          amountInWei={0}
          tokenInfo={{
            address: params.tokenAddress,
            decimals: 18,
            symbol: 'TKN',
            logoUri: '',
            type: 'ERC20',
          }}
        />
      )*/}
    </ReviewTransaction>
  )
}

export default ReviewPolicy
