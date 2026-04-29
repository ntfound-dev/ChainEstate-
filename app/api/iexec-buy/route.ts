import { type NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const IAPP_ADDRESS = process.env.IEXEC_IAPP_ADDRESS ?? ''
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''
const RPC = process.env.ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'

function getIExec(): InstanceType<typeof IExec> {
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const signer = utils.getSignerFromPrivateKey(RPC, PRIVATE_KEY, {
    allowExperimentalNetworks: true,
  })
  return new IExec({ ethProvider: signer }, { allowExperimentalNetworks: true })
}

type TaskMessage = { message: string; task: unknown }

async function waitForTask(
  iexec: InstanceType<typeof IExec>,
  taskid: string,
  dealid: string,
): Promise<void> {
  const obs = await iexec.task.obsTask(taskid, { dealid })
  return new Promise((resolve, reject) => {
    obs.subscribe({
      next: ({ message }: TaskMessage) => {
        if (message === 'TASK_COMPLETED') resolve()
        else if (message === 'TASK_FAILED') reject(new Error('iExec task failed on worker'))
        else if (message === 'TASK_TIMEDOUT') reject(new Error('iExec task timed out'))
      },
      error: (err: unknown) =>
        reject(err instanceof Error ? err : new Error(String(err))),
      complete: () => {},
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    const { tokenAmount, contractAddress, buyerAddress } = (await req.json()) as {
      tokenAmount: string
      contractAddress: string
      buyerAddress: string
    }

    if (!tokenAmount || !contractAddress || !buyerAddress) {
      return NextResponse.json({ error: 'Missing required fields: tokenAmount, contractAddress, buyerAddress' }, { status: 400 })
    }
    if (!IAPP_ADDRESS) {
      return NextResponse.json({ error: 'IEXEC_IAPP_ADDRESS not configured — deploy the iApp first' }, { status: 503 })
    }

    const iexec = getIExec()

    // Fetch app orders from iExec marketplace
    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook({ app: IAPP_ADDRESS, minTag: ['tee', 'tdx'] })
    if (!appOrders.length) {
      return NextResponse.json({ error: 'No app orders available for this iApp on the marketplace' }, { status: 503 })
    }
    const appOrder = appOrders[0].order

    // Fetch TEE-capable workerpool orders
    const { orders: wpOrders } = await iexec.orderbook.fetchWorkerpoolOrderbook({
      category: 0,
      minTag: ['tee', 'tdx'],
    })
    if (!wpOrders.length) {
      return NextResponse.json({ error: 'No TEE workerpool orders available' }, { status: 503 })
    }
    const workerpoolOrder = wpOrders[0].order

    // Strip 0x prefix — iExec CLI parses 0x-prefixed hex as JS number literals,
    // losing precision on 160-bit Ethereum addresses. iApp re-adds 0x internally.
    const contractHex = contractAddress.replace(/^0x/i, '')
    const buyerHex = buyerAddress.replace(/^0x/i, '')

    // Create and sign requester order with app args
    const requesterOrder = await iexec.order.createRequestorder({
      app: IAPP_ADDRESS,
      category: 0,
      params: { iexec_args: `${tokenAmount} ${contractHex} ${buyerHex}` },
      workerpoolmaxprice: workerpoolOrder.workerpoolprice,
      appmaxprice: appOrder.appprice,
    })
    const signedOrder = await iexec.order.signRequestorder(requesterOrder)

    // Match orders → creates a deal on-chain
    const { dealid } = await iexec.order.matchOrders({
      apporder: appOrder,
      workerpoolorder: workerpoolOrder,
      requestorder: signedOrder,
    })

    // Derive task ID (single task per deal at index 0)
    const taskid = await iexec.deal.computeTaskId(dealid, 0)
    console.log(`[iexec-buy] deal=${dealid} task=${taskid}`)

    // Wait for TEE computation to complete
    await waitForTask(iexec, taskid, dealid)

    // Download and unzip result from IPFS
    const resultResponse = await iexec.task.fetchResults(taskid)
    const arrayBuffer = await resultResponse.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const resultFile = zip.file('result.json')
    if (!resultFile) {
      return NextResponse.json({ error: 'result.json missing from task output ZIP' }, { status: 502 })
    }
    const resultText = await resultFile.async('string')
    const result = JSON.parse(resultText) as { handle?: string; handleProof?: string }

    if (!result.handle || !result.handleProof) {
      return NextResponse.json(
        { error: 'Task result missing handle or handleProof', raw: resultText },
        { status: 502 },
      )
    }

    return NextResponse.json({
      handle: result.handle,
      handleProof: result.handleProof,
      taskid,
      dealid,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[iexec-buy] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
