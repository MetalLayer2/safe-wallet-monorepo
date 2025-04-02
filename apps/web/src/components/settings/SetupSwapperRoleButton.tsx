import { useContext, type ReactElement } from 'react'
import { Button } from '@mui/material'
import { SetupSwapperRoleFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '../tx-flow'

const SetupSwapperRoleButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)

  const handleClick = () => {
    setTxFlow(<SetupSwapperRoleFlow />)
  }

  return (
    <Button variant="contained" onClick={handleClick}>
      Setup Swapper Role
    </Button>
  )
}

export default SetupSwapperRoleButton
