// Token prices (testnet display prices — mirrored from launch tokenomics)
export const TOKEN_PRICES = {
  CEST:       0.04,   // $0.04 per CEST — $40M market cap at 1B supply
  USDT:       1.00,   // stablecoin, always $1.00
} as const

export const CEST_TOTAL_SUPPLY    = 1_000_000_000   // 1 billion
export const CEST_AIRDROP_SUPPLY  =   250_000_000   // 250 million (25%)
export const CEST_MARKET_CAP      = CEST_TOTAL_SUPPLY * TOKEN_PRICES.CEST  // $40,000,000

// Contract addresses — Arbitrum Sepolia testnet
export const ADDRESSES = {
  usdt:             '0x9a822B9A50D090CfcCa1e6474efCd653112d8501' as const,
  registry:         '0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e' as const,
  secondaryMarket:  '0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa' as const,
  rentDistributor:  '0x80E0e5f6488FA2726c042a204344281974f72609' as const,
  cestToken:        '0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D' as const,
}

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export const PROPERTY_TOKEN_ABI = [
  {
    name: 'purchaseTokens',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'handle',      type: 'bytes32' },
      { name: 'handleProof', type: 'bytes'   },
      { name: 'clearAmount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'grantOperator',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'expiry',   type: 'uint256' },
    ],
    outputs: [],
  },
] as const

export const REGISTRY_ABI = [
  {
    name: 'getPropertyHolders',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs:  [{ name: 'propertyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'propertyCount',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs:  [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const SECONDARY_MARKET_ABI = [
  {
    name: 'createListing',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'tokenContract',  type: 'address' },
      { name: 'propertyId',     type: 'uint256' },
      { name: 'tokenAmount',    type: 'uint256' },
      { name: 'pricePerToken',  type: 'uint256' },
    ],
    outputs: [{ name: 'listingId', type: 'uint256' }],
  },
  {
    name: 'executeBuy',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'listingId',   type: 'uint256' },
      // externalEuint256 ABI-encodes as bytes32 — produced by the iExec Nox iApp in TEE
      { name: 'handle',      type: 'bytes32' },
      { name: 'handleProof', type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    name: 'cancelListing',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'listings',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'listingId',    type: 'uint256' },
      { name: 'seller',       type: 'address' },
      { name: 'tokenContract',type: 'address' },
      { name: 'propertyId',   type: 'uint256' },
      { name: 'tokenAmount',  type: 'uint256' },
      { name: 'pricePerToken',type: 'uint256' },
      { name: 'listedAt',     type: 'uint256' },
      { name: 'active',       type: 'bool'    },
    ],
  },
] as const
