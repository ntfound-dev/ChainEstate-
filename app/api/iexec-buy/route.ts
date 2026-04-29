import { type NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const IAPP_ADDRESS = process.env.IEXEC_IAPP_ADDRESS ?? ''
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''
const RPC = process.env.ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'

function getIExec(): InstanceType<typeof IExec> {
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const signer = utils.getSignerFromPrivateKey(RPC, PRIVATE_KEY, { allowExperimentalNetworks: true })
  return new IExec({ ethProvider: signer }, { allowExperimentalNetworks: true })
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
    if (!IAPP_ADDRESS) {
      return NextResponse.json({ error: 'IEXEC_IAPP_ADDRESS not configured — deploy the iApp first' }, { status: 503 })
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
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[iexec-buy] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
