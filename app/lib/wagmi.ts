'use client'

import { http, createConfig, fallback } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from '@wagmi/core'

const publicRpcUrl = process.env.NEXT_PUBLIC_RPC_URL
const defaultRpcUrls = [
  'https://arbitrum-sepolia-rpc.publicnode.com',
  'https://sepolia-rollup.arbitrum.io/rpc',
  'https://rpc.ankr.com/arbitrum_sepolia',
]
const rpcUrls = publicRpcUrl ? [publicRpcUrl, ...defaultRpcUrls] : defaultRpcUrls

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [arbitrumSepolia.id]: fallback(rpcUrls.map((url) => http(url))),
  },
})

export { arbitrumSepolia }
