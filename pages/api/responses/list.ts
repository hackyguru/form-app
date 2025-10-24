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
    const { formId, page, limit } = req.query;

    if (!formId || typeof formId !== 'string') {
      return res.status(400).json({ error: 'Form ID is required' });
    }

    // Parse pagination parameters with defaults
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    
    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100' 
      });
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
    const allResponseIds = await contract.getFormResponses(formId);
    const totalCount = allResponseIds.length;
    
    console.log(`Found ${totalCount} total responses for form ${formId}`);

    // Calculate pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = Math.min(startIndex + limitNum, totalCount);
    
    // Get only the IDs for this page
    const pageResponseIds = allResponseIds.slice(startIndex, endIndex);
    
    console.log(`Fetching responses ${startIndex + 1} to ${endIndex} (page ${pageNum}, limit ${limitNum})`);

    // Fetch responses for this page in parallel
    const responsePromises = pageResponseIds.map(async (responseId: bigint) => {
      const response = await contract.getResponse(responseId);
      return {
        id: Number(responseId),
        ipnsName: response.ipnsName,
        responseCID: response.responseCID,
        submitter: response.submitter,
        timestamp: new Date(Number(response.timestamp) * 1000).toISOString(),
        verified: response.verified,
        identityType: response.identityType,
      };
    });

    const responses = await Promise.all(responsePromises);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      responses,
      count: responses.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    } as any);
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch responses',
    });
  }
}
