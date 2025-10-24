import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import FormRegistryIPNSABI from '../../../lib/FormRegistryIPNS.abi.json';

type ResponseData = {
  success?: boolean;
  error?: string;
  responseCID?: string;
  txHash?: string;
  responseId?: number;
};

// Storacha client setup
const getStorachaClient = async () => {
  const Client = await import('@storacha/client');
  const { StoreMemory } = await import('@storacha/client/stores/memory');
  const Proof = await import('@storacha/client/proof');
  const { Signer } = await import('@storacha/client/principal/ed25519');
  
  const principal = Signer.parse(process.env.STORACHA_KEY!);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const proof = await Proof.parse(process.env.STORACHA_PROOF!);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  
  return client;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formId, responseData, submitterAddress, verified, identityType } = req.body;

    if (!formId || !responseData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Upload response JSON to IPFS via Storacha
    console.log('Uploading response to IPFS...');
    const client = await getStorachaClient();
    
    const responseJSON = JSON.stringify(responseData, null, 2);
    const file = new File([responseJSON], `response-${Date.now()}.json`, {
      type: 'application/json',
    });

    const cid = await client.uploadFile(file);
    const responseCID = cid.toString();
    console.log('Response uploaded to IPFS:', responseCID);

    // 2. Register response on blockchain
    console.log('Registering response on blockchain...');
    
    const rpcUrl = process.env.STATUS_NETWORK_RPC;
    const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS;

    if (!rpcUrl || !serverPrivateKey || !contractAddress) {
      throw new Error('Missing environment variables');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serverWallet = new ethers.Wallet(serverPrivateKey, provider);

    const contract = new ethers.Contract(
      contractAddress,
      FormRegistryIPNSABI,
      serverWallet
    );

    // For anonymous forms, use zero address
    const submitter = submitterAddress || ethers.ZeroAddress;
    const isVerified = verified || false;
    const idType = identityType || '';

    const tx = await contract.submitResponse(
      formId,
      responseCID,
      submitter,
      isVerified,
      idType
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Extract response ID from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'ResponseSubmitted');

    const responseId = event ? Number(event.args.responseId) : undefined;

    return res.status(200).json({
      success: true,
      responseCID,
      txHash: receipt.hash,
      responseId,
    });
  } catch (error: any) {
    console.error('Error submitting response:', error);
    return res.status(500).json({
      error: error.message || 'Failed to submit response',
    });
  }
}
