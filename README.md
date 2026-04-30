<div align="center">

# ⛓ ChainEstate

### Fractional Real Estate Tokenization with Financial Privacy

*Invest in premium global real estate — balances encrypted, yields private, ownership on-chain.*

[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum%20Sepolia-blue?logo=ethereum)](https://sepolia.arbiscan.io)
[![iExec Nox](https://img.shields.io/badge/Privacy-iExec%20Nox%20ERC--7984-00e5a0)](https://docs.iex.ec/nox-protocol)
[![ChainGPT](https://img.shields.io/badge/AI-ChainGPT-gold)](https://chaingpt.org)
[![Tests](https://img.shields.io/badge/Tests-73%20passing-green)](#)
[![Live](https://img.shields.io/badge/Live-chain--estate--rouge.vercel.app-brightgreen)](https://chain-estate-rouge.vercel.app)

</div>

---

## What is ChainEstate?

ChainEstate lets anyone buy fractional ownership of premium real estate (Dubai, Tokyo, Singapore, London, Barcelona) using stablecoins — starting from $1. What makes it unique:

- 🔒 **Encrypted balances** — Your token holdings are private. No one on-chain can see how much you own.
- 💰 **Private yield** — Monthly rental income distributed without revealing per-investor amounts.
- 🔄 **Real secondary market** — List and buy property tokens on-chain via `SecondaryMarket.sol`.
- 🤖 **iExec TEE** — Token amounts sealed inside Intel TDX enclaves before touching the blockchain.
- 🏆 **CEST governance** — Stake for fee discounts (up to 100% free trading) and on-chain voting.
- 🤖 **AI Assistant** — Powered by ChainGPT for Web3 help and smart contract insights.
- 🪂 **Genesis Airdrop** — 250M CEST pool ($10M) for early community members.

---

## Hackathon Challenges

| Challenge | Status |
|-----------|--------|
| **ChainGPT** — AI-powered Web3 product | ✅ ChainGPT SDK integrated (`AIChatbot`) |
| **iExec Nox** — ERC-7984 Confidential Tokens | ✅ Full TEE pipeline: iApp → Nox gateway → on-chain |

### Confidential Token Utility — iExec Nox ERC-7984

`PropertyToken` is an ERC-7984 confidential token. Its encrypted balance covers all 5 required utility types:

| Utility | Implementation | Contract |
|---------|---------------|----------|
| **Private Payments** | `purchaseTokens(handle, handleProof, clearAmount)` — amount encrypted via Intel TDX TEE before reaching the chain | `PropertyToken.sol` |
| **Private Transfers** | `SecondaryMarket.executeBuy(listingId, handle, handleProof)` — amount sealed by TEE, imported via `Nox.fromExternal()` | `SecondaryMarket.sol` |
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

## Privacy Architecture — iExec TEE Flow

Raw token amounts **never touch the blockchain**. Every buy goes through Intel TDX TEE:

```
Frontend
   │
   ▼  POST /api/iexec-buy  { tokenAmount, contractAddress, buyerAddress }
   │
Server (Next.js API route)
   │  iExec SDK: fetchAppOrderbook → fetchWorkerpoolOrderbook
   │             → createRequestorder → matchOrders → computeTaskId
   │  Returns: { taskid, dealid }
   │
   ▼  Frontend polls GET /api/iexec-poll?taskid=...  every 5s
   │
iExec Network (Intel TDX TEE Worker)
   │  iApp (Docker, TDX-attested) receives: tokenAmount contractHex buyerHex
   │  → POST Nox Gateway: { value: uint256Hex, solidityType, applicationContract, owner }
   │  ← Nox Gateway returns: { handle: bytes32, handleProof: bytes }
   │  iApp writes result.json → uploaded to IPFS
   │
   ▼  /api/iexec-poll downloads ZIP → parses result.json → returns { handle, handleProof }
   │
Frontend
   │  1. USDT.approve(contractAddress, totalCost)
   │  2. purchaseTokens(handle, handleProof, clearAmount)
   │     └─ Nox.fromExternal(handle, handleProof) → euint256 balance (encrypted)
   ▼
Arbitrum Sepolia — only encrypted handle ever on-chain
```

### Why iExec + Nox?

- **Nox gateway** only accepts requests from verified TEE enclaves — raw amounts cannot be faked
- **`Nox.fromExternal(handle, handleProof)`** on-chain verifies the proof came from a real TDX enclave
- **`Nox.toEuint256()`** (the insecure alternative) is intentionally NOT used — it would bypass TEE verification

---

## On-Chain Transaction Flows

### Primary Market Buy (`/properties/[id]`)
```
1. POST /api/iexec-buy → iExec TEE task submitted
   Frontend polls /api/iexec-poll every 5s until:
   ← { handle: bytes32, handleProof: bytes }  (sealed inside Intel TDX)

2. USDT.approve(propertyContract, tokenAmount × 1_000_000)

3. propertyToken.purchaseTokens(handle, handleProof, clearAmount)
   └─ balance stored as euint256 (encrypted via Nox.fromExternal)
```

### Secondary Market Sell (`/market`)
> Listing amount is intentionally public — price discovery requires it.
> Seller's own balance was already encrypted at purchase time.
```
1. propertyToken.grantOperator(secondaryMarket, expiry)  ← 7-day window

2. secondaryMarket.createListing(tokenContract, propertyId, tokenAmount, pricePerToken)
   → pricePerToken in USDT 6 decimals (e.g. $1.025 = 1_025_000)
   → returns listingId
```

### Secondary Market Buy (`/market`)
```
1. POST /api/iexec-buy → iExec TEE task for listing's tokenAmount
   Frontend polls /api/iexec-poll every 5s until:
   ← { handle: bytes32, handleProof: bytes }

2. USDT.approve(secondaryMarket, listingTokenAmount × pricePerToken)

3. secondaryMarket.executeBuy(listingId, handle, handleProof)
   └─ Nox.fromExternal(handle, handleProof) → confidentialTransferFrom (encrypted)
```

---

## iApp — Intel TDX TEE Application

Deployed on iExec network (arbitrum-sepolia-testnet):

| | |
|---|---|
| **iApp Address** | `0xB11bC7288eE239F6536829E410d22Eb514C5E282` |
| **Docker Image** | `jancok075/iexec:0.0.1-tdx-1f1d5e8f915a` |
| **Chain** | arbitrum-sepolia-testnet (421614) |
| **Tag** | `tee,tdx` (Intel TDX enclave) |
| **Nox Gateway** | `https://2e1800fc...noxprotocol.dev` |

The iApp receives `tokenAmount contractAddress buyerAddress` as args, calls the Nox gateway from inside the enclave, and writes `{ handle, handleProof, tokenAmount, contractAddress, buyerAddress }` to `result.json`.

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

> All contracts live on chainId 421614.

### Core Contracts
| Contract | Address |
|----------|---------|
| CESTToken | [`0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D`](https://sepolia.arbiscan.io/address/0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D) |
| PropertyRegistry | [`0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e`](https://sepolia.arbiscan.io/address/0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e) |
| RentDistributor | [`0x80E0e5f6488FA2726c042a204344281974f72609`](https://sepolia.arbiscan.io/address/0x80E0e5f6488FA2726c042a204344281974f72609) |
| SecondaryMarket | [`0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa`](https://sepolia.arbiscan.io/address/0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa) |
| ConfidentialGovernance | [`0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14`](https://sepolia.arbiscan.io/address/0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14) |
| MockUSDT (testnet) | [`0x9a822B9A50D090CfcCa1e6474efCd653112d8501`](https://sepolia.arbiscan.io/address/0x9a822B9A50D090CfcCa1e6474efCd653112d8501) |

### Property Tokens (ERC-7984) — All 5 Live on Arbitrum Sepolia
| Property | Ticker | Supply | Contract |
|----------|--------|--------|----------|
| The Pearl Residences, Dubai | PEARL-DXB-001 | 500,000 | [`0x853D51fB...`](https://sepolia.arbiscan.io/address/0x853D51fBD5E288BF189FE0126d59f855c821a641) |
| Shibuya Terrace, Tokyo | SHIBUYA-TYO-001 | 380,000 | [`0x457d78AD...`](https://sepolia.arbiscan.io/address/0x457d78AD2912923897B93fD82d502aD0B34E54eA) |
| Marina Heights, Singapore | MARINA-SGP-001 | 620,000 | [`0x57D15966...`](https://sepolia.arbiscan.io/address/0x57D15966CD4203cC8FbC1fd6763Be935d27D1178) |
| Canary Wharf Executive, London | CANARY-LON-001 | 850,000 | [`0x7fB7e724...`](https://sepolia.arbiscan.io/address/0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23) |
| Azure Barcelona Suite | AZURE-BCN-001 | 290,000 | [`0xA3dDfe78...`](https://sepolia.arbiscan.io/address/0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | Arbitrum Sepolia (chainId 421614) |
| Privacy | iExec Nox Protocol — ERC-7984 Confidential Tokens |
| TEE | Intel TDX via iExec network (iApp: `0xB11bC7...`) |
| Smart Contracts | Solidity 0.8.28, Hardhat 2.28, TypeScript |
| Frontend | Next.js 14 App Router, Tailwind CSS, Framer Motion |
| Web3 | Wagmi v2, Viem |
| iExec SDK | `iexec` npm package — order matching, task polling, result fetch |
| AI | ChainGPT SDK (`@chaingpt/generalchat`) |
| Deployment | Vercel (frontend) + iExec network (TEE worker) |

---

## Quick Start

```bash
git clone https://github.com/ntfound-dev/ChainEstate-
cd ChainEstate
npm install
cp .env.example .env.local  # fill PRIVATE_KEY, RPC, IEXEC_IAPP_ADDRESS
npm run dev
# Open http://localhost:3000
```

Get testnet tokens at `/faucet` (wallet required):
- **1,000 USDT** — buy property tokens
- **2,400 CEST** (~$96) — governance + staking

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key — signs iExec request orders |
| `IEXEC_IAPP_ADDRESS` | `0xB11bC7288eE239F6536829E410d22Eb514C5E282` |
| `ARBITRUM_SEPOLIA_RPC` | Server-side RPC (PublicNode or Infura) |
| `NEXT_PUBLIC_RPC_URL` | Client-side RPC for reads and MetaMask injection |
| `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC` | Fallback client RPC |

### Run Tests
```bash
npm run test   # 73 passing
```

---

## NFT Metadata

Each property exposes ERC-721 metadata (OpenSea standard):
```
GET /api/nft/pearl-dxb-001
GET /api/nft/azure-bcn-001
...
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

- 🌐 [Live App](https://chain-estate-rouge.vercel.app)
- 🔬 [iExec Nox Docs](https://docs.iex.ec/nox-protocol/getting-started/welcome)
- 📊 [Arbiscan — Arbitrum Sepolia](https://sepolia.arbiscan.io)
- 🤖 [ChainGPT Platform](https://chaingpt.org)

---

<div align="center">

*Built for ChainGPT × iExec Nox Hackathon | Chain: Arbitrum Sepolia | 2026*

</div>
