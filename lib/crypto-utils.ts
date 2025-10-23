/**
 * Crypto Utilities for Multi-Device IPNS Key Management
 * 
 * This module provides AES-256-GCM encryption/decryption functions
 * using wallet signatures as the encryption key. This allows form
 * creators to access their IPNS keys from any device by signing
 * a message with their wallet.
 */

/**
 * Derives a 256-bit encryption key from a wallet signature
 * Uses SHA-256 hash of the signature for deterministic key generation
 */
async function deriveKeyFromSignature(signature: string): Promise<CryptoKey> {
  // Remove '0x' prefix if present
  const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;
  
  // Convert hex signature to bytes
  const signatureBytes = new Uint8Array(
    cleanSignature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Hash the signature to get a 256-bit key
  const keyMaterial = await crypto.subtle.digest('SHA-256', signatureBytes);
  
  // Import as AES-GCM key
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-256-GCM with a key derived from wallet signature
 * 
 * @param data - The data to encrypt (e.g., IPNS private key)
 * @param signature - The wallet signature used to derive the encryption key
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encryptWithSignature(
  data: string,
  signature: string
): Promise<string> {
  try {
    // Derive encryption key from signature
    const key = await deriveKeyFromSignature(signature);
    
    // Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
    
    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(data);
    
    // Encrypt
    const encryptedBytes = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBytes
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBytes.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBytes), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256-GCM with a key derived from wallet signature
 * 
 * @param encryptedData - Base64-encoded encrypted data with IV prepended
 * @param signature - The wallet signature used to derive the decryption key
 * @returns The decrypted plaintext data
 */
export async function decryptWithSignature(
  encryptedData: string,
  signature: string
): Promise<string> {
  try {
    // Derive decryption key from signature
    const key = await deriveKeyFromSignature(signature);
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedBytes = combined.slice(12);
    
    // Decrypt
    const decryptedBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBytes
    );
    
    // Convert bytes back to string
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - signature mismatch or corrupted data');
  }
}

/**
 * Requests a signature from the user's wallet for encryption/decryption
 * Uses a deterministic message so the same signature is always produced
 * 
 * @param walletAddress - The user's wallet address
 * @param signMessage - Function to request signature from wallet (from Privy/Wagmi)
 * @returns The signature string
 */
export async function requestEncryptionSignature(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  const message = `Sign this message to encrypt/decrypt your form editing keys.\n\nWallet: ${walletAddress}\n\nThis signature is used locally and never leaves your device.`;
  
  try {
    const signature = await signMessage(message);
    return signature;
  } catch (error) {
    console.error('Signature request failed:', error);
    throw new Error('User rejected signature request');
  }
}

/**
 * Encrypts IPNS key data and prepares it for IPFS upload
 * 
 * @param ipnsPrivateKey - The IPNS private key to encrypt
 * @param formId - The form ID for reference
 * @param ownerAddress - The owner's wallet address
 * @param signature - The wallet signature for encryption
 * @returns JSON string ready for IPFS upload
 */
export async function encryptIPNSKeyForStorage(
  ipnsPrivateKey: string,
  formId: string,
  ownerAddress: string,
  signature: string
): Promise<string> {
  const encryptedKey = await encryptWithSignature(ipnsPrivateKey, signature);
  
  const keyBackup = {
    version: '1.0',
    formId,
    owner: ownerAddress,
    encryptedKey,
    createdAt: new Date().toISOString(),
  };
  
  return JSON.stringify(keyBackup);
}

/**
 * Decrypts IPNS key data retrieved from IPFS
 * 
 * @param encryptedKeyJson - The JSON string from IPFS
 * @param expectedOwner - The expected owner address (for verification)
 * @param signature - The wallet signature for decryption
 * @returns The decrypted IPNS private key
 */
export async function decryptIPNSKeyFromStorage(
  encryptedKeyJson: string,
  expectedOwner: string,
  signature: string
): Promise<{ formId: string; ipnsPrivateKey: string }> {
  try {
    const keyBackup = JSON.parse(encryptedKeyJson);
    
    // Verify owner
    if (keyBackup.owner.toLowerCase() !== expectedOwner.toLowerCase()) {
      throw new Error('Owner mismatch - this key belongs to a different wallet');
    }
    
    // Decrypt the key
    const ipnsPrivateKey = await decryptWithSignature(keyBackup.encryptedKey, signature);
    
    return {
      formId: keyBackup.formId,
      ipnsPrivateKey,
    };
  } catch (error) {
    console.error('Failed to decrypt IPNS key:', error);
    throw error;
  }
}

/**
 * Session storage helper for caching decryption signatures
 * This avoids asking the user to sign multiple times in one session
 */
export const SignatureCache = {
  key: 'ipns_signature_cache',
  
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.key);
  },
  
  set(signature: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.key, signature);
  },
  
  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.key);
  },
};
