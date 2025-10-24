import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryABI from '@/lib/FormRegistry.abi.json';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formIds } = req.query;

    if (!formIds) {
      return res.status(400).json({ error: 'formIds parameter is required' });
    }

    // Parse formIds (can be comma-separated)
    const idsArray = typeof formIds === 'string' 
      ? formIds.split(',').map(id => id.trim()).filter(Boolean)
      : Array.isArray(formIds) 
      ? formIds 
      : [formIds];

    if (idsArray.length === 0) {
      return res.status(400).json({ error: 'At least one formId is required' });
    }

    // Setup contract connection
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!contractAddress || !rpcUrl) {
      return res.status(500).json({ error: 'Contract configuration missing' });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, FormRegistryABI, provider);

    // Fetch counts in parallel for all forms using optimized count function
    const countPromises = idsArray.map(async (formId) => {
      try {
        // Use getFormResponseCount() instead of getFormResponses().length
        // This is much more gas-efficient and faster for large datasets
        const count = await contract.getFormResponseCount(formId);
        return {
          formId,
          count: Number(count)
        };
      } catch (error) {
        console.error(`Error fetching count for form ${formId}:`, error);
        return {
          formId,
          count: 0
        };
      }
    });

    const results = await Promise.all(countPromises);

    // Build response object
    const counts: Record<string, number> = {};
    let total = 0;

    results.forEach(({ formId, count }) => {
      counts[formId] = count;
      total += count;
    });

    return res.status(200).json({
      counts,
      total,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error in response count API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch response counts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
