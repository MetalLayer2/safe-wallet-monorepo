import { Typography, CardActions, Button, Select, MenuItem, Grid2, IconButton, SvgIcon } from '@mui/material'
import { Fragment } from 'react'
import { useForm, useFieldArray, FormProvider, Controller, useFormContext } from 'react-hook-form'
import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import TxCard from '../../common/TxCard'
import type { SetupSwapperRoleData } from '.'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'

export function SetupSwapperRoleAllowances({
  data,
  onSubmit,
}: {
  data: SetupSwapperRoleData
  onSubmit: (data: SetupSwapperRoleData) => void
}): ReactElement {
  const formData = useForm<SetupSwapperRoleData>({
    values: data,
    mode: 'onChange',
    defaultValues: data,
  })

  const sellFieldArray = useFieldArray({
    control: formData.control,
    name: 'sell',
  })

  const buyFieldArray = useFieldArray({
    control: formData.control,
    name: 'buy',
  })

  const { balances: visibleBalances } = useVisibleBalances()

  return (
    <TxCard>
      <FormProvider {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <Typography fontWeight={700}>Sell limits</Typography>
          <Typography mb={2}>Set the amount a Swapper can sell.</Typography>
          <SetupSwapperRoleAllowancesByType type="sell" fieldArray={sellFieldArray} balances={visibleBalances} />

          <Typography fontWeight={700}>Buy limits</Typography>
          <Typography mb={2}>Set the amount a Swapper can buy.</Typography>
          <SetupSwapperRoleAllowancesByType type="buy" fieldArray={buyFieldArray} balances={visibleBalances} />

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

export const SwapperRolePeriodsInSeconds = [
  {
    value: 0,
    label: 'No limit',
  },
  {
    value: 60 * 60 * 24,
    label: 'Daily',
  },
  {
    value: 60 * 60 * 24 * 7,
    label: 'Weekly',
  },
  {
    value: 60 * 60 * 24 * 30,
    label: 'Monthly',
  },
]

function SetupSwapperRoleAllowancesByType({
  type,
  fieldArray,
  balances,
}: {
  type: 'sell' | 'buy'
  fieldArray: UseFieldArrayReturn<SetupSwapperRoleData, 'sell' | 'buy', 'id'>
  balances: SafeBalanceResponse
}) {
  const formData = useFormContext()

  return (
    <>
      <Grid2 container spacing={3}>
        {fieldArray.fields.map((field, index) => (
          <Fragment key={field.id}>
            <Grid2 size={{ xs: 8 }}>
              <TokenAmountInput
                fieldArray={{ name: type, index }}
                balances={balances.items}
                selectedToken={balances.items.find((b) => b.tokenInfo.address === field.tokenAddress)}
              />
            </Grid2>

            <Grid2 size={{ xs: 3 }}>
              <Controller
                name={`${type}.${index}.periodInSeconds`}
                control={formData.control}
                render={({ field }) => (
                  <Select fullWidth {...field}>
                    {SwapperRolePeriodsInSeconds.map(({ value, label }) => (
                      <MenuItem key={label} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Grid2>

            <Grid2 size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {index > 0 && (
                <IconButton onClick={() => fieldArray.remove(index)}>
                  <SvgIcon component={DeleteIcon} inheritViewBox />
                </IconButton>
              )}
            </Grid2>
          </Fragment>
        ))}
      </Grid2>

      <Button
        onClick={() =>
          fieldArray.append({
            tokenAddress: '',
            periodInSeconds: 0,
            amount: '0',
          })
        }
        variant="text"
        startIcon={<SvgIcon component={AddIcon} inheritViewBox />}
      >
        Add token limit
      </Button>
    </>
  )
}
