import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '@/lib/FormRegistry.abi.json';

/**
 * API endpoint to update encrypted IPNS key CID
 * 
 * POST /api/blockchain/update-encrypted-key
 * Body: { formId: string, encryptedKeyCID: string, creatorAddress: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formId, encryptedKeyCID, creatorAddress } = req.body;

    // Validate inputs
    if (!formId || !encryptedKeyCID || !creatorAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: formId, encryptedKeyCID, creatorAddress' 
      });
    }

    if (!ethers.isAddress(creatorAddress)) {
      return res.status(400).json({ error: 'Invalid creator address' });
    }

    // Basic CID validation (starts with bafy or Qm)
    if (!encryptedKeyCID.startsWith('bafy') && !encryptedKeyCID.startsWith('Qm')) {
      return res.status(400).json({ error: 'Invalid IPFS CID format' });
    }

    // Get contract details from environment
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
    const rpcUrl = process.env.STATUS_NETWORK_RPC;
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;

    if (!contractAddress || !rpcUrl || !privateKey) {
      console.error('Missing environment variables:', {
        hasContract: !!contractAddress,
        hasRPC: !!rpcUrl,
        hasKey: !!privateKey,
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('🔑 Updating encrypted key:', {
      formId,
      encryptedKeyCID: encryptedKeyCID.substring(0, 20) + '...',
      creator: creatorAddress,
    });

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, FormRegistryABI, wallet);

    // Verify creator owns the form
    const formData = await contract.forms(formId);
    if (formData.creator.toLowerCase() !== creatorAddress.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Not authorized: Only form creator can update encrypted key' 
      });
    }

    // Send transaction
    console.log('📤 Sending updateEncryptedKey transaction...');
    const tx = await contract.updateEncryptedKey(formId, encryptedKeyCID);
    console.log('📤 Transaction sent:', tx.hash);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    return res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      formId,
      encryptedKeyCID,
    });

  } catch (error: any) {
    console.error('❌ Error updating encrypted key:', error);
    return res.status(500).json({
      error: 'Failed to update encrypted key',
      details: error.message,
    });
  }
}
