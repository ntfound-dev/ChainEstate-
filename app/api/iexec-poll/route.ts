import { type NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'
import { ObjectNotFoundError } from 'iexec/errors'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''
const RPC = process.env.ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'
const BYTES32_RE = /^0x[a-fA-F0-9]{64}$/

function getIExec(): InstanceType<typeof IExec> {
  const rawKey = PRIVATE_KEY.trim()
  if (!rawKey || rawKey === 'YOUR_PRIVATE_KEY_HERE') {
    throw new Error('PRIVATE_KEY not configured in environment')
  }
  const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
  const signer = utils.getSignerFromPrivateKey(RPC, privateKey, { allowExperimentalNetworks: true })
  return new IExec({ ethProvider: signer }, { allowExperimentalNetworks: true })
}

// iExec on-chain task status enum
const TASK_COMPLETED = 3
const TASK_FAILED = 4

type TaskSnapshot = {
  status: number
  statusName?: string
  taskTimedOut?: boolean
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

function isTaskNotFound(err: unknown): boolean {
  return err instanceof ObjectNotFoundError && err.objName === 'task'
}

async function readTaskSnapshot(
  iexec: InstanceType<typeof IExec>,
  taskid: string,
  dealid: string | null,
): Promise<TaskSnapshot | null> {
  try {
    return await iexec.task.show(taskid) as TaskSnapshot
  } catch (err) {
    if (!isTaskNotFound(err)) throw err

    // A freshly matched deal can exist before task 0 is initialized on-chain.
    // In that window task.show() throws ObjectNotFoundError; with a dealid we
    // can treat it as pending instead of leaking a noisy 500 to the browser.
    if (dealid) {
      await iexec.deal.show(dealid)
      return { status: 0, statusName: 'UNSET', taskTimedOut: false }
    }

    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskid = searchParams.get('taskid')
    const dealid = searchParams.get('dealid')

    if (!taskid) {
      return NextResponse.json({ error: 'Missing taskid' }, { status: 400 })
    }
    if (!BYTES32_RE.test(taskid)) {
      return NextResponse.json({ error: 'Invalid taskid' }, { status: 400 })
    }
    if (dealid && !BYTES32_RE.test(dealid)) {
      return NextResponse.json({ error: 'Invalid dealid' }, { status: 400 })
    }

    const iexec = getIExec()
    let task: TaskSnapshot | null
    try {
      task = await readTaskSnapshot(iexec, taskid, dealid)
    } catch (pollErr) {
      const pollMsg = getErrorMessage(pollErr)
      console.warn('[iexec-poll] transient task read error:', pollErr)
      return NextResponse.json({
        status: 'pending',
        taskStatus: 0,
        taskStatusName: 'UNKNOWN',
        transientError: pollMsg,
      })
    }

    if (!task) {
      return NextResponse.json({
        status: 'pending',
        taskStatus: 0,
        taskStatusName: 'UNSET',
        message: 'Waiting for iExec task initialization',
      })
    }

    if (task.taskTimedOut || task.status === TASK_FAILED) {
      return NextResponse.json({ status: 'failed', error: 'iExec task failed or timed out on worker' })
    }
    if (task.status !== TASK_COMPLETED) {
      return NextResponse.json({ status: 'pending', taskStatus: task.status, taskStatusName: task.statusName })
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
    if (!resultResponse.ok) {
      return NextResponse.json({
        status: 'pending',
        taskStatus: TASK_COMPLETED,
        fetchError: `Result gateway returned ${resultResponse.status}`,
      })
    }

    const arrayBuffer = await resultResponse.arrayBuffer()
    let zip: JSZip
    try {
      zip = await JSZip.loadAsync(arrayBuffer)
    } catch (zipErr) {
      return NextResponse.json({
        status: 'pending',
        taskStatus: TASK_COMPLETED,
        fetchError: getErrorMessage(zipErr),
      })
    }

    const resultFile = zip.file('result.json')
    if (!resultFile) {
      return NextResponse.json({ status: 'failed', error: 'result.json missing from task output ZIP' })
    }

    const resultText = await resultFile.async('string')
    let result: { handle?: string; handleProof?: string }
    try {
      result = JSON.parse(resultText) as { handle?: string; handleProof?: string }
    } catch {
      return NextResponse.json({ status: 'failed', error: 'result.json is not valid JSON', raw: resultText })
    }

    if (!result.handle || !result.handleProof) {
      return NextResponse.json({ status: 'failed', error: 'Missing handle or handleProof', raw: resultText })
    }

    return NextResponse.json({
      status: 'completed',
      handle: result.handle,
      handleProof: result.handleProof,
    })
  } catch (err) {
    const msg = getErrorMessage(err)
    console.error('[iexec-poll] error:', err)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
