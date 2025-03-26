import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { PolicyType } from '@/features/policies/contracts/policyContracts'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { useMemo } from 'react'
import CreatePolicy from './CreatePolicy'
import ReviewPolicy from './ReviewPolicy'

export enum policyFields {
  policyType = 'policyType',
  targetAddress = 'targetAddress',
  selector = 'selector',
  operation = 'operation',
  policyAddress = 'policyAddress',
  data = 'data',
}

export type AddPolicyFlowProps = {
  [policyFields.policyType]: PolicyType
  [policyFields.policyAddress]: string
  [policyFields.targetAddress]: string
  [policyFields.selector]: string
  [policyFields.operation]: number
  [policyFields.data]: string
}

export const defaultValues: AddPolicyFlowProps = {
  policyType: PolicyType.ALLOW,
  policyAddress: policyContracts.policies.allowPolicy,
  targetAddress: '',
  selector: '',
  operation: 0,
  data: '0x',
}

const AddPolicyFlow = () => {
  const { data, step, nextStep, prevStep } = useTxStepper<AddPolicyFlowProps>(
    defaultValues,
    // TxFlowType.SETUP_POLICY, // No events tracking for now
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: <CreatePolicy key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewPolicy key={1} params={data} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Policies"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default AddPolicyFlow
