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
  token: string
  amount: string
  periodInSeconds: number
}

export type SetupSwapperRoleData = {
  members: Array<{ address: string }>
  sell: Array<SwapperRoleAllowanceData>
  buy: Array<SwapperRoleAllowanceData>
}

const SEPOLIA_WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'

const SetupSwapperRole = (): ReactElement => {
  const { data, step, nextStep, prevStep } = useTxStepper<SetupSwapperRoleData>({
    members: [{ address: '' }],
    sell: [
      {
        token: SEPOLIA_WETH,
        amount: BigInt(10 ** 18 * 0.01).toString(),
        periodInSeconds: 60 * 60 * 24,
      },
    ],
    buy: [
      {
        token: SEPOLIA_WETH,
        amount: BigInt(10 ** 18 * 0.01).toString(),
        periodInSeconds: 60 * 60 * 24,
      },
    ],
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
        content: <ConfirmTxDetails onSubmit={() => {}} />,
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
