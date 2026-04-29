# iExec Nox — Developer Feedback

**Project:** ChainEstate — Fractional Real Estate Tokenization on Arbitrum Sepolia  
**Team:** Frendi Cahyo  
**Hackathon:** iExec Nox / ChainGPT Hackathon, Q1 2026  
**Date:** April 2026

---

## Overview

We built ChainEstate using iExec Nox ERC-7984 confidential tokens as the core privacy layer for tokenized real estate. This document shares honest feedback on the developer experience building with the Nox Protocol and handle SDK.

---

## What We Used

| Tool | Usage in ChainEstate |
|---|---|
| `@iexec-nox/handle` SDK | `createViemHandleClient`, `encryptInput` → `{handle, handleProof}` for `purchaseTokens` |
| ERC-7984 `euint256` | PropertyToken balances stored fully encrypted on-chain |
| `confidentialTransferFrom` | SecondaryMarket P2P trades — amounts never exposed |
| `iExec-nox/nox-protocol-contracts` | Base for PropertyToken inheritance |
| Bellecour / Arbitrum Sepolia gateway | TEE encryption via `https://*.noxprotocol.dev` |

---

## What Worked Well ✓

### 1. The ERC-7984 Standard Is Elegant
The idea of `euint256` as a drop-in encrypted replacement for `uint256` is genuinely innovative. The pattern of:
1. Encrypt off-chain via TEE → get `{handle, handleProof}`
2. Pass to contract → balance stored as ciphertext
3. Nobody on-chain can read balances

...is a clean, auditable privacy model. The security boundary is well-defined.

### 2. `createViemHandleClient` — Viem Integration
The fact that the handle client wraps a Wagmi/Viem `WalletClient` directly is excellent DX. No separate wallet management. No new key material. The pattern `createViemHandleClient(walletClient)` → `client.encryptInput(amount, 'uint256', contractAddress)` is intuitive once understood.

### 3. `handleProof` Design
The proof-based model (TEE signs the encrypted value, returns attestation proof) means the contract can verify the encryption without trusting the frontend. This is the right architecture for a trustless system.

### 4. Gateway API Works Reliably
Direct calls to the Nox gateway (`/v0/secrets`) returned valid handles + proofs consistently. The CORS policy (`Access-Control-Allow-Origin: *`) made browser integration smooth.

### 5. Equal-Share Rent Distribution Workaround
Because `euint256` balances can't be read on-chain, we designed equal-share rent distribution as a pragmatic solution for Phase 1. The iExec team confirmed this is the intended approach until Nox compute-over-encrypted-data is production-ready. This was communicated clearly in the docs and appreciated.

---

## Pain Points & Suggestions ✗

### 1. **No Domain Allowlist Documentation** — High Priority
**Problem:** In production, calling `createViemHandleClient` from a deployed domain (e.g. `chainestate.vercel.app`) sometimes throws:
```
Uncaught (in promise): The source https://chainestate.vercel.app/ has not been authorized yet
```
It's not clear: (a) where this error originates, (b) whether it's the gateway, a smart contract, or an off-chain registry, and (c) how to fix it.

**Suggestion:** Add a dedicated docs page: "Authorizing your dApp with Nox". Specifically:
- Is authorization done on-chain (via the Nox protocol contract `0xd464B...`)?
- Is it done off-chain via a registration portal?
- Can developers self-register on testnet?

### 2. **Error Messages Are Cryptic in Production Builds**
In production builds (Next.js minified), the handle SDK throws:
```
a: The source X has not been authorized yet
```
The `a:` prefix is a minified class name. Error messages should not rely on class names — use `.message` strings that survive minification.

**Suggestion:** Use named error codes or stable `.message` strings like `"NOX_SOURCE_UNAUTHORIZED"`.

### 3. **`encryptInput` Type Support Is Limited**
Current supported types: `bool`, `uint16`, `uint256`, `int16`, `int256`.

For real-world DeFi, we also needed `uint128` (for intermediate calculations) and `address` encryption. Being limited to `uint256` means all values must be cast/normalized, which introduces potential overflow risk.

**Suggestion:** Expand supported types to at minimum: `uint8`, `uint32`, `uint64`, `uint128`, `address`.

### 4. **No On-Chain Balance Read for Holders**
Because balances are `euint256`, there's no way for a holder to read their own balance on-chain without going through the Handle Gateway. This makes it impossible to build pro-rata rent distribution without iExec compute.

**Suggestion:** Provide a `selfDecrypt()` function that lets the balance holder (and only them) read their balance via a signed request, without full compute infrastructure.

### 5. **Testnet Gateway is Slow / Unreliable at Peak**
During development, the Arbitrum Sepolia TEE gateway occasionally returned 504 timeouts. This made testing `encryptInput` flows unpredictable.

**Suggestion:** Add a local mock TEE server (similar to Hardhat's `hardhat-network`) for fully offline development. A `@iexec-nox/handle-mock` package that returns deterministic fake handles for unit testing would be invaluable.

### 6. **No TypeScript Type Export for `Handle<T>`**
The `Handle` type is not exported from the SDK in a way that's easily usable in TypeScript generics. We had to use `bytes32` in our contract ABI and cast manually.

**Suggestion:** Export `Handle<T>` as a Branded type and provide a utility to validate/assert handle types at runtime.

### 7. **SDK README Is Minimal**
The `@iexec-nox/handle` README on npm covers installation and basic usage but lacks:
- Full API reference (all methods, parameters, return types)
- Error handling guide
- Production deployment checklist
- Example repo with Next.js / Wagmi v2 integration

**Suggestion:** A full `examples/` directory in the SDK repo with a working Next.js + Wagmi v2 + iExec Nox integration would dramatically reduce time-to-first-integration.

---

## Feature Requests

| Feature | Priority | Use Case |
|---|---|---|
| `selfDecrypt()` — holder reads own balance | High | Pro-rata rent distribution, portfolio display |
| Local mock TEE server for testing | High | Faster dev cycle, CI/CD |
| `@iexec-nox/handle-mock` for unit tests | High | Testing `purchaseTokens` without live gateway |
| Expanded `encryptInput` types | Medium | `uint128`, `address` support |
| Compute-over-encrypted-balances (Phase 2) | High | Pro-rata distribution based on actual holdings |
| Stable error codes (no minification casualties) | Medium | Better production error UX |
| `viewACL` — read who can decrypt a handle | Low | Governance, audit trail |

---

## Integration Complexity Rating

| Aspect | Rating | Notes |
|---|---|---|
| Initial setup (`npm install`, basic call) | ⭐⭐⭐⭐⭐ | Trivial — under 10 min |
| `encryptInput` integration in contract | ⭐⭐⭐⭐ | Needs ABI knowledge, clear once done |
| `confidentialTransferFrom` in SecondaryMarket | ⭐⭐⭐ | Requires grantOperator pattern — not documented |
| Production deployment (domain auth) | ⭐⭐ | Unclear authorization path |
| Pro-rata distribution (compute-over-encrypted) | ⭐ | Not yet production-ready on testnet |

**Overall DX Rating: 4/5** — The core concept is solid and the Viem integration is clean. Docs and error UX need work for production-grade dApp development.

---

## Summary

iExec Nox ERC-7984 is the right technology for privacy-preserving RWA tokenization. The encrypted balance model genuinely solves the "transparent portfolio" problem that plagues all other on-chain real estate platforms. ChainEstate was able to implement 5 distinct ERC-7984 utility types (private payments, private transfers, rewards, governance, access control) on top of Nox — demonstrating the protocol's versatility.

The main ask: **better docs, especially around production deployment and domain authorization**. The tech is ready; the docs just need to catch up.

---

*Feedback submitted as part of iExec Nox / ChainGPT Hackathon, April 2026.*
*Repository: https://github.com/ntfound-dev/ChainEstate-*
