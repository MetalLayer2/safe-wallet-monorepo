import React, { type ComponentType, type PropsWithChildren, type ReactNode } from 'react'
import { CallbackFn } from './TxFlowProvider'

const AppendElements = <T extends object = {}>({
  children,
  append = [],
  props,
}: {
  children?: ReactNode
  append?: Array<ComponentType<T>>
  props: T
}) => {
  const [First, ...rest] = append

  if (!!First) {
    return (
      <AppendElements append={rest} props={props}>
        {children}
        <First {...props} />
      </AppendElements>
    )
  }

  return children
}

const withActions = <
  T extends unknown,
  P extends object,
  ActionProps extends { onSubmit: CallbackFn<T> } = { onSubmit: CallbackFn<T> },
>(
  WrappedComponent: ComponentType<P & { actions: ReactNode }>,
  applyActions?: Array<(props: ActionProps) => ReactNode>,
) => {
  return function WithActionsComponent(props: P & { onSubmit?: CallbackFn<T> }) {
    const { onSubmit } = props
    const actions = <AppendElements append={applyActions} props={{ onSubmit } as ActionProps} />

    return <WrappedComponent {...props} actions={actions} />
  }
}

const withFeatures = <P extends PropsWithChildren>(
  WrappedComponent: ComponentType<P>,
  applyFeatures?: Array<(props: any) => ReactNode>,
) => {
  return function WithFeaturesComponent(props: P) {
    const content = (
      <AppendElements append={applyFeatures} props={{}}>
        {props.children}
      </AppendElements>
    )

    return <WrappedComponent {...props}>{content}</WrappedComponent>
  }
}

export const withMiddlewares = <
  T extends unknown,
  P extends PropsWithChildren<{ onSubmit?: CallbackFn<T> | (() => void); actions?: ReactNode }>,
>(
  WrappedComponent: ComponentType<P>,
  applyFeatures?: Array<(props: any) => ReactNode>,
  applyActions?: Array<(props: any) => ReactNode>,
) => {
  const WithFeatures = withFeatures(WrappedComponent, applyFeatures)
  const WithMiddlewares = withActions<T, P>(WithFeatures, applyActions)

  return function WithMiddlewaresComponent({ onSubmit, ...props }: P & { onSubmit?: CallbackFn<T> | (() => void) }) {
    return <WithMiddlewares {...(props as P)} onSubmit={onSubmit} />
  }
}
