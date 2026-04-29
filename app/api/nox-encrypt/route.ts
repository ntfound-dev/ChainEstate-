import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOX_GATEWAY = 'https://2e1800fc0dddeeadc189283ed1dce13c1ae28d48-3000.apps.ovh-tdx-dev.noxprotocol.dev'

function uintToHex256(value: string): string {
  const n = BigInt(value)
  return '0x' + n.toString(16).padStart(64, '0')
}

export async function POST(req: NextRequest) {
  try {
    const { value, contractAddress, owner } = (await req.json()) as {
      value: string
      contractAddress: string
      owner: string
    }

    if (!value || !contractAddress || !owner) {
      return NextResponse.json(
        { error: 'Missing required fields: value, contractAddress, owner' },
        { status: 400 },
      )
    }

    const encodedValue = uintToHex256(String(value))

    const gatewayRes = await fetch(`${NOX_GATEWAY}/v0/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: encodedValue,
        solidityType: 'uint256',
        applicationContract: contractAddress,
        owner,
      }),
    })

    const contentType = gatewayRes.headers.get('Content-Type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await gatewayRes.text()
      return NextResponse.json(
        { error: `Nox gateway error (${gatewayRes.status}): ${text}` },
        { status: 502 },
      )
    }

    const raw = (await gatewayRes.json()) as Record<string, unknown>

    if (!gatewayRes.ok) {
      return NextResponse.json({ error: `Nox gateway ${gatewayRes.status}`, detail: raw }, { status: 502 })
    }

    // Gateway wraps response in {payload: {handle, proof}, signature: "0x..."}
    const payload = (typeof raw?.payload === 'object' && raw.payload !== null
      ? raw.payload
      : raw) as Record<string, unknown>

    const handle = payload.handle as string | undefined
    const proof  = payload.proof  as string | undefined

    if (!handle || !proof) {
      console.error('[nox-encrypt] Unexpected gateway response:', raw)
      return NextResponse.json({ error: 'Invalid gateway response: missing handle or proof', raw }, { status: 502 })
    }

    return NextResponse.json({ handle, handleProof: proof })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[nox-encrypt] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
