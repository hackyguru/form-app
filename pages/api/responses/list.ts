import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryIPNSABI from '../../../lib/FormRegistryIPNS.abi.json';

interface ResponseItem {
  id: number;
  ipnsName: string;
  responseCID: string;
  submitter: string;
  timestamp: string;
  verified: boolean;
  identityType: string;
}

type ResponseData = {
  success?: boolean;
  error?: string;
  responses?: ResponseItem[];
  count?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formId } = req.query;

    if (!formId || typeof formId !== 'string') {
      return res.status(400).json({ error: 'Form ID is required' });
    }

    const rpcUrl = process.env.STATUS_NETWORK_RPC;
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      throw new Error('Missing environment variables');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      FormRegistryIPNSABI,
      provider
    );

    // Get all response IDs for this form
    const responseIds = await contract.getFormResponses(formId);
    console.log(`Found ${responseIds.length} responses for form ${formId}`);

    // Fetch each response
    const responses: ResponseItem[] = [];
    for (let i = 0; i < responseIds.length; i++) {
      const responseId = responseIds[i];
      const response = await contract.getResponse(responseId);
      
      responses.push({
        id: Number(responseId),
        ipnsName: response.ipnsName,
        responseCID: response.responseCID,
        submitter: response.submitter,
        timestamp: new Date(Number(response.timestamp) * 1000).toISOString(),
        verified: response.verified,
        identityType: response.identityType,
      });
    }

    return res.status(200).json({
      success: true,
      responses,
      count: responses.length,
    });
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch responses',
    });
  }
}
