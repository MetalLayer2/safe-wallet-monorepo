import type { PropsWithChildren, ReactElement } from 'react'
import { useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxCard from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
import { BlockaidBalanceChanges } from '../security/blockaid/BlockaidBalanceChange'
import { Blockaid } from '../security/blockaid'
import { useApprovalInfos } from '../ApprovalEditor/hooks/useApprovalInfos'
import type { TransactionDetails, TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ConfirmationView from '../confirmation-views'
import UnknownContractError from '../SignOrExecuteForm/UnknownContractError'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotName, useSlot } from '@/components/tx-flow/slots'
import { Sign } from '@/components/tx-flow/actions/Sign'

export type ReviewTransactionContentProps = PropsWithChildren<{
  onSubmit: () => void
  isBatch?: boolean
}>

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  onSubmit,
  isBatch,
  children,
  txId,
  txDetails,
  txPreview,
}: ReviewTransactionContentProps & {
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
  isCreation?: boolean
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
  txId?: string
}): ReactElement => {
  const { willExecute, isCreation, showMethodCall, isProposing, isRejection } = useContext(TxFlowContext)

  const [{ Component: SubmitComponent } = {}] = useSlot(SlotName.Submit)

  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const features = useSlot(SlotName.Feature)
  const footerFeatures = useSlot(SlotName.Footer)

  return (
    <>
      <TxCard>
        {children}

        <ConfirmationView
          txId={txId}
          isCreation={isCreation}
          txDetails={txDetails}
          txPreview={txPreview}
          safeTx={safeTx}
          isBatch={isBatch}
          showMethodCall={showMethodCall}
          isApproval={isApproval}
        >
          {!isRejection && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              {isApproval && <ApprovalEditor safeTransaction={safeTx} />}
            </ErrorBoundary>
          )}
        </ConfirmationView>

        {!isCounterfactualSafe && !isRejection && <BlockaidBalanceChanges />}
      </TxCard>

      {features.map(({ Component }, i) => (
        <Component key={`feature-${i}`} />
      ))}

      <TxCard>
        <ConfirmationTitle
          variant={
            isProposing
              ? ConfirmationTitleTypes.propose
              : willExecute
                ? ConfirmationTitleTypes.execute
                : ConfirmationTitleTypes.sign
          }
          isCreation={isCreation}
        />

        {safeTxError && (
          <ErrorMessage error={safeTxError}>
            This transaction will most likely fail. To save gas costs, avoid confirming the transaction.
          </ErrorMessage>
        )}

        {footerFeatures.map(({ Component }, i) => (
          <Component key={`footer-feature-${i}`} />
        ))}

        <NetworkWarning />

        <UnknownContractError txData={txDetails?.txData ?? txPreview?.txData} />

        <Blockaid />

        {SubmitComponent ? (
          <SubmitComponent onSubmit={onSubmit} />
        ) : (
          <Sign onSubmit={onSubmit} options={[{ id: 'sign', label: 'Sign' }]} onChange={() => {}} />
        )}
      </TxCard>
    </>
  )
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(ReviewTransactionContent, {
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
})
