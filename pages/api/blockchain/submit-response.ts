import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '../../../lib/FormRegistry.abi.json';

type PrivacyMode = 'identified' | 'anonymous';

interface SubmitResponseRequest {
  formId: string;
  encryptedDataCID: string;
  privacyMode: PrivacyMode;
  // Optional fields for identified mode
  submitterAddress?: string;
  verified?: boolean;
  identityType?: string;
}

interface SubmitResponseResponse {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  submissionId?: number;
  explorerUrl?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitResponseResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const {
      formId,
      encryptedDataCID,
      privacyMode,
      submitterAddress,
      verified = false,
      identityType = 'anonymous',
    }: SubmitResponseRequest = req.body;

    // Validate input
    if (!formId || !encryptedDataCID || !privacyMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: formId, encryptedDataCID, privacyMode',
      });
    }

    // Validate privacy mode
    if (privacyMode !== 'identified' && privacyMode !== 'anonymous') {
      return res.status(400).json({
        success: false,
        error: 'Privacy mode must be "identified" or "anonymous"',
      });
    }

    // Validate submitter address if provided
    if (submitterAddress && !ethers.isAddress(submitterAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address',
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

    let tx;
    let submissionId;

    if (privacyMode === 'anonymous') {
      // Pure anonymous submission - no submitter info at all
      console.log('🔒 Submitting anonymous response:', {
        formId,
        cid: encryptedDataCID.substring(0, 20) + '...',
      });

      tx = await contract.submitAnonymousResponse(formId, encryptedDataCID);

      // Get submission ID from contract events
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'AnonymousSubmissionReceived';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        submissionId = parsed?.args?.submissionId?.toString();
      }

    } else {
      // Identified mode - use address(0) for anonymous OR real address if provided
      const submitter = submitterAddress || ethers.ZeroAddress; // ← Option 1!
      
      console.log('👤 Submitting identified response:', {
        formId,
        cid: encryptedDataCID.substring(0, 20) + '...',
        submitter: submitter === ethers.ZeroAddress ? 'anonymous (0x0)' : submitter,
        verified,
        identityType,
      });

      tx = await contract.submitIdentifiedResponse(
        formId,
        encryptedDataCID,
        submitter,
        verified,
        identityType
      );

      // Get submission ID from contract events
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'IdentifiedSubmissionReceived';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        submissionId = parsed?.args?.submissionId?.toString();
      }
    }

    console.log('📤 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    console.log('✅ Transaction confirmed!', {
      blockNumber: receipt.blockNumber,
      submissionId,
      gasUsed: receipt.gasUsed.toString(),
    });

    const explorerUrl = `https://sepoliascan.status.network/tx/${tx.hash}`;

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      submissionId: submissionId ? parseInt(submissionId) : undefined,
      explorerUrl,
    });

  } catch (error: any) {
    console.error('❌ Error submitting response to blockchain:', error);

    // Handle specific error cases
    let errorMessage = 'Failed to submit response to blockchain';
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds in server wallet';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please try again.';
    } else if (error.message?.includes('Form not active')) {
      errorMessage = 'Form is not active';
    } else if (error.message?.includes('Form is anonymous mode')) {
      errorMessage = 'Form does not support identified submissions';
    } else if (error.message?.includes('Form requires identity')) {
      errorMessage = 'Form requires identity verification';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
