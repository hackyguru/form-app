# Blockchain API Documentation

## Overview

Backend APIs for interacting with the FormRegistry smart contract on Status Network Testnet.

**Contract Address:** `0x1c10424bF8149F7cB10d1989679bfA6933799e4d`  
**Network:** Status Network Testnet (Chain ID: 1660990954)  
**Explorer:** https://sepoliascan.status.network

## Architecture

```
Frontend → Backend API → Status Network Smart Contract
   ↓
No gas fees for users! Backend signs all transactions.
```

### Privacy Modes

Forms can operate in two privacy modes:

1. **IDENTIFIED** - Tracks submitter identities (wallet addresses)
   - Can still accept anonymous submissions using `address(0)`
   - Stores: submitter address, verified status, identity type
   
2. **ANONYMOUS** - Maximum privacy, no identity tracking
   - No submitter information stored at all
   - Only CID and timestamp recorded

## API Endpoints

### 1. Register Form on Blockchain

**Endpoint:** `POST /api/blockchain/register-form`

**Purpose:** Registers a newly created form on the blockchain.

**Request Body:**
```typescript
{
  formId: string;           // UUID of the form
  ipnsName: string;         // IPNS name (k51...)
  creatorAddress: string;   // Creator's wallet address
  privacyMode: 'identified' | 'anonymous';
}
```

**Response:**
```typescript
{
  success: boolean;
  txHash?: string;          // Transaction hash
  blockNumber?: number;     // Block number
  explorerUrl?: string;     // Status Network explorer link
  error?: string;
}
```

**Example Usage:**
```typescript
import { registerFormOnChain } from '@/lib/blockchain-client';

const result = await registerFormOnChain(
  'form-123',
  'k51qzi5uqu5...',
  '0x1234...5678',
  'identified'
);

console.log('Transaction:', result.txHash);
console.log('View on explorer:', result.explorerUrl);
```

**Gas Cost:** ~150,000 gas (paid by server wallet)

---

### 2. Submit Response to Blockchain

**Endpoint:** `POST /api/blockchain/submit-response`

**Purpose:** Records a form submission on the blockchain.

**Request Body:**
```typescript
{
  formId: string;              // UUID of the form
  encryptedDataCID: string;    // IPFS CID of encrypted data
  privacyMode: 'identified' | 'anonymous';
  
  // Optional (for identified mode only):
  submitterAddress?: string;   // Wallet address (or omit for address(0))
  verified?: boolean;          // Was identity verified via Privy?
  identityType?: string;       // "wallet", "email", "google", etc.
}
```

**Response:**
```typescript
{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  submissionId?: number;       // Submission ID in contract
  explorerUrl?: string;
  error?: string;
}
```

**Example Usage (Anonymous):**
```typescript
import { submitResponseToChain } from '@/lib/blockchain-client';

// Pure anonymous submission
const result = await submitResponseToChain(
  'form-123',
  'bafybei...',
  'anonymous'
);
```

**Example Usage (Identified with wallet):**
```typescript
// Identified submission with wallet address
const result = await submitResponseToChain(
  'form-123',
  'bafybei...',
  'identified',
  {
    submitterAddress: '0xabcd...1234',
    verified: true,
    identityType: 'wallet'
  }
);
```

**Example Usage (Identified but anonymous):**
```typescript
// Identified form, but submitter chose to remain anonymous
const result = await submitResponseToChain(
  'form-123',
  'bafybei...',
  'identified',
  {
    // No submitterAddress = uses address(0)
    verified: false,
    identityType: 'anonymous'
  }
);
```

**Gas Cost:**
- Anonymous: ~80,000 gas (50% cheaper!)
- Identified: ~120,000 gas

---

### 3. Get Form from Blockchain

**Endpoint:** `GET /api/blockchain/get-form?formId={formId}`

**Purpose:** Retrieves form details from the blockchain.

**Query Parameters:**
- `formId` (required): UUID of the form

**Response:**
```typescript
{
  success: boolean;
  form?: {
    creator: string;
    ipnsName: string;
    privacyMode: 'identified' | 'anonymous';
    createdAt: number;         // Unix timestamp
    active: boolean;           // Is form accepting submissions?
    submissionCount: number;   // Total submissions
  };
  error?: string;
}
```

**Example Usage:**
```typescript
import { getFormFromChain } from '@/lib/blockchain-client';

const result = await getFormFromChain('form-123');

if (result.success && result.form) {
  console.log('Privacy mode:', result.form.privacyMode);
  console.log('Submissions:', result.form.submissionCount);
}
```

**Gas Cost:** FREE (read-only operation)

---

## Client Utilities

All helper functions available in `/lib/blockchain-client.ts`:

```typescript
// Register form
await registerFormOnChain(formId, ipnsName, creator, privacyMode);

// Submit response
await submitResponseToChain(formId, cid, privacyMode, options);

// Get form details
await getFormFromChain(formId);

// Check if form exists
const exists = await isFormRegistered(formId);

// Get explorer URLs
const txUrl = getExplorerUrl(txHash);
const addressUrl = getAddressExplorerUrl(walletAddress);

// Get contract info
const contractAddr = getContractAddress();
const chainId = getChainId(); // 1660990954
```

---

## Type Definitions

All TypeScript types available in `/lib/blockchain-types.ts`:

```typescript
import type {
  PrivacyMode,
  FormOnChain,
  RegisterFormRequest,
  RegisterFormResponse,
  SubmitResponseRequest,
  SubmitResponseResponse,
  GetFormResponse,
  IdentifiedSubmission,
  AnonymousSubmission,
} from '@/lib/blockchain-types';
```

---

## Implementation Details

### Option 1: address(0) for Anonymous Submissions ✅

The backend uses **Option 1** (zero address) for anonymous submissions:

```typescript
// In submit-response.ts
const submitter = submitterAddress || ethers.ZeroAddress; // ← 0x0000...0000

await contract.submitIdentifiedResponse(
  formId,
  encryptedDataCID,
  submitter,  // ← Either real address or address(0)
  verified,
  identityType
);
```

**Benefits:**
- ✅ Standard Ethereum pattern
- ✅ Clear intent (no identity)
- ✅ Gas efficient
- ✅ No random address confusion

### Backend Signing

All transactions are signed by the **server wallet** (not users):

```typescript
const serverWallet = new ethers.Wallet(
  process.env.SERVER_WALLET_PRIVATE_KEY,
  provider
);

const contract = new ethers.Contract(
  contractAddress,
  FormRegistryABI,
  serverWallet  // ← Server signs, not user
);
```

**Result:** Users pay **ZERO gas fees**! 🎉

---

## Error Handling

All APIs return standardized errors:

```typescript
{
  success: false,
  error: "Descriptive error message"
}
```

**Common Errors:**
- `"Missing required fields: ..."`
- `"Invalid Ethereum address"`
- `"Privacy mode must be 'identified' or 'anonymous'"`
- `"Form already registered on blockchain"`
- `"Form is not active"`
- `"Insufficient funds in server wallet"`
- `"Network error. Please try again."`

---

## Security Notes

1. **Private Keys:** Never expose `SERVER_WALLET_PRIVATE_KEY` to frontend
2. **Validation:** All inputs validated before blockchain interaction
3. **Gas Management:** Server wallet must maintain sufficient ETH balance
4. **Rate Limiting:** Consider adding rate limits in production
5. **Access Control:** Only server wallet can register forms/submissions

---

## Testing

### Test Registration
```bash
curl -X POST http://localhost:3000/api/blockchain/register-form \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "test-form-1",
    "ipnsName": "k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8",
    "creatorAddress": "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF",
    "privacyMode": "identified"
  }'
```

### Test Submission (Anonymous)
```bash
curl -X POST http://localhost:3000/api/blockchain/submit-response \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "test-form-1",
    "encryptedDataCID": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "privacyMode": "anonymous"
  }'
```

### Test Query
```bash
curl "http://localhost:3000/api/blockchain/get-form?formId=test-form-1"
```

---

## Next Steps

1. ✅ Backend APIs created
2. ⏳ Add privacy mode selector to form creation UI
3. ⏳ Integrate `registerFormOnChain()` in form creation flow
4. ⏳ Integrate `submitResponseToChain()` in submission flow
5. ⏳ Display blockchain data in response viewer
6. ⏳ End-to-end testing

---

## Resources

- **Smart Contract:** `/contracts/FormRegistry.sol`
- **Deployment Info:** `/deployments/statusTestnet.json`
- **Contract ABI:** `/lib/FormRegistry.abi.json`
- **Status Network Explorer:** https://sepoliascan.status.network
- **Status Network RPC:** https://public.sepolia.rpc.status.network
