import React, { ComponentType, PropsWithChildren, type ReactNode } from 'react'
import useTxStepper from '../tx-flow/useTxStepper'
import SafeTxProvider from '../tx-flow/SafeTxProvider'
import { TxInfoProvider } from '../tx-flow/TxInfoProvider'
import { TxSecurityProvider } from '../tx/security/shared/TxSecurityContext'
import TxFlowProvider, { type CallbackFn, type TxFlowContextType } from './TxFlowProvider'
import { StepContent } from './StepContent'
import { withMiddlewares } from './withMiddlewares'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxDetails } from '../tx/ConfirmTxDetailsV2'
import { Batching } from './features'
import { Counterfactual, Execute, ExecuteThroughRole, Propose, Sign } from './actions'

type ComponentWithChildren<T> = ComponentType<PropsWithChildren<T>>

export type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallbackPropsWithData<T extends unknown> = SubmitCallbackProps & { data?: T }

export type SubmitCallback = CallbackFn<SubmitCallbackProps>
export type SubmitCallbackWithData<T> = CallbackFn<SubmitCallbackPropsWithData<T>>

type TxFlowProps<T extends unknown> = {
  commonSteps?:
    | [
        ...Array<ComponentWithChildren<{ onSubmit: (args?: T) => void }>>,
        ComponentWithChildren<{ onSubmit: SubmitCallback }>,
      ]
    | []
}

export const createTxFlow = <T extends unknown>({ commonSteps = [] }: TxFlowProps<T>) => {
  const TxFlow = ({
    children = [],
    initialData,
    txId,
    onSubmit,
    onlyExecute,
    isExecutable,
    showMethodCall,
    ...txLayoutProps
  }: {
    children?: ReactNode[] | ReactNode
    initialData?: T
    txId?: string
    onSubmit?: SubmitCallbackWithData<T>
    onlyExecute?: boolean
    isExecutable?: boolean
    showMethodCall?: boolean
  } & TxFlowContextType['txLayoutProps']) => {
    const { step, data, nextStep, prevStep } = useTxStepper(initialData, 'test') // TODO: replace 'test' string

    const childrenArray = Array.isArray(children) ? children : [children]

    const extraSteps = commonSteps.slice(0, -1) as ComponentWithChildren<{ onSubmit: (args?: T) => void }>[]
    const [LastStep] = commonSteps.slice(-1) as [ComponentWithChildren<{ onSubmit: SubmitCallback }>] | []

    const steps = [
      ...childrenArray,
      ...extraSteps.map((Component) => <Component onSubmit={nextStep} />),
      LastStep && <LastStep onSubmit={(props = {}) => onSubmit?.({ ...props, data })} />,
    ]

    const progress = Math.round(((step + 1) / steps.length) * 100)

    return (
      <SafeTxProvider>
        <TxInfoProvider>
          <TxSecurityProvider>
            <TxFlowProvider
              step={step}
              data={data}
              nextStep={nextStep}
              prevStep={prevStep}
              progress={progress}
              txId={txId}
              txLayoutProps={txLayoutProps}
              onlyExecute={onlyExecute}
              isExecutable={isExecutable}
              showMethodCall={showMethodCall}
            >
              <StepContent>{steps[step]}</StepContent>
            </TxFlowProvider>
          </TxSecurityProvider>
        </TxInfoProvider>
      </SafeTxProvider>
    )
  }

  return TxFlow
}

export const createDefaultTxFlow = <T extends unknown>(
  ReviewTransactionComponent: ComponentWithChildren<{ onSubmit: (args?: T) => void }> = ReviewTransaction,
  TxReceiptComponent: ComponentWithChildren<{ onSubmit: SubmitCallback }> = ConfirmTxDetails,
) =>
  createTxFlow<T>({
    commonSteps: [
      withMiddlewares(ReviewTransactionComponent, undefined, [Batching]),
      withMiddlewares(TxReceiptComponent, undefined, [Counterfactual, Execute, ExecuteThroughRole, Sign, Propose]),
    ],
  })
