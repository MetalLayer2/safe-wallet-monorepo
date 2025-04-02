import { type ReactElement, useMemo } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '../../useTxStepper'
import { TxFlowType } from '@/services/analytics'
import SetupSwapperRoleInfo from './SetupSwapperRoleInfo'
import SetupSwapperRoleReview from './SetupSwapperRoleReview'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

const SetupSwapperRole = (): ReactElement => {
  const { data, step, nextStep, prevStep } = useTxStepper({}, TxFlowType.SETUP_SWAPPER_ROLE)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Setup Swapper Role' },
        content: <SetupSwapperRoleInfo onSubmit={() => nextStep({})} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <SetupSwapperRoleReview onSubmit={() => nextStep({})} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails onSubmit={() => {}} isMassPayout={false} />,
      },
    ],
    [nextStep],
  )

  return (
    <TxLayout subtitle="Configure Swapper Role" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default SetupSwapperRole
