import type { NextApiRequest, NextApiResponse } from 'next';
import * as Client from '@storacha/client';
import { StoreMemory } from '@storacha/client/stores/memory';
import * as Proof from '@storacha/client/proof';
import { Signer } from '@storacha/client/principal/ed25519';
import * as DID from '@ipld/dag-ucan/did';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { did } = req.body;

    if (!did) {
      return res.status(400).json({ error: 'DID is required' });
    }

    // Load client with specific private key from environment
    const principal = Signer.parse(process.env.STORACHA_KEY!);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    // Add proof that this agent has been delegated capabilities on the space
    const proof = await Proof.parse(process.env.STORACHA_PROOF!);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    // Create a delegation for the specific DID
    const audience = DID.parse(did);
    
    // 24 hours expiration
    const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
    const delegation = await client.createDelegation(
      audience, 
      ['store/add', 'upload/add'], 
      { expiration }
    );

    // Serialize the delegation
    const archive = await delegation.archive();
    
    if (!archive.ok) {
      throw new Error('Failed to create delegation archive');
    }

    // Convert to base64 for transmission
    const delegationBytes = new Uint8Array(archive.ok);
    const base64Delegation = Buffer.from(delegationBytes).toString('base64');

    res.status(200).json({ delegation: base64Delegation });
  } catch (error) {
    console.error('Delegation creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create delegation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
