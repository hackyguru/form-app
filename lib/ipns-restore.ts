/**
 * IPNS Key Restoration Utilities for Multi-Device Access
 * 
 * This module enables users to restore their IPNS editing keys on new devices
 * by decrypting encrypted backups stored on IPFS and registered on-chain.
 */

import { ethers } from 'ethers';
import FormRegistryABI from './FormRegistry.abi.json';
import { IPFS_GATEWAY } from './storacha';
import { decryptIPNSKeyFromStorage } from './crypto-utils';
import { saveIPNSKey, saveIPNSMapping } from './ipns';
import * as Name from 'w3name';

interface RestoreResult {
  formId: string;
  ipnsName: string;
  success: boolean;
  error?: string;
}

/**
 * Fetch all forms created by a specific wallet address from the blockchain
 * Uses FormCreated events to find user's forms
 */
export async function getUserFormsFromBlockchain(
  walletAddress: string
): Promise<Array<{ formId: string; ipnsName: string; encryptedKeyCID: string }>> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_STATUS_NETWORK_RPC || 'https://public.sepolia.rpc.status.network';
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;

    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    // Connect to blockchain (read-only)
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, FormRegistryABI, provider);

    // Query FormCreated events for this creator
    // Use deployment block from env or default to contract deployment
    const deploymentBlock = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK 
      ? parseInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK)
      : 11681317; // Default: Status Network Testnet deployment
    
    const filter = contract.filters.FormCreated(walletAddress);
    
    console.log(`🔍 Querying FormCreated events for ${walletAddress} from block ${deploymentBlock}...`);
    const events = await contract.queryFilter(filter, deploymentBlock, 'latest');
    console.log(`Found ${events.length} FormCreated events`);

    // Extract form details from events
    const forms = events.map((event: any) => {
      const args = event.args;
      return {
        formId: String(args.formId), // Ensure formId is a string
        ipnsName: String(args.ipnsName),
        encryptedKeyCID: args.encryptedKeyCID ? String(args.encryptedKeyCID) : '',
      };
    });

    console.log(`✅ Found ${forms.length} forms with encrypted keys`);
    return forms.filter(f => f.encryptedKeyCID); // Only forms with encrypted keys
  } catch (error) {
    console.error('Failed to fetch user forms from blockchain:', error);
    return [];
  }
}

/**
 * Download and decrypt an encrypted IPNS key from IPFS
 */
async function downloadAndDecryptKey(
  encryptedKeyCID: string,
  walletAddress: string,
  signature: string
): Promise<string> {
  // Download encrypted key from IPFS
  const url = `${IPFS_GATEWAY}${encryptedKeyCID}/encrypted-key.json`;
  console.log('Downloading encrypted key from:', url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download encrypted key: ${response.statusText}`);
  }

  const encryptedKeyJson = await response.text();

  // Decrypt the key
  const { ipnsPrivateKey } = await decryptIPNSKeyFromStorage(
    encryptedKeyJson,
    walletAddress,
    signature
  );

  return ipnsPrivateKey;
}

/**
 * Restore IPNS editing keys for all user's forms
 * This enables editing from a new device
 */
export async function restoreAllIPNSKeys(
  walletAddress: string,
  signMessageFn: (message: string) => Promise<string>,
  onProgress?: (current: number, total: number, formId: string) => void
): Promise<RestoreResult[]> {
  const results: RestoreResult[] = [];

  try {
    // Step 1: Fetch user's forms from blockchain
    console.log('Fetching forms from blockchain for:', walletAddress);
    const forms = await getUserFormsFromBlockchain(walletAddress);

    if (forms.length === 0) {
      console.log('No forms found for this wallet');
      return [];
    }

    console.log(`Found ${forms.length} forms to restore`);

    // Step 2: Request signature once (reused for all decryptions)
    const message = `Sign this message to encrypt/decrypt your form editing keys.\n\nWallet: ${walletAddress}\n\nThis signature is used locally and never leaves your device.`;
    const signature = await signMessageFn(message);

    // Step 3: Download and decrypt each key
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      
      if (onProgress) {
        onProgress(i + 1, forms.length, form.formId);
      }

      try {
        console.log(`Restoring key ${i + 1}/${forms.length}: ${form.formId}`);

        // Download and decrypt the IPNS key
        const ipnsPrivateKeyBase64 = await downloadAndDecryptKey(
          form.encryptedKeyCID,
          walletAddress,
          signature
        );

        // Convert base64 back to Uint8Array
        const privateKeyBytes = Uint8Array.from(atob(ipnsPrivateKeyBase64), c => c.charCodeAt(0));

        // Recreate the Name object
        const nameObj = await Name.from(privateKeyBytes);

        // Save to localStorage for editing
        await saveIPNSKey(form.formId, nameObj);
        saveIPNSMapping(form.formId, form.ipnsName);

        console.log(`✅ Restored key for form: ${form.formId}`);

        results.push({
          formId: form.formId,
          ipnsName: form.ipnsName,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to restore key for ${form.formId}:`, error);
        results.push({
          formId: form.formId,
          ipnsName: form.ipnsName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to restore IPNS keys:', error);
    throw error;
  }
}

/**
 * Check if a specific form's IPNS key is available locally
 */
export function hasIPNSKey(formId: string): boolean {
  try {
    const keys = localStorage.getItem('ipns-keys');
    if (!keys) return false;
    
    const keysObj = JSON.parse(keys);
    return !!keysObj[formId];
  } catch {
    return false;
  }
}

/**
 * Check how many forms need key restoration
 */
export async function checkRestoreStatus(walletAddress: string): Promise<{
  totalForms: number;
  keysAvailable: number;
  needsRestore: number;
}> {
  try {
    const forms = await getUserFormsFromBlockchain(walletAddress);
    const keysAvailable = forms.filter(f => hasIPNSKey(f.formId)).length;

    return {
      totalForms: forms.length,
      keysAvailable,
      needsRestore: forms.length - keysAvailable,
    };
  } catch (error) {
    console.error('Failed to check restore status:', error);
    return { totalForms: 0, keysAvailable: 0, needsRestore: 0 };
  }
}

/**
 * Restore a single form's IPNS key
 */
export async function restoreSingleIPNSKey(
  formId: string,
  walletAddress: string,
  signMessageFn: (message: string) => Promise<string>
): Promise<RestoreResult> {
  try {
    // Fetch all forms and find the specific one
    const forms = await getUserFormsFromBlockchain(walletAddress);
    const form = forms.find(f => f.formId === formId);

    if (!form) {
      return {
        formId,
        ipnsName: '',
        success: false,
        error: 'Form not found on blockchain',
      };
    }

    // Request signature
    const message = `Sign this message to encrypt/decrypt your form editing keys.\n\nWallet: ${walletAddress}\n\nThis signature is used locally and never leaves your device.`;
    const signature = await signMessageFn(message);

    // Download and decrypt
    const ipnsPrivateKeyBase64 = await downloadAndDecryptKey(
      form.encryptedKeyCID,
      walletAddress,
      signature
    );

    // Convert and save
    const privateKeyBytes = Uint8Array.from(atob(ipnsPrivateKeyBase64), c => c.charCodeAt(0));
    const nameObj = await Name.from(privateKeyBytes);

    await saveIPNSKey(formId, nameObj);
    saveIPNSMapping(formId, form.ipnsName);

    return {
      formId,
      ipnsName: form.ipnsName,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to restore key for ${formId}:`, error);
    return {
      formId,
      ipnsName: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
