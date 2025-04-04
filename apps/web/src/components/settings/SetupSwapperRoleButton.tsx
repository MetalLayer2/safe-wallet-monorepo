import { useContext, type ReactElement } from 'react'
import { Button, Card, Grid2, Paper, Typography } from '@mui/material'
import { SetupSwapperRoleFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '../tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAsync from '@/hooks/useAsync'
import { fetchRolesMod } from 'zodiac-roles-deployments'

const SetupSwapperRoleButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const { safe } = useSafeInfo()

  const firstModule = safe.modules?.[0].value

  const handleClick = () => {
    setTxFlow(<SetupSwapperRoleFlow />)
  }

  const [rolesModifier] = useAsync(async () => {
    if (!firstModule) {
      return
    }
    return fetchRolesMod({ address: firstModule as `0x${string}`, chainId: Number(safe.chainId) as 11155111 })
  }, [firstModule, safe.chainId])

  return (
    <Paper sx={{ p: 4 }}>
      <Grid2
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid2 size={{ lg: 4, xs: 12 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Swapper Role
          </Typography>
        </Grid2>
        {rolesModifier && (
          <Grid2 size={{ xs: 12 }}>
            <pre>{JSON.stringify(rolesModifier, null, 3)}</pre>
          </Grid2>
        )}
        <Grid2 size={{ lg: 8, xs: 12 }}>
          <Button variant="contained" onClick={handleClick}>
            Setup Swapper Role
          </Button>
        </Grid2>
      </Grid2>
    </Paper>
  )
}

export default SetupSwapperRoleButton
