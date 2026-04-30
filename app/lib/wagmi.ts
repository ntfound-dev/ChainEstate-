'use client'

import { http, createConfig, fallback } from 'wagmi'
import { injected } from '@wagmi/core'
import { arbitrumSepolia } from './chains'

const publicRpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC
const defaultRpcUrls = [
  'https://arbitrum-sepolia-rpc.publicnode.com',
  'https://sepolia-rollup.arbitrum.io/rpc',
  'https://rpc.ankr.com/arbitrum_sepolia',
]
const rpcUrls = publicRpcUrl ? [publicRpcUrl, ...defaultRpcUrls] : defaultRpcUrls

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected({ target: 'metaMask', unstable_shimAsyncInject: 1_000 }),
  ],
  transports: {
    [arbitrumSepolia.id]: fallback(rpcUrls.map((url) => http(url))),
  },
})

export { arbitrumSepolia }
