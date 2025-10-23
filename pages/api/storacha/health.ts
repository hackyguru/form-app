import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    status: 'OK',
    environment: {
      hasStorachaKey: !!process.env.STORACHA_KEY,
      hasStorachaProof: !!process.env.STORACHA_PROOF,
      storachaKeyLength: process.env.STORACHA_KEY?.length || 0,
      storachaProofLength: process.env.STORACHA_PROOF?.length || 0,
      storachaKeyPrefix: process.env.STORACHA_KEY?.substring(0, 5) || 'N/A',
    },
    nodeVersion: process.version,
    nextVersion: '16.0.0',
    timestamp: new Date().toISOString(),
  });
}
