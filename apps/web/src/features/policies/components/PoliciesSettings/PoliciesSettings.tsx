import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { selectPolicies, selectPoliciesLoading } from '@/features/policies/store/policiesSlice'
import { Box, Button, Grid, Paper, Typography } from '@mui/material'
import { useContext } from 'react'
import { useSelector } from 'react-redux'
import PoliciesTable from './PoliciesTable'

const PoliciesSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const policies = useSelector(selectPolicies)
  const policiesLoading = useSelector(selectPoliciesLoading)

  return (
    <Paper data-testid="policies-section" sx={{ p: 4, mb: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Policies
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              You can set a granular mandatory access control for this Safe Account, powered by an on-chain transaction
              guard that validates transactions against a set of policies.
            </Typography>
            <CheckWallet>
              {(isOk) => (
                <Button
                  data-testid="new-policy"
                  //onClick={() => setTxFlow(<AddPolicyFlow />)}
                  sx={{ mt: 2 }}
                  variant="contained"
                  disabled={!isOk}
                  size="small"
                >
                  New policy
                </Button>
              )}
            </CheckWallet>
          </Box>
        </Grid>
      </Grid>
      <PoliciesTable isLoading={policiesLoading} policies={policies} />
    </Paper>
  )
}

export default PoliciesSettings
