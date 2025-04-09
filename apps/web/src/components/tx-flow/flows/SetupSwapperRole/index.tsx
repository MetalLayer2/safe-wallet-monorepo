import { type ReactElement, useMemo } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '../../useTxStepper'
import SetupSwapperRoleMembers from './SetupSwapperRoleMembers'
import SetupSwapperRoleReview from './SetupSwapperRoleReview'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { SetupSwapperRoleAllowances } from './SetupSwapperRoleAllowances'
import SaveAddressIcon from '@/public/images/common/save-address.svg'

export type SwapperRoleAllowanceData = {
  tokenAddress: string
  amount: string
  periodInSeconds: number
}

export type SetupSwapperRoleData = {
  members: Array<{ name: string; address: string }>
  sell: Array<SwapperRoleAllowanceData>
  buy: Array<SwapperRoleAllowanceData>
}

const SetupSwapperRole = (): ReactElement => {
  const { data, step, nextStep, prevStep } = useTxStepper<SetupSwapperRoleData>({
    members: [{ name: '', address: '' }],
    sell: [],
    buy: [],
  })

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Swapper set up', subtitle: 'Add Swappers' },
        content: (
          <SetupSwapperRoleMembers
            data={data}
            onSubmit={(formData: SetupSwapperRoleData) => nextStep({ ...data, ...formData })}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Swapper set up', subtitle: 'Configure token limits' },
        content: (
          <SetupSwapperRoleAllowances
            data={data}
            onSubmit={(formData: SetupSwapperRoleData) => nextStep({ ...data, ...formData })}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm Swapper set up' },
        content: (
          <SetupSwapperRoleReview
            data={data}
            onSubmit={(formData: SetupSwapperRoleData) => nextStep({ ...data, ...formData })}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: (
          <ConfirmTxDetails
            onSubmit={() => {
              // TODO: Save name(s) to address book
            }}
          />
        ),
      },
    ],
    [data, nextStep],
  )

  return (
    <TxLayout
      subtitle="Configure Swapper Role"
      step={step}
      onBack={prevStep}
      icon={SaveAddressIcon}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default SetupSwapperRole
