import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'

const USDT_ADDRESS = '0x9a822B9A50D090CfcCa1e6474efCd653112d8501' as const
const CEST_ADDRESS = '0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D' as const

const USDT_AMOUNT = parseUnits('1000', 6)
const CEST_AMOUNT = parseUnits('2400', 18)
const COOLDOWN_MS = 24 * 60 * 60 * 1000

const cooldowns = new Map<string, number>()

const MINT_ABI = [
  {
    name: 'mint',
    type: 'function' as const,
    inputs: [
      { name: 'to', type: 'address' as const },
      { name: 'amount', type: 'uint256' as const },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
]

const TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function' as const,
    inputs: [
      { name: 'to', type: 'address' as const },
      { name: 'value', type: 'uint256' as const },
    ],
    outputs: [{ name: '', type: 'bool' as const }],
    stateMutability: 'nonpayable' as const,
  },
]

export async function POST(req: NextRequest) {
  let body: { address?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { address, token } = body
  if (!address || !token || !['usdt', 'cest'].includes(token)) {
    return NextResponse.json({ error: 'Missing or invalid address/token' }, { status: 400 })
  }

  const key = `${address.toLowerCase()}_${token}`
  const lastClaim = cooldowns.get(key)
  if (lastClaim && Date.now() - lastClaim < COOLDOWN_MS) {
    const hoursLeft = Math.ceil((COOLDOWN_MS - (Date.now() - lastClaim)) / 3_600_000)
    return NextResponse.json(
      { error: `Cooldown active — try again in ${hoursLeft}h` },
      { status: 429 },
    )
  }

  const rawKey = process.env.FAUCET_PRIVATE_KEY
  if (!rawKey) {
    return NextResponse.json({ error: 'Faucet wallet not configured' }, { status: 503 })
  }

  const pk: `0x${string}` = rawKey.startsWith('0x') ? (rawKey as `0x${string}`) : `0x${rawKey}`
  const account = privateKeyToAccount(pk)

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    ),
  })

  try {
    let txHash: `0x${string}`

    if (token === 'usdt') {
      txHash = await walletClient.writeContract({
        address: USDT_ADDRESS,
        abi: MINT_ABI,
        functionName: 'mint',
        args: [address as `0x${string}`, USDT_AMOUNT],
      })
    } else {
      txHash = await walletClient.writeContract({
        address: CEST_ADDRESS,
        abi: TRANSFER_ABI,
        functionName: 'transfer',
        args: [address as `0x${string}`, CEST_AMOUNT],
      })
    }

    cooldowns.set(key, Date.now())
    return NextResponse.json({ txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transaction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
