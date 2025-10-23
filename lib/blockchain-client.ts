/**
 * Client-side blockchain API utilities
 * These functions call the backend APIs that interact with the Status Network
 */

import type {
  RegisterFormRequest,
  RegisterFormResponse,
  SubmitResponseRequest,
  SubmitResponseResponse,
  GetFormResponse,
  PrivacyMode,
} from './blockchain-types';

/**
 * Register a form on the blockchain
 */
export async function registerFormOnChain(
  formId: string,
  ipnsName: string,
  encryptedKeyCID: string,
  creatorAddress: string,
  privacyMode: PrivacyMode
): Promise<RegisterFormResponse> {
  try {
    const response = await fetch('/api/blockchain/register-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId,
        ipnsName,
        encryptedKeyCID,
        creatorAddress,
        privacyMode,
      } as RegisterFormRequest),
    });

    const data: RegisterFormResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to register form on blockchain');
    }

    return data;
  } catch (error: any) {
    console.error('Error registering form on blockchain:', error);
    throw error;
  }
}

/**
 * Submit a response to the blockchain
 */
export async function submitResponseToChain(
  formId: string,
  encryptedDataCID: string,
  privacyMode: PrivacyMode,
  options?: {
    submitterAddress?: string;
    verified?: boolean;
    identityType?: string;
  }
): Promise<SubmitResponseResponse> {
  try {
    const response = await fetch('/api/blockchain/submit-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId,
        encryptedDataCID,
        privacyMode,
        submitterAddress: options?.submitterAddress,
        verified: options?.verified,
        identityType: options?.identityType,
      } as SubmitResponseRequest),
    });

    const data: SubmitResponseResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit response to blockchain');
    }

    return data;
  } catch (error: any) {
    console.error('Error submitting response to blockchain:', error);
    throw error;
  }
}

/**
 * Get form details from the blockchain
 */
export async function getFormFromChain(formId: string): Promise<GetFormResponse> {
  try {
    const response = await fetch(`/api/blockchain/get-form?formId=${encodeURIComponent(formId)}`);

    const data: GetFormResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch form from blockchain');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching form from blockchain:', error);
    throw error;
  }
}

/**
 * Check if a form exists on the blockchain
 */
export async function isFormRegistered(formId: string): Promise<boolean> {
  try {
    const result = await getFormFromChain(formId);
    return result.success && !!result.form;
  } catch (error) {
    return false;
  }
}

/**
 * Get the Status Network explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://sepoliascan.status.network/tx/${txHash}`;
}

/**
 * Get the Status Network explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return `https://sepoliascan.status.network/address/${address}`;
}

/**
 * Get the contract address from environment
 */
export function getContractAddress(): string | undefined {
  return process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
}

/**
 * Get the Status Network chain ID
 */
export function getChainId(): number {
  return 1660990954; // Status Network Testnet
}
