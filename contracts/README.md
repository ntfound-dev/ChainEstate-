# ChainEstate — Smart Contracts

> Fractional real estate tokenization on Arbitrum Sepolia using iExec Nox Protocol (ERC-7984 Confidential Tokens). Investor balances and transfer amounts are encrypted via Intel TDX TEE — no observer can infer how much any wallet holds.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | Arbitrum Sepolia (chainId: 421614) |
| Privacy | iExec Nox Protocol — ERC-7984 Confidential Tokens |
| Language | Solidity ^0.8.28 |
| Framework | Hardhat 2.28 + TypeScript |
| Testing | Chai + Hardhat Network Helpers |
| EVM | Cancun (required for OpenZeppelin v5 `mcopy`) |

---

## Contract Architecture

```
contracts/
├── libraries/
│   └── ChainEstateLib.sol          ← Shared structs, enums, custom errors, constants
├── interfaces/
│   ├── IPropertyToken.sol
│   ├── IPropertyRegistry.sol
│   ├── IRentDistributor.sol
│   ├── ISecondaryMarket.sol
│   └── ICESTToken.sol
├── core/
│   ├── PropertyToken.sol           ← ERC-7984 confidential token per property (CREATE2)
│   ├── PropertyRegistry.sol        ← Registry + CREATE2 factory
│   └── RentDistributor.sol         ← Private rent distribution (5%/5%/90%)
├── tokens/
│   └── CESTToken.sol               ← ERC20Votes governance + tiered staking (1B supply)
├── market/
│   └── SecondaryMarket.sol         ← P2P DEX with CEST fee discounts
├── governance/
│   └── ConfidentialGovernance.sol  ← Token-gated proposal + voting
└── mocks/
    ├── MockERC20.sol               ← Testnet USDT
    └── MockNoxCompute.sol          ← Local NoxCompute mock for Hardhat tests
```

---

## Contracts Overview

### `ChainEstateLib.sol`
Shared library imported by all contracts. Defines:
- `Property` struct — all property metadata (id, name, location, supply, pricePerToken, etc.)
- `RentDistribution` struct — distribution records
- `PropertyStatus` enum — `PENDING / ACTIVE / SOLD_OUT / DISTRIBUTING / INACTIVE`
- Custom errors: `Unauthorized`, `PropertyNotFound`, `InvalidAmount`, `ZeroAddress`, etc.
- Constants: `PLATFORM_FEE_BPS=500`, `MAINTENANCE_FEE_BPS=500`, `INVESTOR_SHARE_BPS=9000`

---

### `PropertyToken.sol` ⭐ Core Contract

One instance deployed per property via CREATE2 from `PropertyRegistry`. Salt = `bytes32(propertyId)`.

**Inherits:** `ERC7984` (iExec Nox) + `Ownable` + `Pausable` + `ReentrancyGuard`

Key behaviors:
- Balances stored as `euint256` — encrypted, readable only by the holder via iExec Handle Gateway
- `purchaseTokens(handle, handleProof, clearAmount)` — pay USDT, receive encrypted tokens
- Transfers never revert on insufficient balance (ERC-7984 spec — prevents balance inference)
- `grantOperator(operator, expiry)` — delegate transfer rights to SecondaryMarket for listings
- Events intentionally **do not emit amounts** — privacy by design

```solidity
// On-chain signature (ABI):
function purchaseTokens(bytes32 handle, bytes handleProof, uint256 clearAmount) external
function grantOperator(address operator, uint256 expiry) external
```

**Price:** `pricePerToken` stored in USDT 6 decimals. All 5 deployed properties: `1_000_000` = $1.00 USDT.

---

### `PropertyRegistry.sol`

Central registry and CREATE2 factory. Only owner (platform admin) can list properties.

Key functions:
- `listProperty(name, location, ipfsDocHash, totalSupply, pricePerToken, monthlyRent)` → deploys PropertyToken
- `registerHolder(propertyId, holder)` — called by PropertyToken on purchase, or by approved markets
- `setApprovedMarket(market, true)` — whitelist SecondaryMarket to register buyers as holders
- `getPropertyHolders(id)` — used by RentDistributor

**On-chain state (Arbitrum Sepolia):**
- `propertyCount = 5` (all 5 properties listed and active)
- `owner = 0x834De729cb9dF77451DBc6bf7FD05F475B011Ac7` (treasury/deployer)

---

### `RentDistributor.sol`

Receives monthly USDT rent from admin, distributes to all registered holders.

Fee breakdown per distribution:
| Recipient | Percentage |
|-----------|-----------|
| Treasury (platform fee) | 5% |
| Maintenance reserve | 5% |
| Holders (equal share) | 90% |

> Hackathon simplification: Equal share per holder (not pro-rata by balance), because ERC-7984 `euint256` balances cannot be read on-chain for proportional calculation.

---

### `CESTToken.sol`

Governance and utility token. 1 Billion CEST total supply.

**Price: $0.04 USD → Market Cap: $40,000,000**

Token allocation:
| Category | Amount | % |
|----------|--------|---|
| Ecosystem | 300M CEST | 30% |
| Airdrop | 250M CEST | 25% |
| Investor | 200M CEST | 20% |
| Team | 150M CEST | 15% |
| Reserve | 100M CEST | 10% |

Genesis Airdrop: 250M CEST ($10M pool) distributed to community via task completion.
Faucet: 2,400 CEST (~$96) per address per 24h on testnet.

Staking tiers (time-locked):
| Tier | CEST Required | USD Value | Fee Discount |
|------|--------------|-----------|--------------|
| NONE | — | — | 0% |
| BRONZE | 1,000 | $40 | −10% |
| SILVER | 10,000 | $400 | −30% |
| GOLD | 50,000 | $2,000 | −50% |
| PLATINUM | 200,000 | $8,000 | −100% (free) |

**Contract:** `0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D`

---

### `SecondaryMarket.sol`

Order-book DEX for P2P property token trading. All token movements are encrypted.

Full sell flow:
1. Seller calls `propertyToken.grantOperator(secondaryMarket, expiry)` — 7-day window
2. Seller calls `secondaryMarket.createListing(tokenContract, propertyId, tokenAmount, pricePerToken)`
   - `pricePerToken` is in USDT 6 decimals (e.g. $1.025 = `1_025_000`)
   - Returns `listingId`

Full buy flow:
1. Buyer calls `usdt.approve(secondaryMarket, totalCost)`
2. Buyer calls `secondaryMarket.executeBuy(listingId)`
   - Triggers `confidentialTransferFrom` (encrypted amount, seller → buyer)
   - USDT transferred from buyer to seller minus fee

Trading fee: **0.5%** (reduced by CEST staking discount, free for PLATINUM)

---

### `ConfidentialGovernance.sol`

Token-gated proposal and voting system for property management.

- Only verified `PropertyToken` holders can create proposals or vote
- Access gate: `registry.isHolder(propertyId, msg.sender)` — no balance amount exposed
- Proposals: rent adjustments, maintenance approvals, property status changes
- 1 address = 1 vote (balance-blind — no whale advantage visible on-chain)

---

## Deployed Addresses — Arbitrum Sepolia

### Core Contracts
| Contract | Address |
|----------|---------|
| CESTToken | `0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D` |
| PropertyRegistry | `0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e` |
| RentDistributor | `0x80E0e5f6488FA2726c042a204344281974f72609` |
| SecondaryMarket | `0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa` |
| ConfidentialGovernance | `0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14` |
| MockUSDT | `0x9a822B9A50D090CfcCa1e6474efCd653112d8501` |
| Treasury | `0x834De729cb9dF77451DBc6bf7FD05F475B011Ac7` |

### Property Tokens (ERC-7984) — All 5 Active
| Property | Ticker | Supply | Contract |
|----------|--------|--------|----------|
| The Pearl Residences, Dubai | PEARL-DXB-001 | 500,000 | `0x853D51fBD5E288BF189FE0126d59f855c821a641` |
| Shibuya Terrace, Tokyo | SHIBUYA-TYO-001 | 380,000 | `0x457d78AD2912923897B93fD82d502aD0B34E54eA` |
| Marina Heights, Singapore | MARINA-SGP-001 | 620,000 | `0x57D15966CD4203cC8FbC1fd6763Be935d27D1178` |
| Canary Wharf Executive, London | CANARY-LON-001 | 850,000 | `0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23` |
| Azure Barcelona Suite | AZURE-BCN-001 | 290,000 | `0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe` |

Verified on-chain: `propertyCount = 5`, all status `ACTIVE`, all `pricePerToken = 1_000_000`.

---

## Setup

```bash
npm install
cp .env.example .env
# Fill in: PRIVATE_KEY, ARBITRUM_SEPOLIA_RPC, USDT_ADDRESS, TREASURY_ADDRESS, ARBISCAN_API_KEY
```

---

## Commands

```bash
# Compile all contracts
npm run compile

# Run test suite (60 tests across 5 suites)
npm run test

# Deploy to Arbitrum Sepolia
npm run deploy:testnet

# List all 5 properties on PropertyRegistry
npx hardhat run scripts/list-properties.ts --network arbitrumSepolia

# Verify on Arbiscan
npm run verify:testnet

# Seed demo data
npm run seed:testnet
```

Or with TS prefix:
```bash
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat compile
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat test
```

---

## Deployment Order

The deploy script handles this automatically:

1. `MockERC20` (testnet USDT) — if not provided
2. `CESTToken` — no dependencies
3. `PropertyRegistry(usdtAddress)` — no dependencies
4. `RentDistributor(registry, usdt, treasury)` — needs registry
5. `SecondaryMarket(cest, usdt, treasury, registry)` — needs registry + cest
6. `ConfidentialGovernance(registry)` — needs registry
7. Wire: `registry.setRentDistributor(rentDistributor)`
8. Wire: `registry.setApprovedMarket(secondaryMarket, true)`
9. List properties: run `scripts/list-properties.ts` (Pearl listed in deploy; 4 others via script)

Addresses saved to `deployments.json`.

---

## Test Results

```
60 passing

  CESTToken           — 12 tests
  PropertyRegistry    — 12 tests
  PropertyToken       — 11 tests
  RentDistributor     — 11 tests
  SecondaryMarket     — 14 tests
```

---

## Security

- `nonReentrant` on all state-changing functions
- `Pausable` emergency brake on all core contracts
- `onlyOwner` access control on admin functions
- ERC-7984 all-or-nothing transfer (no revert on insufficient balance — by design, prevents inference)
- Custom errors instead of `require` strings (gas efficient)
- CREATE2 for deterministic `PropertyToken` addresses
- Events never emit encrypted amounts — privacy preserving

---

## iExec Nox Resources

| Resource | URL |
|----------|-----|
| Documentation | https://docs.iex.ec/nox-protocol/getting-started/welcome |
| ERC-7984 Guide | https://docs.iex.ec/nox-protocol/guides/build-confidential-tokens/erc7984-token |
| Live Demo | https://cdefi.iex.ec/ |
| NPM Packages | https://www.npmjs.com/org/iexec-nox |

---

*Chain: Arbitrum Sepolia | Protocol: iExec Nox ERC-7984 | Hackathon: ChainGPT × iExec | 2026*
