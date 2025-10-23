# Status Network Implementation Guide 🚀

## Overview

We're implementing a **dual-privacy blockchain form system** on Status Network Testnet:
- **Identified Mode**: Track submitter identities (wallet/email)
- **Anonymous Mode**: Maximum privacy (no identity stored)

---

## Phase 2 Implementation Status

### ✅ Completed

1. **Status Network Integration**
   - Added Status Network Testnet to Privy config
   - Chain ID: 1660990954
   - RPC: https://public.sepolia.rpc.status.network
   - Explorer: https://sepoliascan.status.network

2. **Smart Contract Development**
   - `FormRegistry.sol` created with dual privacy modes
   - Supports identified & anonymous submissions
   - Backend signing architecture (gasless for users!)
   - Event emissions for tracking

3. **Hardhat Setup**
   - Configuration for Status Network
   - Deployment scripts
   - ABI export automation

### 🔜 Next Steps

4. Environment Setup
5. Get Status Network Testnet ETH
6. Deploy Smart Contract
7. Backend API Implementation
8. Frontend Integration
9. Testing

---

## Step 1: Environment Setup

### Add to `.env.local`:

```bash
# Status Network Configuration
NEXT_PUBLIC_FORM_REGISTRY_ADDRESS=  # Will be filled after deployment
NEXT_PUBLIC_STATUS_NETWORK_CHAIN_ID=1660990954

# Deployer Wallet (for contract deployment)
DEPLOYER_PRIVATE_KEY=  # Your wallet private key for deployment

# Server Wallet (for backend signing - can be same as deployer initially)
SERVER_WALLET_ADDRESS=  # Backend wallet address
SERVER_WALLET_PRIVATE_KEY=  # Backend wallet private key

# Status Network RPC
STATUS_NETWORK_RPC=https://public.sepolia.rpc.status.network

# Existing variables
NEXT_PUBLIC_PRIVY_APP_ID=cmh3vivho000rjm0cflacvr6x
STORACHA_KEY=...
STORACHA_PROOF=...
```

---

## Step 2: Get Status Network Testnet ETH

### Method 1: Use the Bridge (Recommended)
1. Visit: https://bridge.status.network
2. Bridge Sepolia ETH to Status Network Testnet
3. You'll need Sepolia ETH first from: https://sepoliafaucet.com/

### Method 2: Contact Status Network
- Join their Telegram (link on website)
- Request testnet ETH

### You'll Need:
- **Deployer wallet**: ~0.1 ETH (for deployment)
- **Server wallet**: ~0.5 ETH (for ongoing form/submission transactions)

---

## Step 3: Deploy Smart Contract

### Deploy to Status Network Testnet:

```bash
# Make sure Hardhat is installed (already done)
# Set your DEPLOYER_PRIVATE_KEY in .env.local

# Deploy
npx hardhat run scripts/deploy.js --network statusTestnet
```

### Expected Output:

```
🚀 Deploying FormRegistry to Status Network Testnet...

📝 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
💰 Account balance: 0.5 ETH

🔐 Server wallet address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
📦 Deploying FormRegistry contract...

✅ FormRegistry deployed successfully!
📍 Contract address: 0xYourContractAddress123...
🔗 View on explorer: https://sepoliascan.status.network/address/0xYourContractAddress123...

💾 Deployment info saved to: deployments/statusTestnet.json
📄 ABI exported to: lib/FormRegistry.abi.json

🎉 Deployment complete!
```

### Update `.env.local`:

Add the contract address from deployment:
```bash
NEXT_PUBLIC_FORM_REGISTRY_ADDRESS=0xYourContractAddress123...
```

---

## Step 4: Verify Contract (Optional but Recommended)

```bash
npx hardhat verify --network statusTestnet \
  0xYourContractAddress123... \
  "0xYourServerWalletAddress"
```

This makes your contract source code visible on the block explorer!

---

## Step 5: Backend API Implementation

### Create `/pages/api/blockchain/register-form.ts`:

```typescript
import { ethers } from 'ethers';
import FormRegistryABI from '@/lib/FormRegistry.abi.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formId, ipnsName, creatorAddress, privacyMode } = req.body;

  // Validate inputs
  if (!formId || !ipnsName || !creatorAddress || privacyMode === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Connect to Status Network
    const provider = new ethers.JsonRpcProvider(
      process.env.STATUS_NETWORK_RPC
    );

    // Server wallet (pays gas)
    const serverWallet = new ethers.Wallet(
      process.env.SERVER_WALLET_PRIVATE_KEY!,
      provider
    );

    // Contract instance
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS!,
      FormRegistryABI,
      serverWallet
    );

    // Convert privacy mode string to enum (0 = IDENTIFIED, 1 = ANONYMOUS)
    const privacyModeEnum = privacyMode === 'anonymous' ? 1 : 0;

    console.log('Registering form:', {
      formId,
      ipnsName,
      creatorAddress,
      privacyMode: privacyModeEnum,
    });

    // Call smart contract
    const tx = await contract.registerForm(
      creatorAddress,
      formId,
      ipnsName,
      privacyModeEnum
    );

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log('Transaction confirmed:', receipt.hash);

    return res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `https://sepoliascan.status.network/tx/${receipt.hash}`,
    });
  } catch (error: any) {
    console.error('Failed to register form:', error);
    return res.status(500).json({
      error: 'Failed to register form on blockchain',
      message: error.message,
    });
  }
}
```

### Create `/pages/api/blockchain/submit-response.ts`:

```typescript
import { ethers } from 'ethers';
import FormRegistryABI from '@/lib/FormRegistry.abi.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    formId,
    encryptedDataCID,
    submitterAddress,
    verified,
    identityType,
    privacyMode,
  } = req.body;

  if (!formId || !encryptedDataCID || !privacyMode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.STATUS_NETWORK_RPC);
    const serverWallet = new ethers.Wallet(
      process.env.SERVER_WALLET_PRIVATE_KEY!,
      provider
    );
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_FORM_REGISTRY_ADDRESS!,
      FormRegistryABI,
      serverWallet
    );

    let tx;

    if (privacyMode === 'identified') {
      // Submit to identified form
      tx = await contract.submitIdentifiedResponse(
        formId,
        encryptedDataCID,
        submitterAddress || ethers.ZeroAddress,
        verified || false,
        identityType || 'anonymous'
      );
    } else {
      // Submit to anonymous form
      tx = await contract.submitAnonymousResponse(formId, encryptedDataCID);
    }

    const receipt = await tx.wait();

    return res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `https://sepoliascan.status.network/tx/${receipt.hash}`,
    });
  } catch (error: any) {
    console.error('Failed to submit response:', error);
    return res.status(500).json({
      error: 'Failed to submit response to blockchain',
      message: error.message,
    });
  }
}
```

---

## Step 6: Frontend Integration

### Update Form Creation (`/pages/forms/create.tsx`):

Add privacy mode selector (will implement in next step)

### Update Form Submission:

Connect to blockchain API (will implement in next step)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           USER (Form Creator)                   │
│  - Authenticates with Privy (wallet/social)    │
│  - Chooses privacy mode (identified/anonymous) │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              FRONTEND                           │
│  - Creates form with privacy settings          │
│  - Uploads to IPFS (gets IPNS)                 │
│  - Calls: POST /api/blockchain/register-form   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         BACKEND API (Next.js)                   │
│  - Receives form registration request          │
│  - Signs transaction with SERVER_WALLET         │
│  - Submits to Smart Contract                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│      STATUS NETWORK (Blockchain)                │
│  - FormRegistry Smart Contract                  │
│  - Stores: formId, creator, IPNS, privacy mode │
│  - Emits: FormCreated event                    │
│  - Gas paid by backend (FREE for user!)        │
└─────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━ SUBMISSION FLOW ━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────┐
│        USER (Form Submitter)                    │
│  - NO wallet needed!                            │
│  - Fills out form anonymously                   │
│  - Optional: Connect identity (if identified)   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              FRONTEND                           │
│  - Encrypts submission data                     │
│  - Uploads encrypted data to IPFS (gets CID)   │
│  - Calls: POST /api/blockchain/submit-response  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         BACKEND API                             │
│  - Receives submission                          │
│  - Signs transaction with SERVER_WALLET         │
│  - Submits CID + metadata to blockchain        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│      STATUS NETWORK                             │
│  IF IDENTIFIED:                                 │
│    - Stores: CID, submitter, verified, type    │
│  IF ANONYMOUS:                                  │
│    - Stores: CID, timestamp only                │
│  - Gas paid by backend (FREE for submitter!)   │
└─────────────────────────────────────────────────┘
```

---

## Gas Cost Estimates (Status Network)

| Operation | Estimated Gas | Cost (if Status has fees) |
|-----------|--------------|----------------------------|
| Deploy Contract | ~2,000,000 gas | One-time |
| Register Form | ~150,000 gas | Per form |
| Submit (Identified) | ~120,000 gas | Per submission |
| Submit (Anonymous) | ~80,000 gas | Per submission |

**Note:** Status Network may be gasless or have minimal fees!

---

## Testing Checklist

### After Deployment:

1. ✅ Contract deployed and verified
2. ✅ Contract address in `.env.local`
3. ✅ Server wallet funded with testnet ETH
4. ✅ Backend API endpoints created
5. ✅ Test form creation (identified mode)
6. ✅ Test form creation (anonymous mode)
7. ✅ Test submission to identified form
8. ✅ Test submission to anonymous form
9. ✅ Verify transactions on Status Network explorer
10. ✅ Check event emissions

---

## Next Steps

**Current Status:** Ready to deploy! ✅

**To Continue:**
1. Get Status Network testnet ETH
2. Run deployment script
3. Implement backend API endpoints
4. Update form creation UI with privacy mode selector
5. Test end-to-end flow

---

## Support & Resources

- **Status Network Explorer:** https://sepoliascan.status.network
- **Status Network Bridge:** https://bridge.status.network
- **Contract Source:** `contracts/FormRegistry.sol`
- **Deployment Script:** `scripts/deploy.js`
- **Hardhat Config:** `hardhat.config.js`

---

## Questions?

Let me know if you need help with:
- Getting testnet ETH
- Deploying the contract
- Implementing backend APIs
- Frontend integration
- Testing

Ready to deploy! 🚀
