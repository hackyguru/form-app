import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '../../../lib/FormRegistry.abi.json';

type PrivacyMode = 'identified' | 'anonymous';

interface RegisterFormRequest {
  formId: string;
  ipnsName: string;
  encryptedKeyCID: string;
  creatorAddress: string;
  privacyMode: PrivacyMode;
}

interface RegisterFormResponse {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterFormResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { formId, ipnsName, encryptedKeyCID, creatorAddress, privacyMode }: RegisterFormRequest = req.body;

    // Validate input
    if (!formId || !ipnsName || !encryptedKeyCID || !creatorAddress || !privacyMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: formId, ipnsName, encryptedKeyCID, creatorAddress, privacyMode',
      });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(creatorAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address',
      });
    }

    // Validate privacy mode
    if (privacyMode !== 'identified' && privacyMode !== 'anonymous') {
      return res.status(400).json({
        success: false,
        error: 'Privacy mode must be "identified" or "anonymous"',
      });
    }

    // Check environment variables
    const rpcUrl = process.env.STATUS_NETWORK_RPC;
    const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;

    if (!rpcUrl || !serverPrivateKey || !contractAddress) {
      console.error('Missing environment variables:', {
        hasRPC: !!rpcUrl,
        hasPrivateKey: !!serverPrivateKey,
        hasContractAddress: !!contractAddress,
      });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact administrator.',
      });
    }

    // Connect to Status Network
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serverWallet = new ethers.Wallet(serverPrivateKey, provider);

    // Connect to contract
    const contract = new ethers.Contract(
      contractAddress,
      FormRegistryABI,
      serverWallet
    );

    console.log('🔗 Registering form on blockchain:', {
      formId,
      creator: creatorAddress,
      privacyMode,
      ipnsName: ipnsName.substring(0, 20) + '...',
      encryptedKeyCID: encryptedKeyCID.substring(0, 20) + '...',
    });

    // Convert privacy mode to enum value (0 = IDENTIFIED, 1 = ANONYMOUS)
    const privacyModeEnum = privacyMode === 'identified' ? 0 : 1;

    // Call contract function
    const tx = await contract.registerForm(
      creatorAddress,
      formId,
      ipnsName,
      encryptedKeyCID,
      privacyModeEnum
    );

    console.log('📤 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    console.log('✅ Transaction confirmed!', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    const explorerUrl = `https://sepoliascan.status.network/tx/${tx.hash}`;

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl,
    });

  } catch (error: any) {
    console.error('❌ Error registering form on blockchain:', error);

    // Handle specific error cases
    let errorMessage = 'Failed to register form on blockchain';
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds in server wallet';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please try again.';
    } else if (error.message?.includes('Form already exists')) {
      errorMessage = 'Form already registered on blockchain';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
