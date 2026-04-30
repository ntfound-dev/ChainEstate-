// Full ChainEstate knowledge base injected into every ChainGPT API call.
// Update this file whenever product details, prices, or contracts change.

export const CHAINESTATE_CONTEXT = `
CHAINESTATE — COMPLETE DeFi PRODUCT KNOWLEDGE BASE
====================================================

## What is ChainEstate?
ChainEstate is a DeFi platform on Arbitrum Sepolia for tokenized Real World Assets (RWA). Users can buy ERC-7984 confidential tokens backed by premium global real estate, earning on-chain USDT yield (APY). Token balances are fully encrypted using iExec Nox — no one on-chain can see your holdings. Built for the ChainGPT × iExec Nox hackathon, 2026.

Key concepts:
- "Property" = a tokenized RWA asset on Arbitrum Sepolia
- "Property tokens" = ERC-7984 DeFi tokens with encrypted balances
- "Yield / APY" = monthly USDT rent income distributed on-chain to token holders
- "Buying tokens" = on-chain USDT transaction calling purchaseTokens() on a smart contract
- "Secondary market" = P2P token trading via SecondaryMarket.sol

Live app: https://chain-estate-rouge.vercel.app
Chain: Arbitrum Sepolia (chainId 421614)

---

## THE 5 RWA TOKEN ASSETS (all live on Arbitrum Sepolia)

### 1. The Pearl Residences — PEARL-DXB-001
- Location: Jumeirah, Dubai, UAE
- Total Valuation: $500,000
- Token Supply: 500,000 PEARL-DXB-001 tokens
- Price per Token: $1.00 USDT
- APY / Yield: 6.8%
- Funded: 78% (110,000 tokens still available)
- Status: ACTIVE — can be bought
- Token Standard: ERC-7984 (confidential, encrypted balance)
- Contract: 0x853D51fBD5E288BF189FE0126d59f855c821a641
- Token ID: 1
- Description: Luxury waterfront apartment in Dubai Marina. Stable rental income from short-term corporate tenants. Built 2022, premium fixtures, direct marina access.

### 2. Shibuya Terrace — SHIBUYA-TYO-001
- Location: Shibuya, Tokyo, Japan
- Total Valuation: $380,000
- Token Supply: 380,000 SHIBUYA-TYO-001 tokens
- Price per Token: $1.00 USDT
- APY / Yield: 5.9%
- Funded: 75% (95,000 tokens available)
- Status: ACTIVE — can be bought
- Token Standard: ERC-7984
- Contract: 0x457d78AD2912923897B93fD82d502aD0B34E54eA
- Token ID: 2
- Description: Premium residential terrace in Shibuya. High demand from international business travelers, occupancy consistently above 90%.

### 3. Marina Heights — MARINA-SGP-001
- Location: Marina Bay, Singapore
- Total Valuation: $620,000
- Token Supply: 620,000 MARINA-SGP-001 tokens
- Price per Token: $1.00 USDT
- APY / Yield: 7.2%
- Funded: 100% (SOLD OUT — all tokens sold)
- Status: SOLD OUT — only available via secondary market
- Token Standard: ERC-7984
- Contract: 0x57D15966CD4203cC8FbC1fd6763Be935d27D1178
- Token ID: 3
- Description: Iconic high-rise with panoramic views of Marina Bay Sands. Institutional tenants, part of an established luxury rental portfolio.

### 4. Canary Wharf Executive — CANARY-LON-001
- Location: Canary Wharf, London, UK
- Total Valuation: $850,000
- Token Supply: 850,000 CANARY-LON-001 tokens
- Price per Token: $1.00 USDT
- APY / Yield: 5.4%
- Funded: 60% (340,000 tokens available)
- Status: ACTIVE — can be bought
- Token Standard: ERC-7984
- Contract: 0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23
- Token ID: 4
- Description: Executive apartment in London's premier financial district. Long-term corporate tenant contracts provide predictable, stable income.

### 5. Azure Barcelona Suite — AZURE-BCN-001
- Location: Eixample, Barcelona, Spain
- Total Valuation: $290,000
- Token Supply: 290,000 AZURE-BCN-001 tokens
- Price per Token: $1.00 USDT
- APY / Yield: 8.1% (highest yield on platform)
- Funded: 50% (145,000 tokens available)
- Status: ACTIVE — can be bought
- Token Standard: ERC-7984
- Contract: 0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe
- Token ID: 5
- Description: Stunning modernist apartment with original Eixample architecture. Exceptional yield from short-term luxury rentals.

---

## CEST TOKEN (Governance & Utility)

- Name: ChainEstate Token (CEST)
- Price: $0.04 USD per CEST
- Total Supply: 1,000,000,000 (1 billion)
- Market Cap: $40,000,000
- Genesis Airdrop Pool: 250,000,000 CEST ($10M) — claim at /airdrop
- Standard: ERC20Votes (governance-enabled)
- Contract: 0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D
- Trading: Uniswap DEX (not on SecondaryMarket.sol — it's a governance token, not a property token)
- Chain: Arbitrum Sepolia

### CEST Staking Tiers (trading fee discounts):
| Tier     | CEST Required | USD Value | Secondary Market Fee |
|----------|--------------|-----------|----------------------|
| NONE     | 0            | $0        | 0.5% (standard)      |
| BRONZE   | 1,000        | $40       | 0.45% (−10%)         |
| SILVER   | 10,000       | $400      | 0.35% (−30%)         |
| GOLD     | 50,000       | $2,000    | 0.25% (−50%)         |
| PLATINUM | 200,000      | $8,000    | 0% FREE trading      |

Stake CEST to get cheaper trades. PLATINUM holders trade completely free.

---

## SMART CONTRACT ADDRESSES (Arbitrum Sepolia)

| Contract             | Address                                    |
|----------------------|--------------------------------------------|
| PropertyRegistry     | 0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e |
| SecondaryMarket      | 0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa |
| RentDistributor      | 0x80E0e5f6488FA2726c042a204344281974f72609 |
| CEST Token           | 0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D |
| Mock USDT (testnet)  | 0x9a822B9A50D090CfcCa1e6474efCd653112d8501 |
| ConfidentialGov.     | 0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14 |

All 5 PropertyToken contracts are separate — each property has its own ERC-7984 token contract (see property list above).

---

## HOW BUYING WORKS (Primary Market)

When you buy a property token from the primary market (/properties/[id]):

1. **iExec TEE encryption** — Our server submits a task to the iExec network. Inside an Intel TDX Trusted Execution Environment (TEE), an iApp contacts the Nox gateway and seals your token amount as an encrypted handle. This happens BEFORE any blockchain transaction. The raw token amount NEVER touches the blockchain.

2. **USDT Approval** — You approve the property contract to spend your USDT (tokenAmount × $1.00 = total cost).

3. **purchaseTokens()** — You call purchaseTokens(handle, handleProof, clearAmount) on the PropertyToken contract. The contract calls Nox.fromExternal(handle, handleProof) to import the encrypted handle as a euint256 balance. Your balance is now encrypted on-chain.

Why iExec + Intel TDX? The Nox gateway only accepts requests from verified TDX enclaves — it cannot be faked. Nox.fromExternal() verifies the proof came from a real TEE before minting your encrypted balance.

---

## HOW SELLING WORKS (Secondary Market)

To list your property tokens for sale (/market → Sell):

1. **Grant Operator** — Call grantOperator(SecondaryMarket, expiry) on your PropertyToken. This gives SecondaryMarket permission to transfer your tokens for 7 days.

2. **Create Listing** — Call createListing(tokenContract, propertyId, tokenAmount, pricePerToken) on SecondaryMarket.sol. Your tokens appear as a public listing. Note: the listing amount IS public (required for price discovery). Only your total balance remains encrypted.

---

## HOW BUYING WORKS (Secondary Market)

To buy a listed token from another user (/market → Buy):

1. **iExec TEE** — Same TEE flow as primary market. The listing's exact tokenAmount gets encrypted into a handle inside the Intel TDX enclave.

2. **USDT Approval** — Approve SecondaryMarket to spend listingTokenAmount × pricePerToken USDT.

3. **executeBuy()** — Call executeBuy(listingId, handle, handleProof). The contract calls Nox.fromExternal() to import the handle and does a confidentialTransferFrom — moving encrypted tokens from seller to buyer.

---

## RENT DISTRIBUTION

Monthly USDT rent is distributed to all property token holders via RentDistributor.sol:
- Rent totals are auditable on-chain
- Per-investor amounts are NEVER revealed (privacy by design)
- USDT is distributed proportionally to all registered holders
- Platform takes 5% + 5% maintenance from gross rent
- Holders keep 90%

---

## FEE STRUCTURE

| Action                  | Fee                         |
|-------------------------|-----------------------------|
| Primary token purchase  | 0% (no platform fee)        |
| Secondary market trade  | 0.5% (reducible with CEST)  |
| Rent distribution       | 10% total (5% platform + 5% maintenance) |

---

## AIRDROP

250 million CEST ($10M worth at $0.04) is available in the genesis airdrop.
- Page: /airdrop
- Tasks: follow on Twitter, join Discord, make your first purchase, etc.
- Each completed task earns CEST allocation
- Wallet connection required

---

## FAUCET (Testnet)

Get free testnet tokens at /faucet:
- 1,000 USDT — use to buy property tokens
- 2,400 CEST (~$96) — use for governance and staking
- One request per wallet address
- Works on Arbitrum Sepolia only

---

## APP PAGES

| Page         | URL              | What it does |
|--------------|------------------|--------------|
| Home         | /                | Hero, features overview |
| Properties   | /properties      | Browse all 5 tokenized properties |
| Property Detail | /properties/[id] | Buy tokens, view docs, check yield |
| Market       | /market          | Secondary market — buy/sell P2P |
| Dashboard    | /dashboard       | View your portfolio (wallet required) |
| Airdrop      | /airdrop         | Claim CEST from genesis pool |
| Faucet       | /faucet          | Get testnet USDT + CEST |
| Docs         | /docs            | Documentation index |
| Docs: Business Model | /docs/business-model | Revenue model, market opportunity |
| Docs: Problem & Solution | /docs/problem-solution | Why ChainEstate exists |
| Docs: Contracts | /docs/contracts | Smart contract reference |
| Docs: SDK    | /docs/sdk        | Developer integration guide |
| Docs: Roadmap | /docs/roadmap   | Phase 0 (now) through Phase 4 |

---

## PRIVACY ARCHITECTURE (iExec Nox ERC-7984)

ChainEstate uses ERC-7984 confidential tokens powered by iExec Nox:

- **euint256** — balances stored as fully encrypted uint256. No observer can read them.
- **Intel TDX** — our iApp runs inside a hardware-attested Trusted Execution Environment. The Nox gateway (accessible only from verified TDX enclaves) creates the encrypted handle.
- **Nox.fromExternal(handle, handleProof)** — on-chain function that verifies the TEE attestation and imports the encrypted value as a euint256 balance.
- **Nox.toEuint256()** is intentionally NOT used — that would bypass TEE verification and allow raw amounts to be faked.
- **Events do not emit amounts** — ERC-7984 events never reveal token quantities. Even the blockchain explorer can't tell how much you own.
- **Transfer reverts are suppressed** — insufficient balance causes a silent no-op, not a revert (to prevent balance inference from gas costs).

iApp deployed on iExec network:
- Address: 0xB11bC7288eE239F6536829E410d22Eb514C5E282
- Docker image: jancok075/iexec:0.0.1-tdx-1f1d5e8f915a
- Tag: tee,tdx (Intel TDX enclave)

---

## MARKET OPPORTUNITY

- Global real estate: $326 trillion total market
- Tokenizable TAM: ~$16 trillion (5% addressable in 5 years)
- RWA market today: $12 billion on-chain
- RWA projected 2030: $16 trillion (Boston Consulting Group)

ChainEstate targets high-yield residential: Dubai (6.8%), Singapore (7.2%), Barcelona (8.1%), London (5.4%), Tokyo (5.9%).

---

## ROADMAP

**Phase 0 — Q1 2026 (CURRENT)**: Hackathon + Testnet
- All 5 property contracts live on Arbitrum Sepolia ✅
- Full iExec TEE buy flow working ✅
- Secondary market (list + buy) working ✅
- Genesis airdrop + faucet live ✅
- ChainGPT AI assistant ✅

**Phase 1 — Q2 2026**: Mainnet Launch
- Deploy to Arbitrum One mainnet
- Third-party security audit
- List first 3 real-world properties with legal SPV
- CEST airdrop claim opens June 1, 2026
- Uniswap V3 CEST/USDT liquidity pool

**Phase 2 — Q3 2026**: Scale
- 20+ properties across 10+ cities
- Mobile app (React Native)
- DAO governance activation (CEST votes)

**Phase 3 — Q4 2026**: Global
- KYC-optional institutional tier
- Cross-chain (Base, Polygon)
- Fiat on-ramp integration

---

## TECH STACK

- Blockchain: Arbitrum Sepolia (Arbitrum One for mainnet)
- Privacy: iExec Nox Protocol — ERC-7984 Confidential Tokens
- TEE: Intel TDX via iExec network
- Smart Contracts: Solidity 0.8.28, Hardhat
- Frontend: Next.js 14 App Router, Tailwind CSS, Framer Motion
- Web3: Viem (direct window.ethereum calls)
- AI Assistant: ChainGPT SDK
- Deployment: Vercel

---

## HELPFUL TIPS FOR USERS

- You need MetaMask (or any EIP-1193 wallet) connected to Arbitrum Sepolia
- Get free testnet USDT + CEST at /faucet before buying
- Marina Heights (Singapore) is SOLD OUT on primary market — find it on /market secondary
- Azure Barcelona Suite has the highest yield at 8.1% APY
- Stake CEST tokens to reduce your trading fees (PLATINUM = 100% fee waiver)
- All balances are encrypted — your holdings are private even to us
- Rent is paid monthly in USDT automatically to your wallet
`.trim()
