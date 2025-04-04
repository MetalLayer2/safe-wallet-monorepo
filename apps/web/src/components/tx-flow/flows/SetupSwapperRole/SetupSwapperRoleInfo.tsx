import { type ReactElement } from 'react'
import { Box, Button, CardActions, Typography } from '@mui/material'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { FormProvider, useForm } from 'react-hook-form'

const SetupSwapperRoleInfo = ({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement => {
  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
  })

  const { handleSubmit } = formData

  const onFormSubmit = handleSubmit((data) => {
    console.log('onFormSubmit', data)
    onSubmit(data)
  })

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={onFormSubmit}>
          <Box>
            <Typography variant="body1" mb={3}>
              Configure and setup Swapper Role
            </Typography>
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography>This will enable the Swapper Role module on your Safe.</Typography>
            </Box>

            <AddressBookInput name="swapperAddress" label="Swapper Address" />
          </Box>
          <CardActions>
            <Button type="submit" variant="contained">
              Continue
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default SetupSwapperRoleInfo
