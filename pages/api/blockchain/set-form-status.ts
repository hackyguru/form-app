import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '@/lib/FormRegistry.abi.json';

/**
 * API endpoint to set form active status (soft delete)
 * 
 * POST /api/blockchain/set-form-status
 * Body: { formId: string, active: boolean, creatorAddress: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formId, active, creatorAddress } = req.body;

    // Validate inputs
    if (!formId || typeof active !== 'boolean' || !creatorAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: formId, active, creatorAddress' 
      });
    }

    if (!ethers.isAddress(creatorAddress)) {
      return res.status(400).json({ error: 'Invalid creator address' });
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

    console.log('🔧 Setting form status:', {
      formId,
      active,
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
        error: 'Not authorized: Only form creator can change status' 
      });
    }

    // Send transaction
    console.log('📤 Sending setFormStatus transaction...');
    const tx = await contract.setFormStatus(formId, active);
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
      active,
    });

  } catch (error: any) {
    console.error('❌ Error setting form status:', error);
    return res.status(500).json({
      error: 'Failed to set form status',
      details: error.message,
    });
  }
}
