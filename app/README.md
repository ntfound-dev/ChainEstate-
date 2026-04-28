# ChainEstate — Frontend

> Next.js 14 App Router frontend for ChainEstate. Dark luxury aesthetic with encrypted data effects, powered by iExec Nox + ChainGPT.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, stats, how it works, featured properties |
| `/properties` | Browse all active property listings with filters |
| `/properties/[id]` | Property detail — financials, tokenomics, buy modal |
| `/dashboard` | Investor portfolio — holdings, yield history |
| `/market` | Secondary market DEX — create/execute listings |
| `/admin` | Platform admin — list properties, deposit/distribute rent |

## Design System

- **Background:** `#080810` (void black)
- **Accent:** `#c9a84c` (gold primary), `#f0c96e` (gold bright)
- **Privacy:** `#00e5a0` (Nox green — encrypted/confidential indicators)
- **Fonts:** Cinzel (display) + DM Mono (body) + Orbitron (data/numbers)
- **Effects:** EncryptedRain (matrix hex background), AmbientOrbs (glow blobs)

## Key Components

```
components/
├── effects/
│   ├── EncryptedRain.tsx     ← Scrolling hex matrix background
│   └── AmbientOrbs.tsx       ← Animated gold glow orbs
├── ui/
│   ├── PropertyCard.tsx      ← Property card with shine hover effect
│   ├── ConfidentialBadge.tsx ← "CONFIDENTIAL" badge for encrypted data
│   ├── DecryptButton.tsx     ← Triggers Nox Handle Gateway decryption
│   ├── AIChatbot.tsx         ← ChainGPT-powered AI assistant
│   ├── TransactionModal.tsx  ← Buy/sell confirmation modal
│   └── Toast.tsx             ← Notification toasts
├── market/
│   ├── MarketListingsPanel.tsx  ← Active listings order book
│   └── MarketTradePanel.tsx     ← Create listing / execute buy
├── admin/
│   ├── AdminTabs.tsx
│   ├── AdminPropertiesPanel.tsx ← List new properties
│   ├── AdminRentPanel.tsx       ← Deposit + distribute rent
│   ├── AdminRegistryPanel.tsx   ← Registry management
│   └── ListingWizardModal.tsx   ← Multi-step property listing form
├── layout/
│   └── Navbar.tsx            ← Responsive nav with wallet connection
└── web3/
    ├── WalletButton.tsx      ← Connect/disconnect wallet
    └── Web3Provider.tsx      ← Wagmi + RainbowKit provider
```

## Web3 Integration

- **Wagmi v3** — wallet connections, contract reads/writes
- **Viem** — ABI encoding, transaction building
- Contract ABIs loaded from `../../artifacts/contracts/...`
- Network: Arbitrum Sepolia (chainId 421614)

## AI Chatbot (ChainGPT)

```typescript
import { GeneralChat } from "@chaingpt/generalchat";
// Configured in components/ui/AIChatbot.tsx
```

- Powered by ChainGPT Web3 LLM
- Answers questions about ChainEstate, iExec Nox, smart contracts
- Streaming responses

## Running Locally

```bash
npm run dev
# → http://localhost:3000
```

## Environment Variables

See root `.env.example`. Frontend uses:
```bash
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_CEST_ADDRESS=0x...
NEXT_PUBLIC_MARKET_ADDRESS=0x...
NEXT_PUBLIC_RENT_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_USDT_ADDRESS=0x...
CHAINGPT_API_KEY=your_key
```
