/**
 * Storacha/IPFS Storage Utilities
 * 
 * This module handles all interactions with Storacha for uploading and retrieving
 * form metadata on IPFS. Forms are stored as JSON files and accessed via their CID.
 */

import * as Client from '@storacha/client';
import * as Delegation from '@storacha/client/delegation';
import { FormMetadata } from '@/types/form';

// IPFS Gateway URL for retrieving content
export const IPFS_GATEWAY = 'https://w3s.link/ipfs/';

/**
 * Initialize a Storacha client with delegation from backend
 */
export async function createStorachaClient(): Promise<Client.Client> {
  try {
    // Create a new client
    const client = await Client.create();
    console.log('Created Storacha client with DID:', client.agent.did());

    // Fetch delegation from backend
    const response = await fetch('/api/storacha/delegation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did: client.agent.did() }),
    });

    // Get the response text once
    const responseText = await response.text();

    // Check if response is OK
    if (!response.ok) {
      console.error('Delegation API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500)
      });
      throw new Error(`Failed to get delegation from backend: ${response.status} ${response.statusText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', responseText.substring(0, 500));
      throw new Error('API returned HTML instead of JSON. Check if the API route is working correctly.');
    }

    // Parse JSON from text
    const { delegation: base64Delegation } = JSON.parse(responseText);

    // Convert base64 back to Uint8Array
    const delegationBytes = Uint8Array.from(atob(base64Delegation), c => c.charCodeAt(0));
    console.log('Received delegation, size:', delegationBytes.length, 'bytes');

    // Deserialize the delegation
    const delegation = await Delegation.extract(delegationBytes);
    
    if (!delegation.ok) {
      console.error('Failed to extract delegation:', delegation.error);
      throw new Error('Failed to extract delegation');
    }

    console.log('Delegation extracted successfully');

    // Add proof that this agent has been delegated capabilities on the space
    const space = await client.addSpace(delegation.ok);
    await client.setCurrentSpace(space.did());
    
    console.log('Space configured:', space.did());
    console.log('✅ Storacha client ready for uploads');

    return client;
  } catch (error) {
    console.error('❌ Failed to create Storacha client:', error);
    throw error;
  }
}

/**
 * Upload form metadata to IPFS via Storacha
 * Returns the CID of the uploaded form (directory CID only)
 * The file is stored as 'form-meta.json' inside the directory
 */
export async function uploadFormToIPFS(formMetadata: FormMetadata): Promise<string> {
  try {
    console.log('🚀 Starting form upload to IPFS...');
    const client = await createStorachaClient();

    // Convert form metadata to JSON
    const jsonString = JSON.stringify(formMetadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a File object - use a simple name for the file
    const file = new File([blob], 'form-meta.json', { type: 'application/json' });
    console.log('📦 Created file:', file.name, 'Size:', blob.size, 'bytes');

    // Upload to Storacha - use uploadDirectory for better compatibility
    console.log('⬆️  Uploading to Storacha...');
    const directoryCid = await client.uploadDirectory([file]);
    
    // Return just the directory CID (without filename)
    // The retrieval function will handle appending /form-meta.json
    const cidString = directoryCid.toString();

    console.log('✅ Form uploaded to IPFS:', cidString);
    console.log('🔗 Access at:', `${IPFS_GATEWAY}${cidString}/form-meta.json`);
    return cidString;
  } catch (error) {
    console.error('❌ Failed to upload form to IPFS:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to upload form to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload arbitrary JSON string to IPFS
 * Returns the CID of the uploaded directory
 * Useful for uploading encrypted keys or other JSON data
 */
export async function uploadJSONToIPFS(jsonString: string, filename: string = 'data.json'): Promise<string> {
  try {
    console.log('🚀 Starting JSON upload to IPFS:', filename);
    const client = await createStorachaClient();

    // Create blob and file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    console.log('📦 Created file:', file.name, 'Size:', blob.size, 'bytes');

    // Upload to Storacha
    console.log('⬆️  Uploading to Storacha...');
    const directoryCid = await client.uploadDirectory([file]);
    const cidString = directoryCid.toString();

    console.log('✅ JSON uploaded to IPFS:', cidString);
    console.log('🔗 Access at:', `${IPFS_GATEWAY}${cidString}/${filename}`);
    return cidString;
  } catch (error) {
    console.error('❌ Failed to upload JSON to IPFS:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieve form metadata from IPFS using CID or IPNS name
 * Supports both CID (bafyxxx) and IPNS (k51xxx) formats
 * CID should be just the directory CID (without filename)
 * Handles both new format (form-meta.json) and old format (form-{timestamp}.json)
 */
export async function getFormFromIPFS(cidOrIPNS: string): Promise<FormMetadata | null> {
  try {
    let cid = cidOrIPNS;
    
    // Check if this is an IPNS name and resolve it first
    if (cidOrIPNS.startsWith('k51')) {
      console.log('Detected IPNS name, resolving...');
      const { resolveIPNS } = await import('./ipns');
      const resolvedCid = await resolveIPNS(cidOrIPNS);
      if (!resolvedCid) {
        throw new Error('Failed to resolve IPNS name');
      }
      cid = resolvedCid;
      console.log('Resolved IPNS to CID:', cid);
    }
    
    // Remove /form-meta.json if it's already in the CID string
    const cleanCid = cid.replace(/\/form-meta\.json$/, '');
    
    let url = `${IPFS_GATEWAY}${cleanCid}`;
    let response: Response;
    
    // First attempt: try with /form-meta.json (new format)
    console.log('Attempting to fetch:', `${url}/form-meta.json`);
    response = await fetch(`${url}/form-meta.json`);

    // If that fails, try different approaches
    if (!response.ok) {
      console.log('form-meta.json not found, trying subdomain gateway to find file...');
      
      // Try subdomain gateway to get directory listing
      const subdomainUrl = `https://${cleanCid}.ipfs.w3s.link/`;
      console.log('Trying subdomain gateway:', subdomainUrl);
      
      try {
        const dirResponse = await fetch(subdomainUrl);
        if (dirResponse.ok) {
          const text = await dirResponse.text();
          
          // If it's HTML (directory listing), try to parse it
          if (text.includes('.json')) {
            // Look for .json filename in the HTML
            const jsonMatch = text.match(/href="([^"]*\.json)"/);
            if (jsonMatch) {
              const filename = jsonMatch[1];
              console.log('Found JSON file in listing:', filename);
              url = `${IPFS_GATEWAY}${cleanCid}/${filename}`;
              response = await fetch(url);
            }
          }
        }
      } catch (e) {
        console.log('Subdomain gateway failed:', e);
      }
    }

    if (!response.ok) {
      console.error('All fetch attempts failed. Last URL:', url, 'Status:', response.status);
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    // Try to parse as JSON regardless of content-type (some gateways don't set it correctly)
    const text = await response.text();
    
    try {
      const formMetadata: FormMetadata = JSON.parse(text);
      console.log('✅ Successfully parsed form metadata:', formMetadata.title);
      return formMetadata;
    } catch (parseError) {
      console.error('Failed to parse response as JSON. First 200 chars:', text.substring(0, 200));
      throw new Error('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Failed to retrieve form from IPFS:', error);
    return null;
  }
}

/**
 * Store CID mapping locally (for dashboard)
 * This keeps track of form CIDs in localStorage for quick access
 */
export function saveCIDMapping(formId: string, cid: string): void {
  try {
    const mappings = getCIDMappings();
    mappings[formId] = cid;
    localStorage.setItem('form-cid-mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save CID mapping:', error);
  }
}

/**
 * Get all CID mappings
 */
export function getCIDMappings(): Record<string, string> {
  try {
    const data = localStorage.getItem('form-cid-mappings');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get CID mappings:', error);
    return {};
  }
}

/**
 * Get CID for a specific form ID
 */
export function getCIDForForm(formId: string): string | null {
  const mappings = getCIDMappings();
  return mappings[formId] || null;
}

/**
 * Delete CID mapping
 */
export function deleteCIDMapping(formId: string): void {
  try {
    const mappings = getCIDMappings();
    delete mappings[formId];
    localStorage.setItem('form-cid-mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to delete CID mapping:', error);
  }
}

/**
 * Get all forms from IPFS (using stored CID mappings)
 */
export async function getAllFormsFromIPFS(): Promise<FormMetadata[]> {
  const mappings = getCIDMappings();
  const cids = Object.values(mappings);

  const forms = await Promise.all(
    cids.map(cid => getFormFromIPFS(cid))
  );

  return forms.filter((form): form is FormMetadata => form !== null);
}

/**
 * Generate shareable link for a form
 */
export function getFormShareLink(cid: string): string {
  return `${window.location.origin}/forms/view/${cid}`;
}

/**
 * Generate IPFS gateway link for a form
 */
export function getIPFSLink(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}
