'use client'

import { http, createConfig, fallback } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from '@wagmi/core'

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [arbitrumSepolia.id]: fallback([
      http('https://arbitrum-sepolia-rpc.publicnode.com'),
      http('https://sepolia-rollup.arbitrum.io/rpc'),
      http('https://rpc.ankr.com/arbitrum_sepolia'),
    ]),
  },
})

export { arbitrumSepolia }
