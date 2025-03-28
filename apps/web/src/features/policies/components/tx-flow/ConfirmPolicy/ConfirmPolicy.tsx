import TxLayout, { TxStep } from '@/components/tx-flow/common/TxLayout'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'
import { PolicyEvent } from '../../PoliciesSettings/PoliciesSettings'
import { AddPoliciesParams } from '../AddPolicy'
import ReviewPolicy from '../AddPolicy/ReviewPolicy'
import useTxStepper from '@/components/tx-flow/useTxStepper'

const ConfimPolicyFlow = ({ policy }: { policy: AddPoliciesParams }) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewPolicy key={0} params={policy} onSubmit={() => nextStep(undefined)} confirmPolicies />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, policy],
  )

  return (
    <TxLayout subtitle="Confirm policy" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ConfimPolicyFlow
