import { Contract, Interface, type JsonRpcProvider } from 'ethers'
import policyContracts from './contracts.json'

export enum PolicyType {
  ALLOW = 'allowPolicy',
  NATIVE_TRANSFER = 'nativeTransferPolicy',
  ERC20_TRANSFER = 'erc20TransferPolicy',
  MULTISEND = 'multiSendPolicy',
  COSIGNER = 'coSignerPolicy',
}

export const safePolicyGuardAbi = [
  'function DELAY() public view returns (uint256)',
  'function getPolicy(address safe, address to, bytes calldata data, uint8 operation) public view returns (address)',
  'function configurePolicy(address target, bytes4 selector, uint8 operation, address policy, bytes calldata data) public',
  'function confirmPolicy(address safe, address target, bytes4 selector, uint8 operation, address policy, bytes memory data) external',
  'function pendingPolicies(address safe, bytes32 accessDataHash) public view returns (uint256)',
]

const safePolicyGuardInterface = new Interface(safePolicyGuardAbi)

export const createConfigurePolicyTx = ({
  safePolicyGuardAddress,
  targetAddress,
  selector,
  operation,
  policyAddress,
  data,
}: {
  safePolicyGuardAddress: string,
  targetAddress: string,
  selector: string,
  operation: number,
  policyAddress: string,
  data: string,
}) => {
  const txData = safePolicyGuardInterface.encodeFunctionData('configurePolicy', [
    targetAddress,
    selector,
    operation,
    policyAddress,
    data,
  ])

  return {
    to: safePolicyGuardAddress,
    value: '0',
    data: txData,
  }
}

export const createConfirmPolicyTx = (
  safeAddress: string,
  target: string,
  selector: string,
  operation: number,
  policyAddress: string,
  data: string,
) => {
  const txData = safePolicyGuardInterface.encodeFunctionData('confirmPolicy', [
    safeAddress,
    target,
    selector,
    operation,
    policyAddress,
    data,
  ])

  return {
    to: policyContracts.safePolicyGuard,
    value: '0',
    data: txData,
  }
}
