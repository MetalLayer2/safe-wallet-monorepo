import { useIsMultichainSafe } from '../../hooks/useIsMultichainSafe'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import { useAllSafesGrouped } from '@/components/welcome/MyAccounts/useAllSafesGrouped'
import { sameAddress } from '@/utils/addresses'
import useSafeOverviews from '@/components/welcome/MyAccounts/useSafeOverviews'
import { useMemo } from 'react'
import { getDeviatingSetups, getSafeSetups } from '@/components/welcome/MyAccounts/utils/multiChainSafe'
import { Box, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'

const ChainIndicatorList = ({ chainIds }: { chainIds: string[] }) => {
  const { configs } = useChains()

  return (
    <>
      {chainIds.map((chainId, index) => {
        const chain = configs.find((chain) => chain.chainId === chainId)
        return (
          <Box key={chainId} display="inline-flex" flexWrap="wrap" position="relative" top={5}>
            <ChainIndicator key={chainId} chainId={chainId} showUnknown={false} onlyLogo={true} />
            <Typography position="relative" top={2} mx={0.5}>
              {chain && chain.chainName}
              {index === chainIds.length - 1 ? '.' : ','}
            </Typography>
          </Box>
        )
      })}
    </>
  )
}

export const InconsistentSignerSetupWarning = () => {
  const isMultichainSafe = useIsMultichainSafe()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { allMultiChainSafes } = useAllSafesGrouped()

  const multiChainGroupSafes = useMemo(
    () => allMultiChainSafes?.find((account) => sameAddress(safeAddress, account.safes[0].address))?.safes ?? [],
    [allMultiChainSafes, safeAddress],
  )
  const [safeOverviews] = useSafeOverviews(multiChainGroupSafes)

  const safeSetups = useMemo(
    () => getSafeSetups(multiChainGroupSafes, safeOverviews ?? [], undeployedSafes),
    [multiChainGroupSafes, safeOverviews, undeployedSafes],
  )
  const deviatingSetups = getDeviatingSetups(safeSetups, currentChain?.chainId)
  const deviatingChainIds = deviatingSetups.map((setup) => setup?.chainId)

  if (!isMultichainSafe || !deviatingChainIds.length) return

  return (
    <ErrorMessage level="warning" title="Signers are not consistent">
      <Typography display="inline" mr={1}>
        Signers are different on these networks of this account:
      </Typography>
      <ChainIndicatorList chainIds={deviatingChainIds} />
      <Typography display="inline">
        To manage your account easier and to prevent lose of funds, we recommend keeping the same signers.
      </Typography>
    </ErrorMessage>
  )
}
