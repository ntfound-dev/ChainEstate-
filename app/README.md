# ChainEstate — Frontend

> Next.js 14 App Router frontend for ChainEstate. Dark luxury aesthetic with encrypted data effects. Powered by iExec Nox TEE + ChainGPT AI.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, stats, tech pillars, featured properties, airdrop banner |
| `/properties` | Browse all 5 active property listings |
| `/properties/[id]` | Property detail — gallery, financials, real on-chain buy flow |
| `/market` | Secondary market — real sell (createListing) + buy (executeBuy) |
| `/dashboard` | Investor portfolio — holdings, yield history, CEST balance |
| `/airdrop` | Genesis CEST airdrop — task tracker, score card, allocation |
| `/faucet` | Testnet tokens — 1,000 USDT + 2,400 CEST per claim (24h cooldown) |
| `/api/nft/[id]` | ERC-721 metadata JSON per property (OpenSea standard) |
| `/api/faucet` | Backend: mint USDT + transfer CEST |
| `/api/chatbot` | ChainGPT streaming proxy |

---

## Design System

- **Background:** `#080810` (void black)
- **Accent:** `#c9a84c` (gold primary), `#f0c96e` (gold bright)
- **Privacy:** `#00e5a0` (Nox green — encrypted/confidential indicators)
- **Fonts:** Cinzel (display) + DM Mono (body) + Orbitron (data/numbers)
- **Effects:** EncryptedRain (hex matrix background), AmbientOrbs (glow blobs)

---

## Key Components

```
components/
├── effects/
│   ├── EncryptedRain.tsx       ← Scrolling hex matrix background
│   └── AmbientOrbs.tsx         ← Animated gold glow orbs
├── ui/
│   ├── PropertyCard.tsx        ← Property card with shine hover
│   ├── ConfidentialBadge.tsx   ← "CONFIDENTIAL" badge for encrypted data
│   ├── TransactionModal.tsx    ← Buy/sell confirmation with tx hash
│   ├── AIChatbot.tsx           ← ChainGPT AI assistant (streaming)
│   └── Toast.tsx               ← Notification toasts
├── market/
│   ├── MarketListingsPanel.tsx ← Listings table (CEST + 5 property tokens)
│   ├── MarketTradePanel.tsx    ← Buy / sell / create listing panel
│   └── types.ts                ← MarketListingView, TradeStep, HandleStatus
├── dashboard/
│   ├── DashboardShell.tsx      ← Layout + CEST balance sidebar
│   └── types.ts
├── layout/
│   └── Navbar.tsx              ← Responsive nav: Properties, Market, Dashboard, Airdrop, Faucet
└── web3/
    ├── WalletButton.tsx         ← SSR-safe connect/disconnect
    ├── Web3Provider.tsx         ← Wagmi v2 config provider
    ├── useClientAccount.ts      ← Hydration-safe wrapper (fixes SSR mismatch)
    └── useNoxHandleClient.ts    ← createViemHandleClient hook (ready/initializing/error)
```

---

## Web3 Integration

- **Wagmi v2** — `useWriteContract`, `usePublicClient`, `useAccount`, `useConnectorClient`
- **Viem** — ABI encoding, `waitForTransactionReceipt`
- **`@iexec-nox/handle`** — `createViemHandleClient`, `encryptInput` → `{ handle, handleProof }`
- Network: Arbitrum Sepolia (chainId 421614)
- All ABIs and addresses centralised in `app/lib/contracts.ts`

### SSR Safety

`useClientAccount` wraps wagmi's `useAccount` and returns `isConnected: false, address: undefined` until after hydration. All pages and the `WalletButton` use this hook — eliminates "Text content did not match" hydration errors.

---

## Real On-Chain Buy Flow (`/properties/[id]`)

```typescript
// Step 1 — Encrypt via iExec Nox TEE
const { handle, handleProof } = await handleClient.encryptInput(
  tokenAmount, 'uint256', property.contractAddress
)

// Step 2 — Approve USDT (6 decimals: 1 token = 1_000_000)
await writeContractAsync({ address: USDT, abi: ERC20_ABI, functionName: 'approve',
  args: [property.contractAddress, tokenAmount * 1_000_000n] })

// Step 3 — Purchase confidential tokens
await writeContractAsync({ address: property.contractAddress, abi: PROPERTY_TOKEN_ABI,
  functionName: 'purchaseTokens', args: [handle, handleProof, tokenAmount] })
```

## Real On-Chain Sell Flow (`/market`)

```typescript
// Step 1 — Grant operator rights (7-day window)
await writeContractAsync({ address: propertyContract, abi: PROPERTY_TOKEN_ABI,
  functionName: 'grantOperator', args: [SECONDARY_MARKET, expiry] })

// Step 2 — Create listing (pricePerToken in USDT 6 decimals)
await writeContractAsync({ address: SECONDARY_MARKET, abi: SECONDARY_MARKET_ABI,
  functionName: 'createListing',
  args: [tokenContract, propertyId, tokenAmount, pricePerTokenUsdt] })
```

---

## CEST Token

| Field | Value |
|-------|-------|
| Price | **$0.04** |
| Total Supply | 1,000,000,000 CEST |
| Market Cap | $40,000,000 |
| Airdrop Pool | 250M CEST ($10M) |
| Faucet Claim | 2,400 CEST (~$96) |
| Contract | `0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D` |

CEST price is displayed consistently across Dashboard, Faucet, Airdrop, and Market pages via `TOKEN_PRICES.CEST = 0.04` in `app/lib/contracts.ts`.

---

## Market Page — Listings

The market shows **6 entries** total:

| # | Token | Type | Trade |
|---|-------|------|-------|
| 1 | CEST | Governance (GOV) | DEX ↗ (Uniswap) |
| 2 | PEARL-DXB-001 | Property ERC-7984 | Buy / Sell |
| 3 | SHIBUYA-TYO-001 | Property ERC-7984 | Buy / Sell |
| 4 | MARINA-SGP-001 | Property ERC-7984 | Buy / Sell |
| 5 | CANARY-LON-001 | Property ERC-7984 | Buy / Sell |
| 6 | AZURE-BCN-001 | Property ERC-7984 | Buy / Sell |

---

## AI Chatbot (ChainGPT)

```typescript
import { GeneralChat } from "@chaingpt/generalchat"
// Configured in components/ui/AIChatbot.tsx + /api/chatbot/route.ts
```

- Powered by ChainGPT Web3 LLM
- Answers questions about ChainEstate, iExec Nox, ERC-7984
- Streaming responses via Server-Sent Events

---

## Key Libraries (`app/lib/`)

| File | Purpose |
|------|---------|
| `contracts.ts` | Contract addresses, ABIs (ERC20, PropertyToken, SecondaryMarket), CEST price constants |
| `propertiesData.ts` | All 5 properties with deployed contract addresses + NFT metadata |
| `marketData.ts` | Market listings (CEST + 5 property tokens) with price/volume data |
| `dashboardData.ts` | Portfolio mock data, income history, transfer contacts |
| `wagmi.ts` | Wagmi v2 config for Arbitrum Sepolia |

---

## Running Locally

```bash
npm run dev
# → http://localhost:3000
```

## Environment Variables

```bash
# Required
CHAINGPT_API_KEY=your_chaingpt_key
FAUCET_PRIVATE_KEY=0x...  # wallet that holds CEST for faucet transfers

# Optional (contracts already hardcoded in app/lib/contracts.ts)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
