import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { PrivyProvider } from '@privy-io/react-auth';
import { mainnet, polygon, base, arbitrum, optimism, avalanche, bsc, celo, linea, scroll } from 'viem/chains';
import { defineChain } from 'viem';

// Status Network Testnet
const statusNetworkTestnet = defineChain({
  id: 1660990954,
  name: 'Status Network Testnet',
  network: 'status-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://public.sepolia.rpc.status.network'],
    },
    public: {
      http: ['https://public.sepolia.rpc.status.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Status Network Explorer',
      url: 'https://sepoliascan.status.network',
    },
  },
  testnet: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        // Appearance
        appearance: {
          theme: 'dark', // Will sync with your theme toggle
          accentColor: '#6366F1', // Indigo accent
          logo: '/logo.png', // Add your logo (optional)
        },
        // Login methods - ALL enabled as requested
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord', 'github'],
        // Embedded wallets for users without crypto wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets' as any, // Type workaround
          noPromptOnSignature: false,
        } as any,
        // Wallet configuration - All EVM chains + Status Network
        defaultChain: statusNetworkTestnet, // Status Network as default!
        supportedChains: [
          statusNetworkTestnet, // Status Network Testnet (PRIMARY)
          mainnet,              // Ethereum
          polygon,              // Polygon
          base,                 // Base
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
