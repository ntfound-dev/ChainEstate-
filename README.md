<div align="center">

# ⛓ ChainEstate

### Fractional Real Estate Tokenization with Financial Privacy

*Invest in premium global real estate — balances encrypted, yields private, ownership on-chain.*

[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum%20Sepolia-blue?logo=ethereum)](https://sepolia.arbiscan.io)
[![iExec Nox](https://img.shields.io/badge/Privacy-iExec%20Nox%20ERC--7984-00e5a0)](https://docs.iex.ec/nox-protocol)
[![ChainGPT](https://img.shields.io/badge/AI-ChainGPT-gold)](https://chaingpt.org)
[![Tests](https://img.shields.io/badge/Tests-60%20passing-green)](#)
[![CEST](https://img.shields.io/badge/CEST-$0.04-yellow)](#cest-token)

</div>

---

## What is ChainEstate?

ChainEstate lets anyone buy fractional ownership of premium real estate (Dubai, Tokyo, Singapore, London, Barcelona) using stablecoins — starting from $1. What makes it unique:

- 🔒 **Encrypted balances** — Your token holdings are private. No one on-chain can see how much you own.
- 💰 **Private yield** — Monthly rental income distributed without revealing per-investor amounts.
- 🔄 **Real secondary market** — List and buy property tokens on-chain via `SecondaryMarket.sol`.
- 🏆 **CEST governance** — Stake for fee discounts (up to 100% free trading) and on-chain voting.
- 🤖 **AI Assistant** — Powered by ChainGPT for Web3 help and smart contract insights.
- 🪂 **Genesis Airdrop** — 250M CEST pool ($10M) for early community members.

---

## Hackathon Challenges

| Challenge | Status |
|-----------|--------|
| **ChainGPT** — AI-powered Web3 product | ✅ ChainGPT SDK integrated (`AIChatbot`) |
| **iExec Nox** — ERC-7984 Confidential Tokens | ✅ All 5 utility types implemented |

### Confidential Token Utility — iExec Nox ERC-7984

`PropertyToken` is an ERC-7984 confidential token. Its encrypted balance covers all 5 required utility types:

| Utility | Implementation | Contract |
|---------|---------------|----------|
| **Private Payments** | `purchaseTokens(handle, handleProof, clearAmount)` — amount encrypted via Intel TDX TEE before reaching the chain | `PropertyToken.sol` |
| **Private Transfers** | `SecondaryMarket.executeBuy()` calls `confidentialTransferFrom` — amounts invisible to observers | `SecondaryMarket.sol` |
| **Rewards** | USDT rent distributed to all holders — events show totals only, never per-investor amounts | `RentDistributor.sol` |
| **Governance** | Token-gated proposals and votes. Balance privacy eliminates visible whale dominance | `ConfidentialGovernance.sol` |
| **Access Control** | `onlyHolder` modifier gates governance to verified `PropertyToken` holders via `registry.isHolder()` | `ConfidentialGovernance.sol` |

---

## Problem & Solution

**$326 trillion** in global real estate locked from ordinary investors:

| Pain Point | ChainEstate Solution |
|-----------|---------------------|
| High entry barrier ($100K+) | Fractional tokens from $1 — any USDT wallet can invest |
| Zero liquidity | Real P2P secondary market, instant on-chain settlement |
| No financial privacy | iExec Nox ERC-7984: holdings + rent amounts encrypted on-chain |
| Rent opacity | Smart contract distributes USDT — totals auditable, per-investor private |
| Geographic exclusion | Permissionless — any wallet globally, no KYC |

---

## On-Chain Transaction Flows

### Primary Market Buy (`/properties/[id]`)
```
1. encryptInput(tokenAmount, 'uint256', propertyContract)  ← @iexec-nox/handle SDK
   → { handle: bytes32, handleProof: bytes }

2. usdt.approve(propertyContract, tokenAmount × 1_000_000)  ← USDT 6 decimals

3. propertyToken.purchaseTokens(handle, handleProof, clearAmount)
   → balance stored as euint256 (encrypted)
```

### Secondary Market Sell (`/market`)
```
1. propertyToken.grantOperator(secondaryMarket, expiry)  ← 7-day window

2. secondaryMarket.createListing(tokenContract, propertyId, tokenAmount, pricePerToken)
   → pricePerToken in USDT 6 decimals (e.g. $1.025 = 1_025_000)
   → returns listingId
```

### Secondary Market Buy (`/market`)
```
1. usdt.approve(secondaryMarket, totalCost)

2. secondaryMarket.executeBuy(listingId)
   → confidentialTransferFrom: seller → buyer (encrypted)
```

---

## Privacy Architecture

```
Investor Wallet
      │
      ▼  @iexec-nox/handle: createViemHandleClient → encryptInput()
      │  Intel TDX TEE returns { handle: bytes32, handleProof: bytes }
      ▼
PropertyToken.purchaseTokens(handle, handleProof, clearAmount)
      │  euint256 balance — encrypted, readable only via Handle Gateway
      │
      ▼  distributeRent()
RentDistributor → USDT per holder (events: totals only, never per-investor)

SecondaryMarket
      │  listing.tokenAmount = public (needed for price discovery)
      │  PropertyToken euint256 balance stays ENCRYPTED throughout
      ▼  confidentialTransferFrom via Nox TEE
```

---

## CEST Token

| Property | Value |
|----------|-------|
| **Price** | **$0.04 USD** |
| Total Supply | 1,000,000,000 CEST |
| Market Cap | $40,000,000 |
| Airdrop Pool | 250,000,000 CEST ($10M) |
| Decimals | 18 |
| Standard | ERC20Votes (governance) |
| Contract | [`0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D`](https://sepolia.arbiscan.io/address/0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D) |

### Token Allocation
| Category | Amount | % |
|----------|--------|---|
| Ecosystem | 300M CEST | 30% |
| Airdrop | 250M CEST | 25% |
| Investor | 200M CEST | 20% |
| Team | 150M CEST | 15% |
| Reserve | 100M CEST | 10% |

### Staking Tiers
| Tier | Stake Required | USD Value | Trading Fee |
|------|---------------|-----------|-------------|
| NONE | — | — | 0.5% |
| BRONZE | 1,000 CEST | $40 | 0.45% (−10%) |
| SILVER | 10,000 CEST | $400 | 0.35% (−30%) |
| GOLD | 50,000 CEST | $2,000 | 0.25% (−50%) |
| PLATINUM | 200,000 CEST | $8,000 | 0% (free) |

---

## Smart Contract Addresses — Arbitrum Sepolia

> All contracts live on chainId 421614. Full list in `deployments.json`.

### Core Contracts
| Contract | Address |
|----------|---------|
| CESTToken | [`0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D`](https://sepolia.arbiscan.io/address/0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D) |
| PropertyRegistry | [`0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e`](https://sepolia.arbiscan.io/address/0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e) |
| RentDistributor | [`0x80E0e5f6488FA2726c042a204344281974f72609`](https://sepolia.arbiscan.io/address/0x80E0e5f6488FA2726c042a204344281974f72609) |
| SecondaryMarket | [`0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa`](https://sepolia.arbiscan.io/address/0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa) |
| ConfidentialGovernance | [`0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14`](https://sepolia.arbiscan.io/address/0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14) |
| MockUSDT (testnet) | [`0x9a822B9A50D090CfcCa1e6474efCd653112d8501`](https://sepolia.arbiscan.io/address/0x9a822B9A50D090CfcCa1e6474efCd653112d8501) |
| Treasury | `0x834De729cb9dF77451DBc6bf7FD05F475B011Ac7` |

### Property Tokens (ERC-7984) — All 5 Live on Arbitrum Sepolia
| Property | Ticker | Supply | Price | Contract |
|----------|--------|--------|-------|----------|
| The Pearl Residences, Dubai | PEARL-DXB-001 | 500,000 | $1.00 | [`0x853D51fB...`](https://sepolia.arbiscan.io/address/0x853D51fBD5E288BF189FE0126d59f855c821a641) |
| Shibuya Terrace, Tokyo | SHIBUYA-TYO-001 | 380,000 | $1.00 | [`0x457d78AD...`](https://sepolia.arbiscan.io/address/0x457d78AD2912923897B93fD82d502aD0B34E54eA) |
| Marina Heights, Singapore | MARINA-SGP-001 | 620,000 | $1.00 | [`0x57D15966...`](https://sepolia.arbiscan.io/address/0x57D15966CD4203cC8FbC1fd6763Be935d27D1178) |
| Canary Wharf Executive, London | CANARY-LON-001 | 850,000 | $1.00 | [`0x7fB7e724...`](https://sepolia.arbiscan.io/address/0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23) |
| Azure Barcelona Suite | AZURE-BCN-001 | 290,000 | $1.00 | [`0xA3dDfe78...`](https://sepolia.arbiscan.io/address/0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe) |

All 5 confirmed live: `propertyCount = 5` on-chain, `pricePerToken = 1_000_000` (1 USDT, 6 dec).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | Arbitrum Sepolia (chainId 421614) |
| Privacy | iExec Nox Protocol — ERC-7984 Confidential Tokens |
| Smart Contracts | Solidity 0.8.28, Hardhat 2.28, TypeScript |
| Frontend | Next.js 14 App Router, Tailwind CSS, Framer Motion |
| Web3 | Wagmi v2, Viem, `@iexec-nox/handle` |
| AI | ChainGPT SDK (`@chaingpt/generalchat`) |

---

## Quick Start

```bash
git clone <repo>
cd ChainEstate
npm install
npm run dev
# Open http://localhost:3000
```

Get testnet tokens at `/faucet` (wallet required):
- **1,000 USDT** — buy property tokens
- **2,400 CEST** (~$96) — governance + staking

### Run Tests
```bash
npm run test   # 60 passing
```

### Deploy Contracts (already live — optional)
```bash
cp .env.example .env  # fill PRIVATE_KEY, RPC, etc.
npm run compile
npm run deploy:testnet
npx hardhat run scripts/list-properties.ts --network arbitrumSepolia
npm run verify:testnet
```

---

## NFT Metadata

Each property exposes ERC-721 metadata (OpenSea standard):
```
GET /api/nft/pearl-dxb-001
GET /api/nft/shibuya-tyo-001
GET /api/nft/marina-sgp-001
GET /api/nft/canary-lon-001
GET /api/nft/azure-bcn-001
```

---

## Fee Structure

| Action | Fee | CEST Discount |
|--------|-----|---------------|
| Primary purchase | 0% | — |
| Secondary trading | 0.5% | Up to 100% (PLATINUM tier) |
| Rent distribution | Platform 5% + Maintenance 5% | — |

---

## Links

- 🌐 [iExec Nox Docs](https://docs.iex.ec/nox-protocol/getting-started/welcome)
- 🔬 [Nox cDefi Demo + USDT Faucet](https://cdefi.iex.ec/)
- 🤖 [ChainGPT Platform](https://chaingpt.org)
- 📦 [iExec Nox NPM](https://www.npmjs.com/org/iexec-nox)
- 📊 [Arbiscan — Arbitrum Sepolia](https://sepolia.arbiscan.io)

---

<div align="center">

*Built for ChainGPT × iExec Nox Hackathon | Chain: Arbitrum Sepolia | 2026*

</div>
