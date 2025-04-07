export const SWAPPER_ROLE_KEY = 'SafeSwapperRole'

export function isSwapperRoleChain(chainId: string): chainId is keyof typeof SwapperRoleContracts {
  return chainId in SwapperRoleContracts
}

export const SwapperRoleContracts = {
  // '1': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //     gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  //   },
  //   weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  // },
  // '100': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //     gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  //   },
  //   wxdai: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  // },
  // '42161': {
  //   cowSwap: {
  //     orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  //   },
  //   weth: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  // },
  '11155111': {
    cowSwap: {
      orderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
      gpv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    },
    weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    roles: '0x9646fDAD06d3e24444381f44362a3B0eB343D337',
  },
} as const

export const CowOrderSignerAbi = [
  {
    inputs: [
      {
        components: [
          { internalType: 'contract IERC20', name: 'sellToken', type: 'address' },
          { internalType: 'contract IERC20', name: 'buyToken', type: 'address' },
          { internalType: 'address', name: 'receiver', type: 'address' },
          { internalType: 'uint256', name: 'sellAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'buyAmount', type: 'uint256' },
          { internalType: 'uint32', name: 'validTo', type: 'uint32' },
          { internalType: 'bytes32', name: 'appData', type: 'bytes32' },
          { internalType: 'uint256', name: 'feeAmount', type: 'uint256' },
          { internalType: 'bytes32', name: 'kind', type: 'bytes32' },
          { internalType: 'bool', name: 'partiallyFillable', type: 'bool' },
          { internalType: 'bytes32', name: 'sellTokenBalance', type: 'bytes32' },
          { internalType: 'bytes32', name: 'buyTokenBalance', type: 'bytes32' },
        ],
        internalType: 'struct GPv2Order.Data',
        name: 'order',
        type: 'tuple',
      },
      { internalType: 'uint32', name: 'validDuration', type: 'uint32' },
      { internalType: 'uint256', name: 'feeAmountBP', type: 'uint256' },
    ],
    name: 'signOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
