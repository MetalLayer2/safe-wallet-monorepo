import { type ReactElement } from 'react'
import { Box, Button, CardActions, Typography } from '@mui/material'
import TxCard from '../../common/TxCard'

const SetupSwapperRoleInfo = ({ onSubmit }: { onSubmit: () => void }): ReactElement => {
  return (
    <TxCard>
      <Box>
        <Typography variant="body1" mb={3}>
          Configure and setup Swapper Role
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Typography>This will enable the Swapper Role module on your Safe.</Typography>
        </Box>
      </Box>
      <CardActions>
        <Button onClick={onSubmit} variant="contained">
          Continue
        </Button>
      </CardActions>
    </TxCard>
  )
}

export default SetupSwapperRoleInfo
