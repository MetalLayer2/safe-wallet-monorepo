import { Box, Stack, Typography } from '@mui/material'
import type {
  ModulesChangeManagement,
  OwnershipChangeManagement,
  ProxyUpgradeManagement,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import { mapSecuritySeverity } from '../utils'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Warning } from '.'
import { CONTRACT_CHANGE_TITLES_MAPPING } from '@safe-global/utils/components/tx/security/blockaid/utils'

const ProxyUpgradeSummary = ({ beforeAddress, afterAddress }: { beforeAddress: string; afterAddress: string }) => {
  return (
    <Stack direction="column" spacing={0.5}>
      <Typography variant="body2" sx={{ marginBottom: 'var(--space-2) !important' }}>
        Please verify that this change is intended and correct as it may overwrite the ownership of your account
      </Typography>
      <Typography variant="overline">Current mastercopy:</Typography>
      <Box sx={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'background.paper' }}>
        <EthHashInfo address={beforeAddress} showCopyButton hasExplorer shortAddress={false} showAvatar={false} />
      </Box>

      <Typography variant="overline">New mastercopy:</Typography>
      <Box sx={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'background.paper' }}>
        <EthHashInfo address={afterAddress} showCopyButton hasExplorer shortAddress={false} showAvatar={false} />
      </Box>
    </Stack>
  )
}

export const ContractChangeWarning = ({
  contractChange,
}: {
  contractChange: ProxyUpgradeManagement | OwnershipChangeManagement | ModulesChangeManagement
}) => {
  const title = CONTRACT_CHANGE_TITLES_MAPPING[contractChange.type]
  const severityProps = mapSecuritySeverity[SecuritySeverity.MEDIUM]
  const { before, after, type } = contractChange
  const isProxyUpgrade = type === 'PROXY_UPGRADE'

  const warningContent = (
    <>
      {isProxyUpgrade ? (
        <ProxyUpgradeSummary beforeAddress={before.address} afterAddress={after.address} />
      ) : (
        <Typography variant="body2">Please verify that this change is intended and correct.</Typography>
      )}
    </>
  )

  return <Warning title={title} severityProps={severityProps} content={warningContent} isTransaction={true} />
}
