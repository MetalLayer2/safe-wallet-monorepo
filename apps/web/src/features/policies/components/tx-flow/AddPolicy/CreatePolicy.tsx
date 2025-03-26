import css from '@/components/tx/ExecuteCheckbox/styles.module.css'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Button, CardActions, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { Controller, FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { useEffect, useState } from 'react'

import AddressBookInput from '@/components/common/AddressBookInput'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import TxCard from '@/components/tx-flow/common/TxCard'
import { PolicyType } from '@/features/policies/contracts/policyContracts'
import { AddPolicyFlowProps, defaultValues, policyFields } from '.'
import policyContracts from '@/features/policies/contracts/contracts.json'
import { getMultiSendCallOnlyContractDeployment } from '@/services/contracts/deployments'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

export const POLICY_TYPE_OPTIONS = [
  { label: 'Allow', value: PolicyType.ALLOW },
  { label: 'Native transfer', value: PolicyType.NATIVE_TRANSFER },
  { label: 'ERC-20 transfer', value: PolicyType.ERC20_TRANSFER },
  { label: 'MultiSend', value: PolicyType.MULTISEND },
  { label: 'Co-signer', value: PolicyType.COSIGNER },
]

const CreateAllowPolicy = () => {
  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput data-testid="target-section" name={policyFields.targetAddress} label="Target address" required />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <NameInput data-testid="selector-section" name={policyFields.selector} label="Function selector" required />
      </FormControl>
    </>
  )
}

const CreateNativeTransferPolicy = ({ formMethods }: { formMethods: UseFormReturn<AddPolicyFlowProps> }) => {
  formMethods.setValue(policyFields.selector, '0x00000000')

  return (
    <FormControl fullWidth sx={{ mb: 3 }} required>
      <AddressBookInput data-testid="target-section" name={policyFields.targetAddress} label="Target address" required />
    </FormControl>
  )
}

const CreateErc20TransferPolicy = ({ formMethods }: { formMethods: UseFormReturn<AddPolicyFlowProps> }) => {
  formMethods.setValue(policyFields.selector, 'transfer') // TODO: get the correct selector
  
  const data = formMethods.watch(policyFields.data)

  useEffect(() => {
    if (!data) return
    formMethods.setValue(policyFields.data, JSON.stringify({ // TODO: add the correct format for the data
      recipientAddress: data,
      allowed: 1
    }))
  }, [data, formMethods])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput data-testid="target-section" name={policyFields.data} label="Target address" required />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressInput data-testid="token-section" name={policyFields.targetAddress} label="Token address" required />
      </FormControl>
    </>
  )
}

const CreateMultiSendPolicy = ({ formMethods }: { formMethods: UseFormReturn<AddPolicyFlowProps> }) => {
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()  
  if (!chain || !safe) return

  const multiSendDeployment = getMultiSendCallOnlyContractDeployment(chain, safe.version)
  const multiSendCallOnlyAddress = multiSendDeployment?.networkAddresses[chain.chainId]
  if (!multiSendCallOnlyAddress) return

  formMethods.setValue(policyFields.operation, 1)
  formMethods.setValue(policyFields.selector, 'multiSend') // TODO: get the correct selector
  formMethods.setValue(policyFields.targetAddress, multiSendCallOnlyAddress)

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput 
          data-testid="target-section" 
          name={policyFields.targetAddress} 
          label="Target address" 
          disabled 
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <NameInput 
          data-testid="selector-section" 
          name={policyFields.selector} 
          label="Function selector" 
          disabled 
        />
      </FormControl>
    </>
  )
}

const CreateCosignerPolicy = ({ formMethods }: { formMethods: UseFormReturn<AddPolicyFlowProps> }) => {
  const [displaySelector, setDisplaySelector] = useState(false)
  const provider = useWeb3ReadOnly()

  const targetAddress = formMethods.watch(policyFields.targetAddress)
  const data = formMethods.watch(policyFields.data)

  useEffect(() => {
    const checkContractCode = async () => {
      if (!provider || !targetAddress) {
        setDisplaySelector(false)
        return
      }
      let code = '0x'
      try {
        code = await provider.getCode(targetAddress)
      } catch (error) {
        console.error('Failed to check contract code:', error)
      }
      setDisplaySelector(code !== '0x')
    }
    checkContractCode()
  }, [targetAddress, provider])

  useEffect(() => {
    if (!data) return
    formMethods.setValue(policyFields.data, data) // TODO: add the correct format for the data
  }, [data, formMethods])

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput 
          data-testid="data-section" 
          name={policyFields.data} 
          label="Co-signer address"
          required
        />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <AddressBookInput 
          data-testid="target-section" 
          name={policyFields.targetAddress} 
          label="Target address" 
          required
        />
      </FormControl>
      {displaySelector && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <NameInput 
            data-testid="selector-section" 
            name={policyFields.selector} 
            label="Function selector" 
            required
          />
        </FormControl>
      )}
    </>
  )
}

const CreatePolicy = ({
  params,
  onSubmit,
}: {
  params: AddPolicyFlowProps
  onSubmit: (data: AddPolicyFlowProps) => void
}) => {
  const formMethods = useForm<AddPolicyFlowProps>({
    defaultValues: params,
    mode: 'onChange',
  })

  const { handleSubmit, control, setValue, watch } = formMethods
  const selectedPolicyType = watch(policyFields.policyType)

  useEffect(() => {
    const policyAddress = policyContracts.policies[selectedPolicyType]
    setValue(policyFields.policyAddress, policyAddress)
    setValue(policyFields.targetAddress, defaultValues.targetAddress)
    setValue(policyFields.selector, defaultValues.selector)
    setValue(policyFields.data, defaultValues.data)
  }, [selectedPolicyType])

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth className={css.select} sx={{ mb: 3, mt: '0px !important' }}>
            <InputLabel shrink={false}>Policy type</InputLabel>
            <Controller
              rules={{ required: true }}
              control={control}
              name={policyFields.policyType}
              render={({ field }) => (
                <Select
                  data-testid="policy-type-section"
                  {...field}
                  sx={{ textAlign: 'right', fontWeight: 700 }}
                  IconComponent={ExpandMoreRoundedIcon}
                >
                  {POLICY_TYPE_OPTIONS.map((policyType) => (
                    <MenuItem
                      data-testid="policy-type-item"
                      key={policyType.value}
                      value={policyType.value}
                      sx={{ overflow: 'hidden' }}
                    >
                      {policyType.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          {selectedPolicyType === PolicyType.ALLOW && (
            <CreateAllowPolicy />
          )}
          {selectedPolicyType === PolicyType.NATIVE_TRANSFER && (
            <CreateNativeTransferPolicy formMethods={formMethods} />
          )}
          {selectedPolicyType === PolicyType.ERC20_TRANSFER && (
            <CreateErc20TransferPolicy formMethods={formMethods} />
          )}
          {selectedPolicyType === PolicyType.MULTISEND && (
            <CreateMultiSendPolicy formMethods={formMethods} />
          )}
          {selectedPolicyType === PolicyType.COSIGNER && (
            <CreateCosignerPolicy formMethods={formMethods} />
          )}

          <CardActions>
            <Button data-testid="next-btn" variant="contained" type="submit">
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreatePolicy
