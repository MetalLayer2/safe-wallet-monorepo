import { useCallback, useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { SafeAppsTxParams } from '.'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isTxValid } from '@/components/safe-apps/utils'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { PRE_SIGN_SIGHASH } from '@/features/swap'
import useAsync from '@/hooks/useAsync'
import { AbiCoder, id, Interface } from 'ethers'
import { Button } from '@mui/material'
import { CowOrderSignerAbi, SwapperRoleContracts } from '../SetupSwapperRole/constants'
import useWallet from '@/hooks/wallets/useWallet'
import { fetchRole } from 'zodiac-roles-sdk'

const setPreSignatureInterface = new Interface(['function setPreSignature(bytes,bool)'])
const CowOrderSignerInterface = new Interface(CowOrderSignerAbi)
const rolesExecTransactionWithRoleReturnDataInterface = new Interface([
  'function execTransactionWithRoleReturnData(address,uint256,bytes,uint8,bytes32,bool)',
])
type ReviewSafeAppsTxProps = {
  safeAppsTx: SafeAppsTxParams
  onSubmit: () => void
  origin?: string
}

const ReviewSafeAppsTx = ({ safeAppsTx: { txs, params }, onSubmit, origin }: ReviewSafeAppsTxProps): ReactElement => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)

  const wallet = useWallet()

  useHighlightHiddenTab()

  const [order] = useAsync(async () => {
    const setPreSignature = txs.find((tx) => {
      return tx.data.startsWith(PRE_SIGN_SIGHASH)
    })

    if (!setPreSignature) {
      return
    }

    const [orderUid] = setPreSignatureInterface.decodeFunctionData(PRE_SIGN_SIGHASH, setPreSignature.data)

    const baseUrl = 'https://api.cow.fi/sepolia'

    return fetch(`${baseUrl}/api/v1/orders/${orderUid}`).then((res) => res.json())
  }, [txs])

  const signOrderData = useMemo(() => {
    if (!order) {
      return
    }

    return CowOrderSignerInterface.encodeFunctionData('signOrder', [
      [
        order.sellToken,
        order.buyToken,
        order.receiver,
        order.sellAmount,
        order.buyAmount,
        order.validTo,
        order.appData,
        order.feeAmount,
        id(order.kind),
        order.partiallyFillable,
        id(order.sellTokenBalance),
        id(order.buyTokenBalance),
      ],
      order.validTo,
      order.feeAmount,
    ])
  }, [order])

  const vibeExecuteTx = useCallback(() => {
    if (!signOrderData || !wallet) {
      return
    }
    const newSetPreSignature = rolesExecTransactionWithRoleReturnDataInterface.encodeFunctionData(
      'execTransactionWithRoleReturnData',
      [
        SwapperRoleContracts['11155111'].cowSwap.orderSigner,
        0,
        signOrderData,
        1,
        // Keccak256 hash of 'SafeSwapperRole'
        '0x5361666553776170706572526f6c650000000000000000000000000000000000',
        false,
      ],
    )

    wallet.provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          // TODO: Fetch role modifier from SafeInfo
          to: '0x67fdBb46AD5e85ade9E129D1E7E7fAFA2789949B',
          from: wallet.address,
          data: newSetPreSignature,
          value: '0x0',
        },
      ],
    })

    return newSetPreSignature
  }, [signOrderData, wallet])

  useEffect(() => {
    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = txs.length > 1
      const tx = isMultiSend ? await createMultiSendCallOnlyTx(txs) : await createTx(txs[0])

      if (params?.safeTxGas !== undefined) {
        // FIXME: do it properly via the Core SDK
        // @ts-expect-error safeTxGas readonly
        tx.data.safeTxGas = params.safeTxGas
      }

      return tx
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [txs, setSafeTx, setSafeTxError, params])

  const error = !isTxValid(txs)

  return (
    <ReviewTransaction onSubmit={onSubmit} origin={origin} showMethodCall>
      {signOrderData && (
        <Button variant="contained" onClick={vibeExecuteTx}>
          Vibe Swap now!
        </Button>
      )}

      {error ? (
        <ErrorMessage error={safeTxError}>
          This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of
          this Safe App for more information.
        </ErrorMessage>
      ) : null}
    </ReviewTransaction>
  )
}

export default ReviewSafeAppsTx
