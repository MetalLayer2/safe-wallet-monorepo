import { Button, Divider, Link, Paper, Popover, Typography } from '@mui/material'
import type { Web3WalletTypes } from '@walletconnect/web3wallet'

import { EIP155 } from '@/services/walletconnect/constants'
import useChains from '@/hooks/useChains'
import ChainIndicator from '@/components/common/ChainIndicator'

import css from './styles.module.css'

const ConnectionCenter = ({
  anchorEl,
  proposal,
  onClose,
}: {
  anchorEl: HTMLButtonElement | null
  proposal: Web3WalletTypes.SessionProposal
  onClose: () => void
}) => {
  const { requiredNamespaces, optionalNamespaces, proposer } = proposal.params

  const chains = useChains()

  const onApprove = () => {
    // TODO:
  }

  const requiredChains = requiredNamespaces[EIP155].chains ?? []
  const optionalChains = optionalNamespaces[EIP155].chains ?? []

  const chainIds = requiredChains
    .concat(optionalChains)
    .map((chain) => {
      const [, chainId] = chain.split(':')
      return chainId
    })
    .filter((chainId) => chains.configs.some((chain) => chain.chainId === chainId))

  return (
    <>
      <Popover
        open
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Paper className={css.container}>
          <Typography variant="h4" fontWeight={700}>
            WalletConnect
          </Typography>

          <img width={32} height={32} src={proposer.metadata.icons[0]} alt={`${proposer.metadata.name} Logo`} />
          <Typography>
            <Link href={proposal.verifyContext.verified.origin}>{proposer.metadata.name}</Link> wants to connect
          </Typography>

          <Divider flexItem />

          <div>
            <Typography mb={1}>Requested chains</Typography>
            <div>
              {chainIds.map((chainId) => (
                <ChainIndicator inline chainId={chainId} key={chainId} className={css.chain} />
              ))}
            </div>
          </div>

          <Divider flexItem />

          <div>
            <Typography mb={1}>Requested methods</Typography>
            <div>
              {requiredNamespaces[EIP155].methods.map((method) => (
                <span className={css.method} key={method}>
                  {method}
                </span>
              ))}
            </div>
          </div>

          <Divider flexItem />

          <Button variant="outlined" color="error" size="small" fullWidth>
            Reject
          </Button>
          <Button variant="contained" size="small" onClick={onApprove} fullWidth>
            Approve
          </Button>
        </Paper>
      </Popover>
    </>
  )
}

export default ConnectionCenter
