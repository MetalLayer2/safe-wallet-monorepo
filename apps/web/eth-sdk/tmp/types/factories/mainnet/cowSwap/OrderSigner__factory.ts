/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from 'ethers'
import type { OrderSigner, OrderSignerInterface } from '../../../mainnet/cowSwap/OrderSigner'

const _abi = [
  {
    inputs: [
      {
        internalType: 'contract GPv2Signing',
        name: '_signing',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'deployedAt',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'domainSeparator',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'contract IERC20',
            name: 'sellToken',
            type: 'address',
          },
          {
            internalType: 'contract IERC20',
            name: 'buyToken',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'receiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'sellAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'buyAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'validTo',
            type: 'uint32',
          },
          {
            internalType: 'bytes32',
            name: 'appData',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'feeAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'kind',
            type: 'bytes32',
          },
          {
            internalType: 'bool',
            name: 'partiallyFillable',
            type: 'bool',
          },
          {
            internalType: 'bytes32',
            name: 'sellTokenBalance',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'buyTokenBalance',
            type: 'bytes32',
          },
        ],
        internalType: 'struct GPv2Order.Data',
        name: 'order',
        type: 'tuple',
      },
      {
        internalType: 'uint32',
        name: 'validDuration',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'feeAmountBP',
        type: 'uint256',
      },
    ],
    name: 'signOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'signing',
    outputs: [
      {
        internalType: 'contract GPv2Signing',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'contract IERC20',
            name: 'sellToken',
            type: 'address',
          },
          {
            internalType: 'contract IERC20',
            name: 'buyToken',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'receiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'sellAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'buyAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'validTo',
            type: 'uint32',
          },
          {
            internalType: 'bytes32',
            name: 'appData',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'feeAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'kind',
            type: 'bytes32',
          },
          {
            internalType: 'bool',
            name: 'partiallyFillable',
            type: 'bool',
          },
          {
            internalType: 'bytes32',
            name: 'sellTokenBalance',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'buyTokenBalance',
            type: 'bytes32',
          },
        ],
        internalType: 'struct GPv2Order.Data',
        name: 'order',
        type: 'tuple',
      },
    ],
    name: 'unsignOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export class OrderSigner__factory {
  static readonly abi = _abi
  static createInterface(): OrderSignerInterface {
    return new Interface(_abi) as OrderSignerInterface
  }
  static connect(address: string, runner?: ContractRunner | null): OrderSigner {
    return new Contract(address, _abi, runner) as unknown as OrderSigner
  }
}
