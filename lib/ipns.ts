/**
 * IPNS (w3name) Integration
 * 
 * Provides mutable pointers to form data using IPNS names.
 * This allows forms to be updated without changing their public address.
 */

import * as Name from 'w3name';
import { FormMetadata } from '@/types/form';

/**
 * Create a new IPNS name for a form
 * Returns the name string and the raw name object (to be serialized)
 */
export async function createIPNSName(): Promise<{ name: string; nameObj: any }> {
  const nameObj = await Name.create();
  
  return {
    name: nameObj.toString(),
    nameObj, // Store the whole object, we'll serialize it when saving
  };
}

/**
 * Publish a CID to an IPNS name (initial revision)
 * @param nameObj - The name object (from createIPNSName or loaded)
 * @param cid - The CID to publish
 */
export async function publishToIPNS(nameObj: any, cid: string): Promise<void> {
  const value = `/ipfs/${cid}`;
  
  // Create initial revision
  const revision = await Name.v0(nameObj, value);
  
  // Publish to w3name
  await Name.publish(revision, nameObj.key);
  
  console.log('Published to IPNS:', nameObj.toString(), '→', value);
}

/**
 * Update an existing IPNS name with a new CID
 * @param nameObj - The name object
 * @param newCid - The new CID to publish
 */
export async function updateIPNS(nameObj: any, newCid: string): Promise<void> {
  // Resolve the current revision
  const currentRevision = await Name.resolve(nameObj);
  
  // Create next revision
  const value = `/ipfs/${newCid}`;
  const nextRevision = await Name.increment(currentRevision, value);
  
  // Publish update
  await Name.publish(nextRevision, nameObj.key);
  
  console.log('Updated IPNS:', nameObj.toString(), '→', value);
}

/**
 * Resolve an IPNS name to get the latest CID
 * @param ipnsName - The IPNS name (e.g., k51qzi5uqu5di...)
 * @returns The current CID or null if resolution fails
 */
export async function resolveIPNS(ipnsName: string): Promise<string | null> {
  try {
    const name = Name.parse(ipnsName);
    const revision = await Name.resolve(name);
    
    // Extract CID from the /ipfs/CID path
    const value = revision.value;
    const cid = value.replace('/ipfs/', '');
    
    console.log('Resolved IPNS:', ipnsName, '→', cid);
    return cid;
  } catch (error) {
    console.error('Failed to resolve IPNS:', error);
    return null;
  }
}

/**
 * Save IPNS key to localStorage
 * @param formId - The form ID
 * @param nameObj - The name object from w3name
 */
export async function saveIPNSKey(formId: string, nameObj: any): Promise<void> {
  try {
    const keys = await getIPNSKeys();
    // Use key.raw to get the binary private key (per w3name docs)
    const keyData = {
      bytes: Array.from(nameObj.key.raw),
      toString: nameObj.toString(),
    };
    keys[formId] = keyData;
    localStorage.setItem('form-ipns-keys', JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to save IPNS key:', error);
  }
}

/**
 * Get all IPNS keys
 */
export async function getIPNSKeys(): Promise<Record<string, any>> {
  try {
    const data = localStorage.getItem('form-ipns-keys');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get IPNS keys:', error);
    return {};
  }
}

/**
 * Get IPNS name object for a specific form
 */
export async function getIPNSNameObject(formId: string): Promise<any | null> {
  try {
    const keys = await getIPNSKeys();
    const keyData = keys[formId];
    if (!keyData) return null;
    
    // Reconstruct WritableName from saved key.raw bytes (per w3name docs)
    const bytes = new Uint8Array(keyData.bytes);
    const nameObj = await Name.from(bytes);
    return nameObj;
  } catch (error) {
    console.error('Failed to get IPNS name object:', error);
    return null;
  }
}

/**
 * Delete IPNS key
 */
export async function deleteIPNSKey(formId: string): Promise<void> {
  try {
    const keys = await getIPNSKeys();
    delete keys[formId];
    localStorage.setItem('form-ipns-keys', JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to delete IPNS key:', error);
  }
}

/**
 * Save IPNS name mapping (formId → IPNS name)
 */
export function saveIPNSMapping(formId: string, ipnsName: string): void {
  try {
    const mappings = getIPNSMappings();
    mappings[formId] = ipnsName;
    localStorage.setItem('form-ipns-mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save IPNS mapping:', error);
  }
}

/**
 * Get all IPNS name mappings
 */
export function getIPNSMappings(): Record<string, string> {
  try {
    const data = localStorage.getItem('form-ipns-mappings');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get IPNS mappings:', error);
    return {};
  }
}

/**
 * Get IPNS name for a specific form
 */
export function getIPNSName(formId: string): string | null {
  const mappings = getIPNSMappings();
  return mappings[formId] || null;
}

/**
 * Delete IPNS mapping
 */
export function deleteIPNSMapping(formId: string): void {
  try {
    const mappings = getIPNSMappings();
    delete mappings[formId];
    localStorage.setItem('form-ipns-mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to delete IPNS mapping:', error);
  }
}

/**
 * Check if a string is an IPNS name (starts with k51...)
 */
export function isIPNSName(str: string): boolean {
  return str.startsWith('k51');
}

/**
 * Generate shareable link for IPNS name
 */
export function getIPNSShareLink(ipnsName: string): string {
  return `${window.location.origin}/forms/view/${ipnsName}`;
}

/**
 * Generate IPFS gateway link for IPNS name
 */
export function getIPNSGatewayLink(ipnsName: string): string {
  return `https://w3s.link/ipns/${ipnsName}`;
}
