<div align="center">

# ⛓ ChainEstate

### Fractional Real Estate Tokenization with Financial Privacy

*Invest in premium global real estate — balances encrypted, yields private, ownership on-chain.*

[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum%20Sepolia-blue?logo=ethereum)](https://sepolia.arbiscan.io)
[![iExec Nox](https://img.shields.io/badge/Privacy-iExec%20Nox%20ERC--7984-00e5a0)](https://docs.iex.ec/nox-protocol)
[![ChainGPT](https://img.shields.io/badge/AI-ChainGPT-gold)](https://chaingpt.org)
[![Tests](https://img.shields.io/badge/Tests-60%20passing-green)](#)

</div>

---

## What is ChainEstate?

ChainEstate lets anyone buy fractional ownership of premium real estate (Dubai, NYC, Singapore) using stablecoins. What makes it unique:

- 🔒 **Encrypted balances** — Your token holdings are private. No one can see how much you own.
- 💰 **Private yield** — Monthly rental income distributed without revealing per-investor amounts.
- 🔄 **Liquid market** — Trade your fractions on the built-in secondary market.
- 🏆 **CEST staking** — Stake governance tokens for fee discounts (up to 100% free trading).
- 🤖 **AI Assistant** — Powered by ChainGPT for Web3 help and smart contract insights.

---

## Hackathon Challenges

| Challenge | Status |
|-----------|--------|
| **ChainGPT** — AI-powered Web3 product | ✅ ChainGPT SDK integrated (AIChatbot) |
| **iExec Nox** — ERC-7984 Confidential Tokens | ✅ PropertyToken uses ERC-7984 encrypted balances |

---

## Tech Stack

### Smart Contracts
| Component | Technology |
|-----------|-----------|
| Blockchain | Arbitrum Sepolia (chainId 421614) |
| Privacy Layer | iExec Nox Protocol — ERC-7984 |
| Language | Solidity 0.8.28 |
| Framework | Hardhat 2.28 + TypeScript |
| Governance Token | ERC20Votes (CEST) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Web3 | Wagmi v3 + Viem |
| AI | ChainGPT SDK (`@chaingpt/generalchat`) |

---

## Project Structure

```
ChainEstate/
├── app/                          ← Next.js frontend
│   ├── page.tsx                  ← Landing page
│   ├── properties/               ← Property listings + detail
│   ├── dashboard/                ← Investor portfolio
│   ├── market/                   ← Secondary market DEX
│   ├── admin/                    ← Platform admin panel
│   └── components/
│       ├── effects/              ← EncryptedRain, AmbientOrbs
│       ├── ui/                   ← PropertyCard, ConfidentialBadge, AIChatbot
│       ├── market/               ← MarketListingsPanel, MarketTradePanel
│       ├── admin/                ← AdminTabs, ListingWizardModal
│       └── web3/                 ← WalletButton, Web3Provider
├── contracts/                    ← Hardhat smart contracts
│   ├── core/
│   │   ├── PropertyToken.sol     ← ERC-7984 confidential token per property
│   │   ├── PropertyRegistry.sol  ← Registry + CREATE2 factory
│   │   └── RentDistributor.sol   ← Private rent distribution
│   ├── tokens/
│   │   └── CESTToken.sol         ← Governance + staking token
│   ├── market/
│   │   └── SecondaryMarket.sol   ← P2P DEX
│   └── libraries/
│       └── ChainEstateLib.sol    ← Shared types
├── scripts/
│   ├── deploy.ts                 ← Deploy all contracts
│   ├── seed.ts                   ← Populate demo data
│   └── verify.ts                 ← Verify on Arbiscan
├── test/                         ← 60 tests across 5 suites
├── hardhat.config.ts
├── tsconfig.hardhat.json         ← Hardhat-specific TS config
└── .env.example
```

---

## Privacy Architecture

```
Investor Wallet
      │
      ▼ purchaseTokens(encryptedHandle, proof, clearAmount)
PropertyToken (ERC-7984)
      │ euint256 balance (encrypted, only you can read)
      │
      ▼ distributeRent()
RentDistributor
      │ Equal USDT distribution — on-chain events show only totals, never per-investor amounts
      ▼
Each Holder Wallet

SecondaryMarket
      │ listing.tokenAmount is PUBLIC (necessary for price discovery)
      │ but balance in PropertyToken remains ENCRYPTED
      ▼ confidentialTransferFrom via Nox TEE
```

The iExec **Handle Gateway** (Intel TDX TEE) is the only entity that can compute on encrypted values. Smart contracts submit encrypted handles; the TEE processes them off-chain and returns results.

---

## Smart Contract Addresses

> Deployed on Arbitrum Sepolia — addresses saved in `deployments.json` after deploy.

| Contract | Address |
|----------|---------|
| CESTToken | *see deployments.json* |
| PropertyRegistry | *see deployments.json* |
| RentDistributor | *see deployments.json* |
| SecondaryMarket | *see deployments.json* |
| Demo PropertyToken | *see deployments.json* |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Arbitrum Sepolia ETH (faucet: https://faucet.triangleplatform.com/arbitrum/sepolia)
- USDT testnet (faucet: https://cdefi.iex.ec/)

### Install
```bash
git clone <repo>
cd ChainEstate
npm install
```

### Run Frontend
```bash
npm run dev
# Open http://localhost:3000
```

### Deploy Contracts
```bash
cp .env.example .env
# Fill in: PRIVATE_KEY, ARBITRUM_SEPOLIA_RPC, USDT_ADDRESS, TREASURY_ADDRESS, ARBISCAN_API_KEY

npm run compile
npm run deploy:testnet
npm run seed:testnet    # populate demo data
npm run verify:testnet  # verify on Arbiscan
```

### Run Tests
```bash
npm run test
# 60 passing
```

---

## Fee Structure

| Action | Fee | CEST Discount |
|--------|-----|---------------|
| Primary purchase | 0% | — |
| Secondary trading | 0.5% | Up to 100% (PLATINUM) |
| Rent distribution | Platform: 5% + Maintenance: 5% | — |

---

## CEST Staking Tiers

| Tier | Stake | Trading Fee |
|------|-------|------------|
| NONE | — | 0.5% |
| BRONZE | 1,000 CEST | 0.45% (−10%) |
| SILVER | 10,000 CEST | 0.35% (−30%) |
| GOLD | 50,000 CEST | 0.25% (−50%) |
| PLATINUM | 200,000 CEST | 0% (free) |

---

## Links

- 🌐 [iExec Nox Docs](https://docs.iex.ec/nox-protocol/getting-started/welcome)
- 🔬 [Nox cDefi Demo + Faucet](https://cdefi.iex.ec/)
- 🤖 [ChainGPT Platform](https://chaingpt.org)
- 📦 [iExec Nox NPM](https://www.npmjs.com/org/iexec-nox)

---

<div align="center">

*Built for ChainGPT × iExec Nox Hackathon | Chain: Arbitrum Sepolia*

</div>
