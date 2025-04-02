const { defineConfig } = require('@gnosis-guild/eth-sdk')

const contracts = {
  mainnet: {
    cowSwap: {
      orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
      gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
      vCow: '0xD057B63f5E69CF1B929b356b579Cba08D7688048',
    },
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  gnosis: {
    cowSwap: {
      orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
      gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
      vCow: '0xc20C9C13E853fc64d054b73fF21d3636B2d97eaB',
    },
    wxdai: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  },
  arbitrumOne: {
    cowSwap: {
      orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
    },
    weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
}

module.exports = defineConfig({
  contracts,
})
