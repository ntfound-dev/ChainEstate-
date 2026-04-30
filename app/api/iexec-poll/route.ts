import { type NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''
const RPC = process.env.ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'

function getIExec(): InstanceType<typeof IExec> {
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const signer = utils.getSignerFromPrivateKey(RPC, PRIVATE_KEY, { allowExperimentalNetworks: true })
  return new IExec({ ethProvider: signer }, { allowExperimentalNetworks: true })
}

// iExec on-chain task status enum
const TASK_COMPLETED = 3
const TASK_FAILED = 4

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskid = searchParams.get('taskid')

    if (!taskid) {
      return NextResponse.json({ error: 'Missing taskid' }, { status: 400 })
    }

    const iexec = getIExec()
    const task = await iexec.task.show(taskid) as { status: number }

    if (task.status === TASK_FAILED) {
      return NextResponse.json({ status: 'failed', error: 'iExec task failed on worker' })
    }
    if (task.status !== TASK_COMPLETED) {
      return NextResponse.json({ status: 'pending', taskStatus: task.status })
    }

    // Task completed — download and unzip result from IPFS
    let resultResponse: Response
    try {
      resultResponse = await iexec.task.fetchResults(taskid)
    } catch (fetchErr) {
      const fetchMsg = fetchErr instanceof Error ? fetchErr.message : 'IPFS download failed'
      console.error('[iexec-poll] fetchResults error:', fetchErr)
      // Return pending so frontend keeps polling — IPFS may still be propagating
      return NextResponse.json({ status: 'pending', taskStatus: TASK_COMPLETED, fetchError: fetchMsg })
    }

    const arrayBuffer = await resultResponse.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const resultFile = zip.file('result.json')
    if (!resultFile) {
      return NextResponse.json({ status: 'failed', error: 'result.json missing from task output ZIP' })
    }

    const resultText = await resultFile.async('string')
    const result = JSON.parse(resultText) as { handle?: string; handleProof?: string }

    if (!result.handle || !result.handleProof) {
      return NextResponse.json({ status: 'failed', error: 'Missing handle or handleProof', raw: resultText })
    }

    return NextResponse.json({
      status: 'completed',
      handle: result.handle,
      handleProof: result.handleProof,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[iexec-poll] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
