import CheckWallet from '@/components/common/CheckWallet'
import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { TxModalContext } from '@/components/tx-flow'
import { PoliciesState } from '@/features/policies/store/policiesSlice'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Box, IconButton, Skeleton, SvgIcon, Typography } from '@mui/material'
import { useContext, useMemo } from 'react'

const SKELETON_ROWS = new Array(3).fill('').map(() => {
  return {
    cells: {
      target: {
        rawValue: '',
        content: (
          <Box display="flex" flexDirection="row" gap={1} alignItems="center">
            <Skeleton variant="circular" width={26} height={26} />
            <div>
              <Typography>
                <Skeleton width={75} />
              </Typography>
              <Typography>
                <Skeleton width={300} />
              </Typography>
            </div>
          </Box>
        ),
      },
      policyType: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
      selector: {
        rawValue: '',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
    },
  }
})

const PoliciesTable = ({ policies, isLoading }: { policies: PoliciesState[]; isLoading: boolean }) => {
  const { setTxFlow } = useContext(TxModalContext)

  const headCells = useMemo(
    () => [
      { id: 'target', label: 'Target' },
      { id: 'policyType', label: 'Policy' },
      { id: 'selector', label: 'Selector' },
      { id: 'actions', label: 'Actions', sticky: true },
    ],
    [],
  )

  const rows = useMemo(
    () =>
      isLoading
        ? SKELETON_ROWS
        : policies.map((policy) => {
            return {
              cells: {
                target: {
                  rawValue: policy.targetAddress,
                  content: <EthHashInfo address={policy.targetAddress} shortAddress={false} hasExplorer showCopyButton />,
                },
                policyType: {
                  rawValue: policy.policyType,
                  content: <Typography>{policy.policyType}</Typography>,
                },
                selector: {
                  rawValue: policy.selector,
                  content: <Typography>{policy.selector}</Typography>,
                },
                actions: {
                  rawValue: '',
                  sticky: true,
                  content: (
                    <CheckWallet>
                      {(isOk) => (
                        <IconButton
                          data-testid="delete-btn"
                          //onClick={() => setTxFlow(<RemovePolicyFlow policy={policy} />)}
                          color="error"
                          size="small"
                          disabled={!isOk}
                        >
                          <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                        </IconButton>
                      )}
                    </CheckWallet>
                  ),
                },
              },
            }
          }),
    [isLoading, setTxFlow, policies],
  )
  return policies.length > 0 ? <EnhancedTable rows={rows} headCells={headCells} /> : null
}

export default PoliciesTable
