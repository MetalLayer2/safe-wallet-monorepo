import useSafeInfo from '@/hooks/useSafeInfo'
import { isSwapperRoleChain, SwapperRoleContracts } from '../transactions/constants'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@/hooks/useAsync'

export const useSwapperRoleMod = () => {
  const { safe } = useSafeInfo()
  const provider = useWeb3ReadOnly()

  // TODO: Migrate to RTK query for caching
  return useAsync(async () => {
    const chainId = safe.chainId
    if (!isSwapperRoleChain(chainId)) {
      throw new Error('Unsupported chain')
    }

    if (!provider) {
      throw new Error('No provider')
    }

    if (!safe.modules) {
      return
    }

    for (const mod of safe.modules) {
      const code = await provider.getCode(mod.value, 'latest')
      if (code === '0x') {
        continue
      }

      const expectedByteCode = `0x363d3d373d3d3d363d73${SwapperRoleContracts[chainId].roles.slice(2).toLowerCase()}5af43d82803e903d91602b57fd5bf3`
      if (code !== expectedByteCode) {
        continue
      }

      return mod.value
    }
  }, [provider, safe.chainId, safe.modules])
}
