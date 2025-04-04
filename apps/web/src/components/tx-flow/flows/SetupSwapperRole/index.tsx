import { type ReactElement, useMemo } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '../../useTxStepper'
import SetupSwapperRoleInfo from './SetupSwapperRoleInfo'
import SetupSwapperRoleReview from './SetupSwapperRoleReview'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

export type SetupSwapperRoleData = {
  swapperAddress: string
}

const SetupSwapperRole = (): ReactElement => {
  const { data, step, nextStep, prevStep } = useTxStepper<SetupSwapperRoleData>({
    swapperAddress: '',
  })

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Setup Swapper Role' },
        content: <SetupSwapperRoleInfo data={data} onSubmit={(data: SetupSwapperRoleData) => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <SetupSwapperRoleReview data={data} onSubmit={(data: SetupSwapperRoleData) => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails onSubmit={() => {}} isMassPayout={false} />,
      },
    ],
    [data, nextStep],
  )

  return (
    <TxLayout subtitle="Configure Swapper Role" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default SetupSwapperRole
