'use client'

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, bsc, mainnet } from "wagmi/chains";
import { type Chain } from 'viem';
import { http } from 'wagmi';

export const localTestnet = {
  id: 31337,
  name: 'localhost',
  nativeCurrency: {
    name: 'GO',
    symbol: 'GO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545/'],
    },
    public: {
      http: ['http://127.0.0.1:8545/'],
    },
  },
  testnet: true,
} as const satisfies Chain;

const hyperliquidTestnet = {
  id: 998,
  name: 'Hyperliquid Testnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
  testnet: true,
} as const satisfies Chain;


export const hyperliquidMainnet = {
  id: 999,
  name: 'Hyperliquid Mainnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://rpc.hyperliquid.xyz/evm",
        // "https://rpc.underlayer.dev",
        "https://rpc.purroofgroup.com",
        // "https://arcane-flux.purroofgroup.com",
      ],
    },
    public: {
      http: [
        "https://rpc.hyperliquid.xyz/evm",
        // "https://rpc.underlayer.dev",
        "https://rpc.purroofgroup.com",
        // "https://arcane-flux.purroofgroup.com",
      ],
    },
  },
  testnet: false,
} as const satisfies Chain;

export const HyperliquidProofRPC = "https://rpc.purroofgroup.com"
export const hostNetwork = hyperliquidMainnet


export const wagmiConfig = getDefaultConfig({
  appName: "Balance Proof",
  projectId: "YOUR_PROJECT_ID",
  chains: [mainnet, hyperliquidMainnet, hyperliquidTestnet, bsc, arbitrum, localTestnet],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [hyperliquidMainnet.id]: http(undefined, {timeout: 60_000}),
    [hyperliquidTestnet.id]: http(),
    [localTestnet.id]: http(),
  },
  ssr: true,
});