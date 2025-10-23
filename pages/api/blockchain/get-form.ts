import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '../../../lib/FormRegistry.abi.json';

interface GetFormRequest {
  formId?: string;
}

interface FormDetails {
  creator: string;
  ipnsName: string;
  privacyMode: 'identified' | 'anonymous';
  createdAt: number;
  active: boolean;
  submissionCount: number;
}

interface GetFormResponse {
  success: boolean;
  form?: FormDetails;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetFormResponse>
) {
  // Allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    const { formId } = req.query as { formId?: string };

    if (!formId) {
      return res.status(400).json({
        success: false,
        error: 'Missing formId query parameter',
      });
    }

    // Check environment variables
    const rpcUrl = process.env.STATUS_NETWORK_RPC;
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    // Connect to Status Network (read-only)
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Connect to contract (no signer needed for read operations)
    const contract = new ethers.Contract(
      contractAddress,
      FormRegistryABI,
      provider
    );

    console.log('🔍 Fetching form from blockchain:', formId);

    // Get form details
    const formData = await contract.getForm(formId);

    // Check if form exists
    if (formData.creator === ethers.ZeroAddress) {
      return res.status(404).json({
        success: false,
        error: 'Form not found on blockchain',
      });
    }

    // Get submission count
    const submissionCount = await contract.getFormSubmissionCount(formId);

    // Convert privacy mode enum to string
    const privacyMode = Number(formData.privacyMode) === 0 ? 'identified' : 'anonymous';

    const formDetails: FormDetails = {
      creator: formData.creator,
      ipnsName: formData.ipnsName,
      privacyMode,
      createdAt: Number(formData.createdAt),
      active: formData.active,
      submissionCount: Number(submissionCount),
    };

    console.log('✅ Form found:', {
      creator: formDetails.creator,
      privacyMode: formDetails.privacyMode,
      submissions: formDetails.submissionCount,
    });

    return res.status(200).json({
      success: true,
      form: formDetails,
    });

  } catch (error: any) {
    console.error('❌ Error fetching form from blockchain:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch form from blockchain',
    });
  }
}
