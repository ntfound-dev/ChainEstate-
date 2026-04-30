/**
 * Pin all ChainEstate property legal documents to IPFS via Pinata.
 *
 * Usage:
 *   1. Go to https://app.pinata.cloud/  → Sign up free → API Keys → New Key
 *   2. Copy the JWT token
 *   3. Add to .env.local:   PINATA_JWT=eyJ...
 *   4. Run:  node scripts/pin-docs.mjs
 *
 * Output: prints the real CID for each document.
 * Copy the CIDs into app/lib/propertiesData.ts (replace the placeholder ones).
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ─── Load JWT ───────────────────────────────────────────────────────────────
const envPath = join(__dir, '../.env.local')
let PINATA_JWT = process.env.PINATA_JWT
if (!PINATA_JWT) {
  try {
    const env = readFileSync(envPath, 'utf-8')
    const match = env.match(/^PINATA_JWT=(.+)$/m)
    if (match) PINATA_JWT = match[1].trim()
  } catch { /* no .env.local */ }
}
if (!PINATA_JWT) {
  console.error('Error: PINATA_JWT not set. Add PINATA_JWT=eyJ... to .env.local')
  process.exit(1)
}

// ─── Document definitions ────────────────────────────────────────────────────
const DOCS = [
  // PEARL-DXB-001
  {
    propertyId: 'pearl-dxb-001',
    ticker: 'PEARL-DXB-001',
    name: 'SPV Structure Document',
    content: buildSpv({
      property: 'The Pearl Residences',
      location: 'Jumeirah, Dubai, UAE',
      value: '$500,000',
      ticker: 'PEARL-DXB-001',
      tokenSupply: '500,000',
      yield: '6.8%',
      contractAddress: '0x853D51fBD5E288BF189FE0126d59f855c821a641',
    }),
  },
  {
    propertyId: 'pearl-dxb-001',
    ticker: 'PEARL-DXB-001',
    name: 'Property Valuation Report',
    content: buildValuation({
      property: 'The Pearl Residences',
      location: 'Jumeirah, Dubai, UAE',
      value: '$500,000',
      yield: '6.8%',
      occupancy: '94%',
      builtYear: '2022',
    }),
  },
  {
    propertyId: 'pearl-dxb-001',
    ticker: 'PEARL-DXB-001',
    name: 'Rental Agreement',
    content: buildRental({
      property: 'The Pearl Residences',
      location: 'Jumeirah, Dubai, UAE',
      monthlyRent: '$2,833',
      tenantType: 'Short-term corporate',
      term: 'Rolling month-to-month',
    }),
  },
  // SHIBUYA-TYO-001
  {
    propertyId: 'shibuya-tyo-001',
    ticker: 'SHIBUYA-TYO-001',
    name: 'SPV Structure Document',
    content: buildSpv({
      property: 'Shibuya Terrace',
      location: 'Shibuya, Tokyo, Japan',
      value: '$380,000',
      ticker: 'SHIBUYA-TYO-001',
      tokenSupply: '380,000',
      yield: '5.9%',
      contractAddress: '0x457d78AD2912923897B93fD82d502aD0B34E54eA',
    }),
  },
  {
    propertyId: 'shibuya-tyo-001',
    ticker: 'SHIBUYA-TYO-001',
    name: 'Property Valuation Report',
    content: buildValuation({
      property: 'Shibuya Terrace',
      location: 'Shibuya, Tokyo, Japan',
      value: '$380,000',
      yield: '5.9%',
      occupancy: '91%',
      builtYear: '2019',
    }),
  },
  // MARINA-SGP-001
  {
    propertyId: 'marina-sgp-001',
    ticker: 'MARINA-SGP-001',
    name: 'SPV Structure Document',
    content: buildSpv({
      property: 'Marina Heights',
      location: 'Marina Bay, Singapore',
      value: '$620,000',
      ticker: 'MARINA-SGP-001',
      tokenSupply: '620,000',
      yield: '7.2%',
      contractAddress: '0x57D15966CD4203cC8FbC1fd6763Be935d27D1178',
    }),
  },
  // CANARY-LON-001
  {
    propertyId: 'canary-lon-001',
    ticker: 'CANARY-LON-001',
    name: 'SPV Structure Document',
    content: buildSpv({
      property: 'Canary Wharf Executive',
      location: 'Canary Wharf, London, UK',
      value: '$850,000',
      ticker: 'CANARY-LON-001',
      tokenSupply: '850,000',
      yield: '5.4%',
      contractAddress: '0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23',
    }),
  },
  {
    propertyId: 'canary-lon-001',
    ticker: 'CANARY-LON-001',
    name: 'Property Valuation Report',
    content: buildValuation({
      property: 'Canary Wharf Executive',
      location: 'Canary Wharf, London, UK',
      value: '$850,000',
      yield: '5.4%',
      occupancy: '88%',
      builtYear: '2017',
    }),
  },
  {
    propertyId: 'canary-lon-001',
    ticker: 'CANARY-LON-001',
    name: 'Lease Agreement',
    content: buildRental({
      property: 'Canary Wharf Executive',
      location: 'Canary Wharf, London, UK',
      monthlyRent: '$3,825',
      tenantType: 'Corporate long-term',
      term: '12-month fixed',
    }),
  },
  // AZURE-BCN-001
  {
    propertyId: 'azure-bcn-001',
    ticker: 'AZURE-BCN-001',
    name: 'SPV Structure Document',
    content: buildSpv({
      property: 'Azure Barcelona Suite',
      location: 'Eixample, Barcelona, Spain',
      value: '$290,000',
      ticker: 'AZURE-BCN-001',
      tokenSupply: '290,000',
      yield: '8.1%',
      contractAddress: '0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe',
    }),
  },
]

// ─── Document builders ───────────────────────────────────────────────────────
function buildSpv({ property, location, value, ticker, tokenSupply, yield: apy, contractAddress }) {
  return {
    document: 'SPV Structure Document',
    version: '1.0',
    issuer: 'ChainEstate Labs',
    issuedDate: '2026-03-01',
    network: 'Arbitrum Sepolia (chainId 421614)',
    property: {
      name: property,
      location,
      totalValuation: value,
    },
    tokenization: {
      ticker,
      tokenStandard: 'ERC-7984 (iExec Nox Confidential Token)',
      totalSupply: tokenSupply,
      pricePerToken: '$1.00 USDT',
      targetAPY: apy,
      contractAddress,
    },
    spvStructure: {
      type: 'Special Purpose Vehicle (SPV)',
      legalEntity: `${property} SPV Ltd.`,
      jurisdiction: 'British Virgin Islands',
      directors: ['ChainEstate Labs Ltd.'],
      purpose: 'Fractional ownership and rental income distribution of the above property',
      incomeDistribution: '90% to token holders · 5% platform fee · 5% maintenance reserve',
      distributionFrequency: 'Monthly via RentDistributor.sol on Arbitrum Sepolia',
    },
    privacyMechanism: {
      protocol: 'iExec Nox ERC-7984',
      teeProvider: 'Intel TDX via iExec Network',
      iAppAddress: '0xB11bC7288eE239F6536829E410d22Eb514C5E282',
      description: 'Token balances encrypted as euint256. No on-chain observer can read individual holdings.',
    },
    disclaimer: 'This document is for informational purposes on the Arbitrum Sepolia testnet. Not financial advice.',
  }
}

function buildValuation({ property, location, value, yield: apy, occupancy, builtYear }) {
  return {
    document: 'Property Valuation Report',
    version: '1.0',
    issuer: 'ChainEstate Labs',
    issuedDate: '2026-03-01',
    property: {
      name: property,
      location,
      valuationDate: '2026-02-28',
      estimatedMarketValue: value,
      builtYear,
      targetAPY: apy,
      currentOccupancy: occupancy,
    },
    methodology: 'Discounted Cash Flow (DCF) + Comparable Market Analysis (CMA)',
    assumptions: [
      'Rental income based on current market rates and occupancy trends',
      'Valuation does not account for currency fluctuations',
      'Token price pegged at $1.00 USDT for primary market purchases',
    ],
    disclaimer: 'This valuation is for testnet demonstration purposes only.',
  }
}

function buildRental({ property, location, monthlyRent, tenantType, term }) {
  return {
    document: 'Rental Agreement Summary',
    version: '1.0',
    issuer: 'ChainEstate Labs',
    issuedDate: '2026-03-01',
    property: {
      name: property,
      location,
    },
    rentalTerms: {
      monthlyGrossRent: monthlyRent,
      tenantClassification: tenantType,
      leaseTerm: term,
      renewalOption: 'Yes — at prevailing market rate',
    },
    incomeDistribution: {
      holderShare: '90%',
      platformFee: '5%',
      maintenanceReserve: '5%',
      distributionMechanism: 'RentDistributor.sol — monthly USDT transfer to all registered holders',
    },
    disclaimer: 'Agreement summary for testnet demonstration. Not a legally binding document.',
  }
}

// ─── Pin to Pinata ───────────────────────────────────────────────────────────
async function pinJson(name, json) {
  const body = JSON.stringify({
    pinataContent: json,
    pinataMetadata: { name },
  })
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata error ${res.status}: ${text}`)
  }
  const data = await res.json()
  return data.IpfsHash
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('📌 Pinning ChainEstate legal documents to IPFS via Pinata…\n')
const results = {}

for (const doc of DOCS) {
  const key = doc.propertyId
  if (!results[key]) results[key] = {}
  try {
    const cid = await pinJson(`ChainEstate — ${doc.ticker} — ${doc.name}`, doc.content)
    results[key][doc.name] = cid
    console.log(`✓ ${doc.ticker} / ${doc.name}`)
    console.log(`  CID: ${cid}`)
    console.log(`  URL: https://ipfs.io/ipfs/${cid}\n`)
  } catch (err) {
    console.error(`✗ ${doc.ticker} / ${doc.name}: ${err.message}`)
  }
}

console.log('\n─── Copy these CIDs into app/lib/propertiesData.ts ───\n')
console.log(JSON.stringify(results, null, 2))
