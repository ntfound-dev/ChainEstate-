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

## Problem & Solution

### The Problem

**$326 trillion** in global real estate wealth is locked away from ordinary investors:

| Pain Point | Reality Today |
|-----------|---------------|
| **High entry barrier** | Buying property requires $100K–$1M+ in capital |
| **Zero liquidity** | You can't sell 10% of your apartment — it's all or nothing |
| **No financial privacy** | On public blockchains, anyone can see your full portfolio and rental income |
| **Rent opacity** | Investors have no on-chain proof of yield or distribution fairness |
| **Geographic exclusion** | Cross-border ownership is legally complex and expensive |

### The Solution

ChainEstate breaks every barrier:

| Problem | ChainEstate Solution |
|---------|---------------------|
| High entry barrier | Fractional tokens from $1 — anyone with USDT can invest |
| Zero liquidity | P2P secondary market with instant settlement |
| No financial privacy | **iExec Nox ERC-7984**: holdings and rent amounts stay encrypted on-chain |
| Rent opacity | Smart contract distributes USDT to all holders, fully auditable totals |
| Geographic exclusion | Permissionless — any wallet globally, no KYC friction |

---

## Real-World Impact

```
Traditional Real Estate           ChainEstate
─────────────────────             ──────────────────────
Min. investment: $50,000+    →    Min. investment: $1
Time to sell: 3–12 months    →    Time to sell: seconds
Portfolio visible to all     →    Holdings encrypted by TEE
Rent paid manually           →    Rent auto-distributed on-chain
Access: accredited only      →    Access: any wallet worldwide
```

**Who benefits:**
- 🌍 **Emerging market investors** — own a slice of Dubai, NYC, or Singapore real estate from anywhere
- 🔐 **Privacy-first investors** — hold and trade without exposing net worth on a public ledger
- 🏗 **Property developers** — tokenize assets and raise capital globally without traditional brokers
- 💹 **DeFi traders** — liquid real-estate-backed assets with a built-in secondary market

**Why iExec Nox matters here:**  
Traditional RWA tokens expose your entire portfolio on-chain. A whale accumulating $10M in Dubai apartments is fully visible — creating front-running, targeting, and privacy risks. ERC-7984 encrypted balances make ChainEstate the **first real estate tokenization platform where financial positions are genuinely private**.

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
| CESTToken | [`0xD57f88B64611dBf74f87FC40f2F1010320483584`](https://sepolia.arbiscan.io/address/0xD57f88B64611dBf74f87FC40f2F1010320483584) |
| PropertyRegistry | [`0xbED7ad48984fBb3984F5aF83E176fb9f40dB37cc`](https://sepolia.arbiscan.io/address/0xbED7ad48984fBb3984F5aF83E176fb9f40dB37cc) |
| RentDistributor | [`0xCc6296557c05ca02f3258DEd19f4104a9C19a80B`](https://sepolia.arbiscan.io/address/0xCc6296557c05ca02f3258DEd19f4104a9C19a80B) |
| SecondaryMarket | [`0x1288dF9F55673cBFc97BCe7aD5445D77B9029B92`](https://sepolia.arbiscan.io/address/0x1288dF9F55673cBFc97BCe7aD5445D77B9029B92) |
| Demo PropertyToken (Pearl Dubai) | [`0x6DA3c5DABA3a18FEeD396f25b857be77B497A55A`](https://sepolia.arbiscan.io/address/0x6DA3c5DABA3a18FEeD396f25b857be77B497A55A) |
| MockERC20 (USDT testnet) | [`0xcE265E23aAc349cEf9Fa3CC058062A44080f2289`](https://sepolia.arbiscan.io/address/0xcE265E23aAc349cEf9Fa3CC058062A44080f2289) |

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

## Makefile Commands

All common tasks are wired into `make`. Run `make help` to see the full list.

```bash
make help             # Show all available commands
```

### Setup & Frontend
| Command | Description |
|---------|-------------|
| `make install` | Install all Node dependencies |
| `make dev` | Start Next.js frontend at `http://localhost:3000` |

### Smart Contracts
| Command | Description |
|---------|-------------|
| `make compile` | Compile all Solidity contracts |
| `make test` | Run full test suite (60 tests) |
| `make typecheck` | TypeScript type-check without emitting |

### Local Development
| Command | Description |
|---------|-------------|
| `make node` | Start a local Hardhat node (chainId 31337) |
| `make deploy-local` | Deploy all contracts to local node |
| `make seed-local` | Seed demo property data on local node |

### Arbitrum Sepolia Testnet
| Command | Description |
|---------|-------------|
| `make deploy-testnet` | Deploy contracts to Arbitrum Sepolia |
| `make seed-testnet` | Seed demo data on Arbitrum Sepolia |
| `make verify-testnet` | Verify contracts on Arbiscan |

### Maintenance
| Command | Description |
|---------|-------------|
| `make clean` | Remove `artifacts/`, `cache/`, `typechain-types/` |
| `make rebuild` | Clean then recompile from scratch |

> **Note:** `deploy-testnet` requires `PRIVATE_KEY` filled in `.env`. All other commands work without it.

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
