import { NextRequest, NextResponse } from 'next/server'
import { PROPERTIES } from '@/app/lib/propertiesData'

// ERC-721 compatible metadata JSON — follows OpenSea metadata standard.
// In production this JSON is pinned to IPFS via nft.storage or Pinata.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const property = PROPERTIES.find((p) => p.id === params.id)
  if (!property) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  }

  const metadata = {
    name: `${property.name} — ${property.ticker}`,
    description:
      `Fractional ownership token on ChainEstate. Each token represents 1 USDT worth of equity ` +
      `in ${property.name} (${property.location}). ` +
      `${property.description} ` +
      `All rental income is distributed monthly via the ERC-7984 confidential token standard — ` +
      `powered by iExec Nox TEE technology on Arbitrum Sepolia.`,
    image: property.images[0],
    external_url: `https://chainestate.xyz/properties/${property.id}`,
    background_color: '080810',
    attributes: [
      { trait_type: 'Ticker',          value: property.ticker },
      { trait_type: 'Token Standard',  value: property.tokenStandard },
      { trait_type: 'Chain',           value: property.chain },
      { trait_type: 'Token ID',        value: property.tokenId },
      { trait_type: 'Location',        value: property.location },
      { trait_type: 'Region',          value: property.region },
      { trait_type: 'Property Value',  value: `$${property.value.toLocaleString()}` },
      { trait_type: 'Total Supply',    value: property.totalTokens },
      { trait_type: 'Price per Token', value: `$${property.pricePerToken.toFixed(2)}` },
      { trait_type: 'Gross Yield',     value: `${property.yield}%`, display_type: 'number' },
      { trait_type: 'Funded',          value: property.funded, display_type: 'boost_percentage' },
      { trait_type: 'Status',          value: property.status === 'active' ? 'Active' : property.status === 'sold_out' ? 'Sold Out' : 'Coming Soon' },
      { trait_type: 'Contract',        value: property.contractAddress },
    ],
    // IPFS document attachments
    properties: {
      files: property.documents.map((doc) => ({
        uri: doc.pinned ? `ipfs://${doc.cid}` : `pending:${doc.cid}`,
        type: 'application/pdf',
        cdn: false,
      })),
      category: 'real-estate-token',
      creators: [{ address: '0x32AC35493ff1E4a550C36AB6BfD2f29a2b021a14', share: 100 }],
    },
  }

  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  })
}
