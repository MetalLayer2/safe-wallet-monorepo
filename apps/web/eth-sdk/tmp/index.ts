import { Provider, Signer, Contract, Interface, InterfaceAbi } from 'ethers'

import * as types from './types'

import mainnet_cowSwap_orderSigner_abi from '../../../../eth-sdk/abis/mainnet/cowSwap/orderSigner.json'
import mainnet_cowSwap_gpv2VaultRelayer_abi from '../../../../eth-sdk/abis/mainnet/cowSwap/gpv2VaultRelayer.json'
import mainnet_cowSwap_vCow_abi from '../../../../eth-sdk/abis/mainnet/cowSwap/vCow.json'
import mainnet_weth_abi from '../../../../eth-sdk/abis/mainnet/weth.json'
import gnosis_cowSwap_orderSigner_abi from '../../../../eth-sdk/abis/gnosis/cowSwap/orderSigner.json'
import gnosis_cowSwap_gpv2VaultRelayer_abi from '../../../../eth-sdk/abis/gnosis/cowSwap/gpv2VaultRelayer.json'
import gnosis_cowSwap_vCow_abi from '../../../../eth-sdk/abis/gnosis/cowSwap/vCow.json'
import gnosis_wxdai_abi from '../../../../eth-sdk/abis/gnosis/wxdai.json'
import arbitrumOne_cowSwap_orderSigner_abi from '../../../../eth-sdk/abis/arbitrumOne/cowSwap/orderSigner.json'
import arbitrumOne_weth_abi from '../../../../eth-sdk/abis/arbitrumOne/weth.json'

export function getContract(
  address: string,
  abi: Interface | InterfaceAbi,
  defaultSignerOrProvider: Signer | Provider,
): unknown {
  return new Contract(address, abi, defaultSignerOrProvider)
}

export type MainnetSdk = ReturnType<typeof getMainnetSdk>
export function getMainnetSdk(defaultSignerOrProvider: Signer | Provider) {
  return {
    cowSwap: {
      orderSigner: getContract(
        '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
        mainnet_cowSwap_orderSigner_abi,
        defaultSignerOrProvider,
      ) as types.mainnet.cowSwap.OrderSigner,
      gpv2VaultRelayer: getContract(
        '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
        mainnet_cowSwap_gpv2VaultRelayer_abi,
        defaultSignerOrProvider,
      ) as types.mainnet.cowSwap.Gpv2VaultRelayer,
      vCow: getContract(
        '0xD057B63f5E69CF1B929b356b579Cba08D7688048',
        mainnet_cowSwap_vCow_abi,
        defaultSignerOrProvider,
      ) as types.mainnet.cowSwap.VCow,
    },
    weth: getContract(
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      mainnet_weth_abi,
      defaultSignerOrProvider,
    ) as types.mainnet.Weth,
  }
}

export type GnosisSdk = ReturnType<typeof getGnosisSdk>
export function getGnosisSdk(defaultSignerOrProvider: Signer | Provider) {
  return {
    cowSwap: {
      orderSigner: getContract(
        '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
        gnosis_cowSwap_orderSigner_abi,
        defaultSignerOrProvider,
      ) as types.gnosis.cowSwap.OrderSigner,
      gpv2VaultRelayer: getContract(
        '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
        gnosis_cowSwap_gpv2VaultRelayer_abi,
        defaultSignerOrProvider,
      ) as types.gnosis.cowSwap.Gpv2VaultRelayer,
      vCow: getContract(
        '0xc20C9C13E853fc64d054b73fF21d3636B2d97eaB',
        gnosis_cowSwap_vCow_abi,
        defaultSignerOrProvider,
      ) as types.gnosis.cowSwap.VCow,
    },
    wxdai: getContract(
      '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      gnosis_wxdai_abi,
      defaultSignerOrProvider,
    ) as types.gnosis.Wxdai,
  }
}

export type ArbitrumOneSdk = ReturnType<typeof getArbitrumOneSdk>
export function getArbitrumOneSdk(defaultSignerOrProvider: Signer | Provider) {
  return {
    cowSwap: {
      orderSigner: getContract(
        '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
        arbitrumOne_cowSwap_orderSigner_abi,
        defaultSignerOrProvider,
      ) as types.arbitrumOne.cowSwap.OrderSigner,
    },
    weth: getContract(
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      arbitrumOne_weth_abi,
      defaultSignerOrProvider,
    ) as types.arbitrumOne.Weth,
  }
}
