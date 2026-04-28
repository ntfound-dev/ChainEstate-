# ChainEstate — Smart Contracts

> Fractional real estate tokenization platform built on Arbitrum Sepolia using iExec Nox Protocol (ERC-7984 Confidential Tokens). Investor balances and transfer amounts are encrypted via Intel TDX TEE — no one can infer how much any wallet holds.

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
│   └── ChainEstateLib.sol        ← Shared structs, enums, custom errors, constants
├── interfaces/
│   ├── IPropertyToken.sol
│   ├── IPropertyRegistry.sol
│   ├── IRentDistributor.sol
│   ├── ISecondaryMarket.sol
│   └── ICESTToken.sol
├── core/
│   ├── PropertyToken.sol         ← ERC-7984 confidential token per property (CREATE2)
│   ├── PropertyRegistry.sol      ← Registry + factory for PropertyToken
│   └── RentDistributor.sol       ← Private rent distribution (5%/5%/90%)
├── tokens/
│   └── CESTToken.sol             ← ERC20Votes governance + tiered staking
├── market/
│   └── SecondaryMarket.sol       ← DEX with CEST fee discounts
└── mocks/
    ├── MockERC20.sol             ← Test USDT
    └── MockNoxCompute.sol        ← Local NoxCompute mock for Hardhat tests
```

---

## Contracts Overview

### `ChainEstateLib.sol`
Shared library imported by all contracts. Defines:
- `Property` struct — all property metadata
- `RentDistribution` struct — distribution records
- `PropertyStatus` enum — PENDING / ACTIVE / SOLD_OUT / DISTRIBUTING / INACTIVE
- Custom errors: `Unauthorized`, `PropertyNotFound`, `InvalidAmount`, etc.
- Constants: `PLATFORM_FEE_BPS=500`, `MAINTENANCE_FEE_BPS=500`, `INVESTOR_SHARE_BPS=9000`

---

### `PropertyToken.sol` ⭐ Core Contract
One instance deployed per property via CREATE2 from PropertyRegistry.

**Inherits:** `ERC7984` (iExec Nox) + `Ownable` + `Pausable` + `ReentrancyGuard`

Key behaviors:
- Balances stored as `euint256` — encrypted, only readable by the holder via iExec Handle Gateway
- `purchaseTokens(handle, proof, clearAmount)` — pay USDT, receive encrypted tokens
- Transfer never reverts on insufficient balance (ERC-7984 spec — prevents balance inference)
- `grantOperator(operator, expiry)` — delegate transfer rights to SecondaryMarket / RentDistributor
- Events intentionally **do not emit amounts** for privacy

```solidity
// Salt for CREATE2 = bytes32(propertyId) → deterministic addresses
PropertyToken token = new PropertyToken{salt: bytes32(propertyId)}();
```

---

### `PropertyRegistry.sol`
Central registry. Admin lists properties, which deploys a new PropertyToken via CREATE2.

Key functions:
- `listProperty(...)` → deploys PropertyToken, returns `(propertyId, tokenContract)`
- `registerHolder(propertyId, holder)` — called by PropertyToken on purchase, or by approved markets
- `setApprovedMarket(market, true)` — whitelist SecondaryMarket to register buyers as holders
- `getActiveProperties()` / `getPropertyHolders(id)` — used by frontend and RentDistributor

---

### `RentDistributor.sol`
Receives monthly rent from admin, distributes to all holders.

Fee breakdown (per distribution):
| Recipient | Percentage |
|-----------|-----------|
| Treasury (platform fee) | 5% |
| Maintenance reserve | 5% |
| Holders (equal share) | 90% |

> ⚠️ Hackathon simplification: Equal share per holder (not pro-rata by token balance), because ERC-7984 encrypted balances cannot be read on-chain for proportional calculation.

---

### `CESTToken.sol`
Governance and utility token. 1 Billion CEST total supply.

Token allocation:
| Category | Amount | % |
|----------|--------|---|
| Ecosystem | 300M | 30% |
| Airdrop | 250M | 25% |
| Investor | 200M | 20% |
| Team | 150M | 15% |
| Reserve | 100M | 10% |

Staking tiers (locked stake):
| Tier | CEST Required | Fee Discount |
|------|--------------|--------------|
| BRONZE | 1,000 | 10% |
| SILVER | 10,000 | 30% |
| GOLD | 50,000 | 50% |
| PLATINUM | 200,000 | 100% (free) |

---

### `SecondaryMarket.sol`
Order-book DEX for P2P property token trading.

- Sellers create listings with public token amount and price
- Trading fee: **0.5%** (reduced by CEST staking discount)
- PLATINUM holders trade for free
- Seller must `grantOperator(marketAddress, expiry)` on their PropertyToken before listing

---

## Setup

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env
# → Fill in PRIVATE_KEY, ARBITRUM_SEPOLIA_RPC, USDT_ADDRESS, TREASURY_ADDRESS, ARBISCAN_API_KEY
```

---

## Commands

```bash
# Compile all contracts
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat compile

# Run test suite (60 tests)
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat test

# Deploy to Arbitrum Sepolia
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run scripts/deploy.ts --network arbitrumSepolia

# Verify on Arbiscan
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run scripts/verify.ts --network arbitrumSepolia

# Seed demo data
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run scripts/seed.ts --network arbitrumSepolia
```

Or via npm scripts:
```bash
npm run compile
npm run test
npm run deploy:testnet
npm run verify:testnet
npm run seed:testnet
```

---

## Deployment Order

The deploy script handles this automatically:

1. `CESTToken` — no dependencies
2. `PropertyRegistry(usdtAddress)` — no dependencies
3. `RentDistributor(registry, usdt, treasury)` — needs registry
4. `SecondaryMarket(cest, usdt, treasury, registry)` — needs registry + cest
5. Wire: `registry.setRentDistributor(rentDistributor)`
6. Wire: `registry.setApprovedMarket(secondaryMarket, true)`
7. Seed demo property: "The Pearl Residences, Dubai"

Deployed addresses are saved to `deployments.json`.

---

## Test Results

```
60 passing (21s)

  CESTToken (12 tests)
  PropertyRegistry (12 tests)
  PropertyToken (11 tests)
  RentDistributor (11 tests)
  SecondaryMarket (14 tests)
```

---

## Security

- `nonReentrant` on all state-changing functions
- `Pausable` emergency brake on all core contracts
- `onlyOwner` access control on admin functions
- ERC-7984 all-or-nothing transfer (no revert on insufficient balance — by design)
- Custom errors instead of require strings (gas efficient)
- CREATE2 for deterministic PropertyToken addresses
- Events never emit encrypted amounts (privacy preserving)

---

## iExec Nox Resources

| Resource | URL |
|----------|-----|
| Documentation | https://docs.iex.ec/nox-protocol/getting-started/welcome |
| ERC-7984 Guide | https://docs.iex.ec/nox-protocol/guides/build-confidential-tokens/erc7984-token |
| Live Demo | https://cdefi.iex.ec/ |
| NPM Packages | https://www.npmjs.com/org/iexec-nox |

---

*Chain: Arbitrum Sepolia | Protocol: iExec Nox ERC-7984 | Hackathon: ChainGPT × iExec*
