import { Fragment, type ReactElement } from 'react'
import { Button, CardActions, Grid2, IconButton, SvgIcon, Typography } from '@mui/material'
import TxCard from '../../common/TxCard'
import { type SetupSwapperRoleData } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'

const SetupSwapperRoleMembers = ({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement => {
  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  const { fields, append, remove } = useFieldArray({
    control: formData.control,
    name: 'members',
  })

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <Typography>Configure Swappers that will be allowed to swap without signatures.</Typography>

          <Grid2 container spacing={3} sx={{ my: 2 }}>
            {fields.map((field, index) => (
              <Fragment key={field.id}>
                <Grid2 size={{ xs: 11 }}>
                  <AddressBookInput name={`members.${index}.address`} label={`Swapper Address ${index + 1}`} />
                </Grid2>

                <Grid2 size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {index > 0 && (
                    <IconButton onClick={() => remove(index)}>
                      <SvgIcon component={DeleteIcon} inheritViewBox />
                    </IconButton>
                  )}
                </Grid2>
              </Fragment>
            ))}
          </Grid2>

          <Button
            onClick={() => append({ address: '' })}
            variant="text"
            startIcon={<SvgIcon component={AddIcon} inheritViewBox />}
          >
            Add Swapper
          </Button>

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

export default SetupSwapperRoleMembers
