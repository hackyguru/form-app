# Privy L2 Support - Status Network & Custom Chains ✅

## TL;DR: YES, Privy Works with Status Network! 🎉

Privy is **chain-agnostic** and supports:
- ✅ **All EVM-compatible chains** (Status Network is EVM!)
- ✅ **Custom L2s** (just add chain config)
- ✅ **Any chain from viem/chains**
- ✅ **Custom chain definitions**

---

## Current Configuration

Your app currently supports these chains:
```typescript
// pages/_app.tsx
supportedChains: [
  mainnet,      // Ethereum
  polygon,      // Polygon
  base,         // Base (Coinbase L2)
  arbitrum,     // Arbitrum
  optimism,     // Optimism
  avalanche,    // Avalanche
  bsc,          // BSC
  celo,         // Celo
  linea,        // Linea
  scroll,       // Scroll
]
```

---

## How to Add Status Network

### Option 1: If Status Network is in viem/chains

```typescript
import { statusNetwork } from 'viem/chains'; // If available

<PrivyProvider
  config={{
    supportedChains: [
      mainnet,
      base,
      statusNetwork, // Just add it!
      // ... other chains
    ],
  }}
>
```

### Option 2: Custom Chain Definition (Most Likely)

```typescript
// pages/_app.tsx
import { defineChain } from 'viem';

// Define Status Network
const statusNetwork = defineChain({
  id: 68544,  // Status Network Chain ID (check official docs)
  name: 'Status Network',
  network: 'status',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.status.im'], // Check official RPC
    },
    public: {
      http: ['https://rpc.status.im'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Status Explorer',
      url: 'https://explorer.status.im', // Check official explorer
    },
  },
  testnet: false,
});

// Then in PrivyProvider
<PrivyProvider
  config={{
    supportedChains: [
      mainnet,
      base,
      statusNetwork, // Your custom chain!
      // ... other chains
    ],
  }}
>
```

---

## Complete Example: Adding Status Network

Here's the full updated `_app.tsx`:

```typescript
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { PrivyProvider } from '@privy-io/react-auth';
import { mainnet, polygon, base, arbitrum, optimism, avalanche, bsc, celo, linea, scroll } from 'viem/chains';
import { defineChain } from 'viem';

// Define Status Network
const statusNetwork = defineChain({
  id: 68544, // ⚠️ UPDATE WITH ACTUAL CHAIN ID
  name: 'Status Network',
  network: 'status',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.status.im'], // ⚠️ UPDATE WITH ACTUAL RPC
    },
    public: {
      http: ['https://rpc.status.im'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Status Explorer',
      url: 'https://explorer.status.im', // ⚠️ UPDATE WITH ACTUAL EXPLORER
    },
  },
  testnet: false,
});

// Status Network Testnet (for development)
const statusNetworkTestnet = defineChain({
  id: 68545, // ⚠️ UPDATE WITH ACTUAL TESTNET CHAIN ID
  name: 'Status Network Testnet',
  network: 'status-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-testnet.status.im'],
    },
    public: {
      http: ['https://rpc-testnet.status.im'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Status Testnet Explorer',
      url: 'https://testnet-explorer.status.im',
    },
  },
  testnet: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1',
          logo: '/logo.png',
        },
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord', 'github'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets' as any,
          noPromptOnSignature: false,
        } as any,
        // Set Status Network as default!
        defaultChain: statusNetwork,
        supportedChains: [
          statusNetwork,        // Status Network (primary!)
          statusNetworkTestnet, // For testing
          mainnet,              // Ethereum
          base,                 // Base (also cheap!)
          polygon,              // Polygon
          arbitrum,             // Arbitrum
          optimism,             // Optimism
          avalanche,            // Avalanche
          bsc,                  // BSC
          celo,                 // Celo
          linea,                // Linea
          scroll,               // Scroll
        ],
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </PrivyProvider>
  );
}
```

---

## How to Find Status Network Details

### 1. Chain ID
Visit: https://chainlist.org and search for "Status Network"
Or check Status Network docs

### 2. RPC URL
Check Status Network official docs:
- Mainnet RPC: Usually `https://rpc.status.im` or similar
- Testnet RPC: Usually `https://rpc-testnet.status.im`

### 3. Block Explorer
Check Status Network docs for explorer URL

### Example Sources:
- **Chainlist:** https://chainlist.org
- **Status Docs:** https://status.im (check their developer docs)
- **GitHub:** Look for Status Network chain config

---

## Alternative: Popular Gasless L2s (Already Working!)

If Status Network details are hard to find, you already have these **cheap/gasless** L2s configured:

| Chain | Gas Cost | Privy Support | Currently Added |
|-------|----------|---------------|-----------------|
| **Base** | ~$0.001 | ✅ Yes | ✅ Yes |
| **Optimism** | ~$0.01 | ✅ Yes | ✅ Yes |
| **Arbitrum** | ~$0.01 | ✅ Yes | ✅ Yes |
| **Polygon** | ~$0.001 | ✅ Yes | ✅ Yes |
| **Scroll** | ~$0.001 | ✅ Yes | ✅ Yes |
| **Linea** | ~$0.001 | ✅ Yes | ✅ Yes |

**Recommendation:** Use **Base** or **Optimism** if Status Network has issues!

---

## Testing with Wagmi (Already Installed!)

Once you add Status Network, you can interact with smart contracts:

```typescript
import { useWriteContract } from 'wagmi';

function CreateFormButton() {
  const { writeContract } = useWriteContract();
  
  const createFormOnChain = async () => {
    // This will work on Status Network if configured!
    await writeContract({
      address: '0x...', // Your FormRegistry contract
      abi: FORM_REGISTRY_ABI,
      functionName: 'createForm',
      args: [ipnsName],
      chain: statusNetwork, // Specify chain
    });
  };
  
  return <button onClick={createFormOnChain}>Create on Status Network</button>;
}
```

---

## Privy Multi-Chain Support

Privy handles:
- ✅ **Wallet connection** on any supported chain
- ✅ **Chain switching** automatically
- ✅ **Transaction signing** on the selected chain
- ✅ **Embedded wallets** (Privy manages keys) on any chain
- ✅ **Social auth** that works with embedded wallets

**User flow:**
1. User connects (wallet or social auth)
2. Privy detects/asks which chain to use
3. User signs transactions on that chain
4. Works seamlessly!

---

## Backend Abstraction Compatibility

**Does backend signing work with Status Network?**

**YES!** Here's how:

```typescript
// Backend (Node.js API route)
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Server wallet on Status Network
const account = privateKeyToAccount(process.env.SERVER_PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: statusNetwork, // Works with custom chain!
  transport: http('https://rpc.status.im'),
});

// Sign transaction on behalf of user
const hash = await client.writeContract({
  address: FORM_REGISTRY_ADDRESS,
  abi: FORM_REGISTRY_ABI,
  functionName: 'createFormFor',
  args: [userAddress, ipnsName],
});
```

**So backend abstraction works perfectly!** ✅

---

## Recommendations

### For MVP (Now):
1. **Use Base** (already configured, cheap, proven)
2. Backend signs transactions (better UX)
3. Add Status Network later if needed

### For Production (Later):
1. Add Status Network custom chain
2. Let users choose chain in settings
3. Deploy contract to multiple chains
4. Add frontend signing option for power users

---

## Quick Decision Matrix

| Scenario | Recommended Chain | Why |
|----------|------------------|-----|
| **MVP / Testing** | Base or Optimism | Already configured, cheap, proven |
| **True Gasless** | Status Network | Need to verify it's actually gasless |
| **Fastest Setup** | Base | Already working, $0.001/tx |
| **Most Decentralized** | Ethereum L1 | Most secure, but expensive |
| **Best UX** | Backend signing on any L2 | No MetaMask popups |

---

## Next Steps

**Want me to:**

1. **Add Status Network** to your Privy config? (need chain details)
2. **Use Base instead** (already configured, very cheap)?
3. **Set up backend signing** on Base/Optimism (best UX)?
4. **Deploy smart contract** to Base for testing?

Let me know! 🚀

---

## Resources

- **Privy Docs:** https://docs.privy.io
- **Viem Chains:** https://viem.sh/docs/chains/introduction
- **Chainlist:** https://chainlist.org (find any chain details)
- **Base Docs:** https://docs.base.org
- **Optimism Docs:** https://docs.optimism.io

**Bottom line:** Privy works with **ANY EVM chain**, including Status Network! ✅
