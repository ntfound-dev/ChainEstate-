import { type NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const IAPP_ADDRESS = process.env.IEXEC_IAPP_ADDRESS ?? ''
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''
const RPC = process.env.ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'
const HEX_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const UINT_RE = /^(0|[1-9]\d*)$/

function getIExec(): InstanceType<typeof IExec> {
  const rawKey = PRIVATE_KEY.trim()
  if (!rawKey || rawKey === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
  const signer = utils.getSignerFromPrivateKey(RPC, privateKey, { allowExperimentalNetworks: true })
  return new IExec({ ethProvider: signer }, { allowExperimentalNetworks: true })
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>
    const message = record.message ?? record.reason ?? record.error
    if (typeof message === 'string' && message) return message
  }
  return 'Unknown error'
}

function classifyStartError(message: string): { status: number; hint: string } {
  const lower = message.toLowerCase()

  if (lower.includes('private_key') || lower.includes('private key') || lower.includes('iexec_iapp_address')) {
    return {
      status: 503,
      hint: 'Server iExec environment is not ready. Check PRIVATE_KEY and IEXEC_IAPP_ADDRESS in Vercel.',
    }
  }

  if (lower.includes('rlc') || lower.includes('balance') || lower.includes('stake') || lower.includes('deposit')) {
    return {
      status: 402,
      hint: 'The requester wallet needs enough staked RLC to submit an iExec TEE task.',
    }
  }

  if (
    lower.includes('market') ||
    lower.includes('order') ||
    lower.includes('workerpool') ||
    lower.includes('apporder') ||
    lower.includes('app order')
  ) {
    return {
      status: 503,
      hint: 'iExec marketplace is temporarily unable to match this TEE task. Republish the iApp order or try again shortly.',
    }
  }

  return {
    status: 503,
    hint: 'iExec TEE task submission failed. Try again shortly, then check the Vercel function log if it persists.',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tokenAmount, contractAddress, buyerAddress } = (await req.json()) as {
      tokenAmount: string
      contractAddress: string
      buyerAddress: string
    }

    if (!tokenAmount || !contractAddress || !buyerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!UINT_RE.test(tokenAmount) || BigInt(tokenAmount) <= 0n) {
      return NextResponse.json({ error: 'tokenAmount must be a positive whole number' }, { status: 400 })
    }
    if (!HEX_ADDRESS_RE.test(contractAddress) || !HEX_ADDRESS_RE.test(buyerAddress)) {
      return NextResponse.json({ error: 'contractAddress and buyerAddress must be valid Ethereum addresses' }, { status: 400 })
    }
    if (!IAPP_ADDRESS) {
      return NextResponse.json({ error: 'IEXEC_IAPP_ADDRESS not configured — deploy the iApp first' }, { status: 503 })
    }
    if (!HEX_ADDRESS_RE.test(IAPP_ADDRESS)) {
      return NextResponse.json({ error: 'IEXEC_IAPP_ADDRESS is not a valid Ethereum address' }, { status: 503 })
    }

    const iexec = getIExec()

    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook({ app: IAPP_ADDRESS, minTag: ['tee', 'tdx'] })
    if (!appOrders.length) {
      return NextResponse.json({ error: 'No app orders available for this iApp on the marketplace' }, { status: 503 })
    }

    const { orders: wpOrders } = await iexec.orderbook.fetchWorkerpoolOrderbook({ category: 0, minTag: ['tee', 'tdx'] })
    if (!wpOrders.length) {
      return NextResponse.json({ error: 'No TEE workerpool orders available' }, { status: 503 })
    }

    // Strip 0x prefix — iExec CLI parses 0x-prefixed hex as JS number literals,
    // losing precision on 160-bit Ethereum addresses. iApp re-adds 0x internally.
    const contractHex = contractAddress.replace(/^0x/i, '')
    const buyerHex = buyerAddress.replace(/^0x/i, '')

    const requesterOrder = await iexec.order.createRequestorder({
      app: IAPP_ADDRESS,
      category: 0,
      params: { iexec_args: `${tokenAmount} ${contractHex} ${buyerHex}` },
      workerpoolmaxprice: wpOrders[0].order.workerpoolprice,
      appmaxprice: appOrders[0].order.appprice,
    })
    const signedOrder = await iexec.order.signRequestorder(requesterOrder)

    const { dealid } = await iexec.order.matchOrders({
      apporder: appOrders[0].order,
      workerpoolorder: wpOrders[0].order,
      requestorder: signedOrder,
    })

    const taskid = await iexec.deal.computeTaskId(dealid, 0)
    console.log(`[iexec-buy] deal=${dealid} task=${taskid}`)

    // Return immediately — frontend polls /api/iexec-poll for completion
    return NextResponse.json({ taskid, dealid })
  } catch (err) {
    const msg = getErrorMessage(err)
    const { status, hint } = classifyStartError(msg)
    console.error('[iexec-buy] error:', err)
    return NextResponse.json({ error: msg, hint }, { status })
  }
}
