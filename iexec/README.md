# ChainEstate iApp — iExec Nox TEE Encryption

Dockerized Node.js application running inside **Intel TDX Trusted Execution Environment** on the iExec network. Its sole purpose: receive a token amount + contract addresses, call the Nox gateway from inside the enclave, and return an encrypted `{ handle, handleProof }` pair that can be imported on-chain via `Nox.fromExternal()`.

## Deployed

| | |
|---|---|
| **iApp Address** | `0xB11bC7288eE239F6536829E410d22Eb514C5E282` |
| **Docker Image** | `jancok075/iexec:0.0.1-tdx-1f1d5e8f915a` |
| **Chain** | arbitrum-sepolia-testnet (421614) |
| **Tag** | `tee,tdx` |
| **App Order** | Published — 1,000,000 volume, price 0 |

## What It Does

```
iExec Worker (Intel TDX enclave)
   │
   │  args: "<tokenAmount> <contractAddressHex> <buyerAddressHex>"
   │  (0x prefix stripped by API route — re-added inside iApp)
   │
   ▼  POST https://nox-gateway.../v0/secrets
      {
        value: uint256 as 32-byte hex,
        solidityType: "uint256",
        applicationContract: "0x...",
        owner: "0x..."
      }
   │
   ▼  Nox Gateway (only reachable from verified TDX enclave)
      ← { handle: bytes32, handleProof: bytes }
   │
   ▼  writes /iexec_out/result.json
      { handle, handleProof, tokenAmount, contractAddress, buyerAddress }
```

The Nox gateway rejects requests from outside a real TEE — so `handle` can only be created inside an attested enclave. On-chain, `Nox.fromExternal(handle, handleProof)` verifies this before minting the encrypted balance.

## Args Format

The iApp receives 3 space-separated args (without `0x` prefix on addresses):

```
<tokenAmount> <contractAddressHex> <buyerAddressHex>
```

Example:
```
100 77836405DC14Ca1Ef0304041ec8D3B4166424cfa 834De729cb9dF77451DBc6bf7FD05F475B011Ac7
```

> **Why no 0x?** The iExec CLI interprets `0x`-prefixed hex as JavaScript number literals, losing precision on 160-bit addresses. The API route strips `0x` before building `iexec_args`; the iApp re-adds it internally.

## Local Test

```bash
cd iexec
iapp test --args "100 77836405DC14Ca1Ef0304041ec8D3B4166424cfa 834De729cb9dF77451DBc6bf7FD05F475B011Ac7"
```

Expected output in console:
```
Encrypting tokenAmount=100 for contract=0x7783... owner=0x834D...
Encryption successful. handle=0x000...
```

Check `output/result.json` for the full response.

> Note: `iapp test` runs outside a real TDX enclave. The Nox gateway still returns a handle for testing purposes, but in production the gateway verifies TDX attestation.

## Redeploy

```bash
cd iexec
iapp deploy          # builds Docker, pushes to DockerHub, registers on iExec
iexec app publish 0xB11bC7288eE239F6536829E410d22Eb514C5E282 \
  --chain arbitrum-sepolia-testnet --tag tee,tdx
```

After redeploy, update `IEXEC_IAPP_ADDRESS` in Vercel environment variables.

## RLC Requirements

Each task costs **0.1 RLC** (100,000,000 nRLC). The requester wallet (`PRIVATE_KEY` env var) must have RLC staked in its iExec account:

```bash
iexec account show --chain arbitrum-sepolia-testnet
iexec account deposit 500000000 --chain arbitrum-sepolia-testnet  # deposit 0.5 RLC
```

## Source

[src/app.js](./src/app.js) — the full iApp logic (~70 lines).
