'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { encodeFunctionData } from 'viem'
import { useClientAccount as useAccount } from '../../components/web3/useClientAccount'
import { ConfidentialBadge } from '../../components/ui/ConfidentialBadge'
import { TransactionModal } from '../../components/ui/TransactionModal'
import { useToast } from '../../components/ui/Toast'
import { WalletButton } from '../../components/web3/WalletButton'
import { PROPERTIES } from '../../lib/propertiesData'
import { ADDRESSES, ERC20_ABI, PROPERTY_TOKEN_ABI } from '../../lib/contracts'
import { arbitrumSepolia } from 'wagmi/chains'


function extractMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const m = e.message ?? e.reason ?? e.error
    if (typeof m === 'string' && m) return m
  }
  if (typeof err === 'string' && err) return err
  return 'Transaction failed.'
}

type Ethereum = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }

async function getChainId(eth: Ethereum): Promise<number> {
  const chainId = await eth.request({ method: 'eth_chainId' })
  if (typeof chainId !== 'string') throw new Error('Unable to read chain ID from wallet.')
  return Number(chainId)
}

async function getGasPrice(): Promise<string> {
  try {
    const res = await fetch(PRIMARY_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
    })
    const { result } = await res.json() as { result: string }
    // Double the current gas price for safety margin
    const doubled = (BigInt(result) * 2n).toString(16)
    return '0x' + doubled
  } catch {
    return '0x5F5E100' // 0.1 gwei fallback
  }
}

async function waitForReceipt(eth: Ethereum, hash: string): Promise<{ status: '0x1' | '0x0' }> {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const receipt = await eth.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as { status: '0x1' | '0x0' } | null
      if (receipt !== null) return receipt
    } catch { /* RPC hiccup — keep polling */ }
  }
  throw new Error('Transaction not confirmed after 2 minutes. Check Arbiscan.')
}
const PRIMARY_RPC = process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'

const ARBITRUM_SEPOLIA_PARAMS = {
  chainId: '0x66eee',
  chainName: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [
    PRIMARY_RPC,
    'https://arbitrum-sepolia-rpc.publicnode.com',
    'https://rpc.ankr.com/arbitrum_sepolia',
  ],
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
}

function getErrorCode(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'number') return code
    if (typeof code === 'string') return Number(code)
  }
  return undefined
}

async function ensureArbitrumSepolia(eth: Ethereum) {
  // Always try to update MetaMask's saved RPC to PRIMARY_RPC (Infura).
  // wallet_addEthereumChain silently updates the chain config if it already exists.
  try {
    await eth.request({ method: 'wallet_addEthereumChain', params: [ARBITRUM_SEPOLIA_PARAMS] })
  } catch { /* ignore — MetaMask rejects if chain unchanged or user dismisses */ }

  if (await getChainId(eth) === arbitrumSepolia.id) return

  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }] })
  } catch (err) {
    if (getErrorCode(err) !== 4902) throw err
    await eth.request({ method: 'wallet_addEthereumChain', params: [ARBITRUM_SEPOLIA_PARAMS] })
  }

  if (await getChainId(eth) !== arbitrumSepolia.id) {
    throw new Error('Switch your wallet to Arbitrum Sepolia (chain ID 421614).')
  }
}

function formatTransactionError(err: unknown): string {
  const msg = extractMsg(err)
  if (/RPC endpoint not found|RPC endpoint.*unavailable|wallet rpc|failed to fetch/i.test(msg)) {
    return `Wallet RPC unavailable. In MetaMask → Networks → Arbitrum Sepolia → Edit, paste RPC: ${PRIMARY_RPC}`
  }
  if (/user rejected|rejected the request|denied/i.test(msg)) {
    return 'Request rejected in wallet.'
  }
  return msg
}

declare global { interface Window { ethereum?: Ethereum } }

const ACTIVITY = [
  { date: '2026/03/18 14:22', type: 'Token Purchase' },
  { date: '2026/03/15 09:01', type: 'Rent Distribution' },
  { date: '2026/03/10 11:44', type: 'Token Purchase' },
]

type BuyStep = 'idle' | 'encrypting' | 'approving' | 'purchasing' | 'done' | 'error'

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = PROPERTIES.find(p => p.id === params.id) ?? PROPERTIES[0]
  const { isConnected, address } = useAccount()
  const { showToast } = useToast()
  const mapQuery = encodeURIComponent(property.location)

  const [amount, setAmount] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [buyStep, setBuyStep] = useState<BuyStep>('idle')

  const totalCost = amount ? (parseFloat(amount) * property.pricePerToken).toFixed(2) : '0.00'
  const buying   = buyStep !== 'idle' && buyStep !== 'done' && buyStep !== 'error'

  const handleBuy = async () => {
    const amountNumber = Number(amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return
    if (!Number.isInteger(amountNumber)) {
      showToast('Invalid amount', 'Enter a whole token amount.', 'error')
      return
    }
    if (!property.deployed) {
      showToast('Property unavailable', 'This property token contract is not deployed yet.', 'error')
      return
    }

    const eth = window.ethereum
    if (!eth) { showToast('No wallet', 'Install MetaMask to continue.', 'error'); return }
    if (!address) { showToast('Wallet not connected', 'Connect your wallet before buying.', 'error'); return }

    const tokenAmount = BigInt(amountNumber)
    if (tokenAmount > BigInt(property.availableTokens)) {
      showToast('Amount too high', `Only ${property.availableTokens.toLocaleString()} tokens are available.`, 'error')
      return
    }

    const priceUsdt6 = BigInt(Math.round(property.pricePerToken * 1_000_000))
    const totalCostUsdt = tokenAmount * priceUsdt6

    try {
      await ensureArbitrumSepolia(eth)
      setTxHash(undefined)

      // Step 1: Submit iExec task — returns taskid immediately
      setBuyStep('encrypting')
      showToast('iExec TEE', 'Submitting task to iExec network (Intel TDX TEE)…', 'info')

      const startRes = await fetch('/api/iexec-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAmount: tokenAmount.toString(), contractAddress: property.contractAddress, buyerAddress: address }),
      })
      const startJson = await startRes.json() as { taskid?: string; dealid?: string; error?: string }
      if (!startRes.ok || startJson.error) throw new Error(startJson.error ?? 'iExec task submission failed')
      const { taskid, dealid } = startJson as { taskid: string; dealid: string }

      // Poll until TEE computation completes (each call < 30s, Vercel-safe)
      let handle: `0x${string}` | undefined
      let handleProof: `0x${string}` | undefined
      for (let i = 0; i < 72; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const pollRes = await fetch(`/api/iexec-poll?taskid=${taskid}&dealid=${dealid}`)
        if (!pollRes.ok) continue
        const poll = await pollRes.json() as { status: string; handle?: string; handleProof?: string; error?: string }
        if (poll.status === 'failed') throw new Error(poll.error ?? 'iExec task failed in TEE worker')
        if (poll.status === 'completed' && poll.handle && poll.handleProof) {
          handle = poll.handle as `0x${string}`
          handleProof = poll.handleProof as `0x${string}`
          break
        }
      }
      if (!handle || !handleProof) throw new Error('iExec task timed out after 6 minutes.')

      // Step 2: Approve USDT (direct eth.request — no viem polling).
      setBuyStep('approving')
      showToast('Approve USDT', 'Step 1/2 — confirm USDT approval in your wallet.', 'info')

      const gasPrice = await getGasPrice()
      const approveData = encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [property.contractAddress as `0x${string}`, totalCostUsdt] })
      const approveTxHash = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: ADDRESSES.usdt, data: approveData, gasPrice }] }) as string
      const approveReceipt = await waitForReceipt(eth, approveTxHash)
      if (approveReceipt.status === '0x0') throw new Error('USDT approval reverted on-chain. Check your balance and try again.')

      // Step 3: Purchase tokens on-chain.
      setBuyStep('purchasing')
      showToast('Purchasing', 'Step 2/2 — confirm token purchase in your wallet.', 'info')

      const purchaseData = encodeFunctionData({ abi: PROPERTY_TOKEN_ABI, functionName: 'purchaseTokens', args: [handle, handleProof, tokenAmount] })
      const purchaseTxHash = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: property.contractAddress, data: purchaseData, gasPrice }] }) as string
      const purchaseReceipt = await waitForReceipt(eth, purchaseTxHash)
      if (purchaseReceipt.status === '0x0') throw new Error('Token purchase reverted on-chain.')

      setTxHash(purchaseTxHash as `0x${string}`)
      setBuyStep('done')
      setTxOpen(true)
      showToast('Tokens purchased!', `${amount} ${property.ticker} · Balance encrypted 🔒`, 'success')
      setAmount('')
    } catch (err) {
      setBuyStep('error')
      const msg = formatTransactionError(err)
      showToast('Transaction failed', msg.length > 120 ? msg.slice(0, 120) + '…' : msg, 'error')
    } finally {
      setTimeout(() => setBuyStep('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-8xl px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-body mb-8" style={{ color: 'var(--text-ghost)' }}>
          <Link href="/properties" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
            Properties
          </Link>
          <span>/</span>
          <span>{property.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 xl:gap-12">
          {/* LEFT — content */}
          <div>
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              {/* Hero image */}
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer mb-3"
                style={{ height: 'clamp(260px, 54vw, 420px)' }}
                onClick={() => setLightbox(true)}
              >
                <Image
                  src={property.images[activeImage]}
                  alt={property.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080810]/40 to-transparent" />
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-body" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--text-secondary)' }}>
                  Click to expand
                </div>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="relative rounded-lg overflow-hidden flex-shrink-0 transition-all duration-150"
                    style={{
                      width: '80px',
                      height: '60px',
                      border: `2px solid ${activeImage === i ? 'var(--gold-primary)' : 'transparent'}`,
                    }}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Property header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-body uppercase tracking-widest"
                  style={{
                    background: property.status === 'active' ? 'rgba(0,229,160,0.1)' : 'rgba(224,85,85,0.1)',
                    color: property.status === 'active' ? 'var(--nox-green)' : 'var(--status-error)',
                    border: `1px solid ${property.status === 'active' ? 'rgba(0,229,160,0.2)' : 'rgba(224,85,85,0.2)'}`,
                  }}
                >
                  {property.status === 'active' ? 'Active Offering' : 'Sold Out'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-body uppercase tracking-widest" style={{ border: '1px solid var(--border-subtle)', color: 'var(--gold-primary)' }}>
                  {property.ticker}
                </span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl" style={{ color: 'var(--text-primary)' }}>
                    {property.name}
                  </h1>
                  <p className="text-xs font-body mt-2 uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
                    Confidential Token Offering
                  </p>
                </div>
                <ConfidentialBadge />
              </div>
              <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                📍 {property.location}
              </p>
              <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {property.description}
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden mb-8"
              style={{ background: 'var(--border-subtle)' }}
            >
              {[
                { label: 'Property Value', value: `$${(property.value / 1000).toFixed(0)}K` },
                { label: 'Total Tokens', value: `${(property.totalTokens / 1000).toFixed(0)}K` },
                { label: 'Per Token', value: `$${property.pricePerToken.toFixed(2)}` },
                { label: 'Est. Yield', value: `${property.yield}%` },
              ].map(s => (
                <div key={s.label} className="px-5 py-4" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs font-body mb-1" style={{ color: 'var(--text-ghost)' }}>{s.label}</p>
                  <p className="font-data text-xl" style={{ color: 'var(--gold-primary)' }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>About</h2>
              <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {property.description} This property is managed by a professional SPV (Special Purpose Vehicle) structure,
                ensuring clear legal ownership and income distribution to all token holders. All rental income is distributed
                monthly via the ERC-7984 confidential token standard — powered by iExec Nox TEE technology.
              </p>
            </motion.div>

            {/* NFT Metadata card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.23 }}
              className="mb-8 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}
            >
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🖼️</span>
                  <span className="font-display text-sm" style={{ color: 'var(--gold-primary)' }}>NFT Metadata</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-body uppercase tracking-wider"
                    style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)' }}
                  >
                    {property.tokenStandard}
                  </span>
                </div>
                {/* Metadata served by our own API — no fake IPFS link */}
                <a
                  href={`/api/nft/${property.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-body transition-opacity hover:opacity-70"
                  style={{ color: 'var(--gold-primary)' }}
                >
                  ↗ View Metadata JSON
                </a>
              </div>
              <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                {[
                  { label: 'Token ID',   value: `#${property.tokenId}` },
                  { label: 'Standard',   value: property.tokenStandard },
                  { label: 'Chain',      value: 'Arbitrum Sepolia' },
                  { label: 'Contract',   value: property.deployed ? `${property.contractAddress.slice(0, 8)}…` : 'Pending' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3" style={{ background: 'rgba(8,8,16,0.6)' }}>
                    <p className="mb-1 text-[9px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>{label}</p>
                    <p className="font-data text-xs" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                {property.deployed ? (
                  <>
                    <span className="text-[10px] font-data" style={{ color: 'var(--text-ghost)' }}>
                      {property.contractAddress.slice(0, 14)}…{property.contractAddress.slice(-8)}
                    </span>
                    <a
                      href={`https://sepolia.arbiscan.io/token/${property.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-body transition-opacity hover:opacity-70"
                      style={{ color: 'var(--gold-primary)' }}
                    >
                      ↗ Arbiscan
                    </a>
                  </>
                ) : (
                  <span
                    className="text-[10px] font-body rounded px-2 py-0.5"
                    style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--text-ghost)', border: '1px solid rgba(212,175,55,0.15)' }}
                  >
                    ⏳ Contract deployment pending
                  </span>
                )}
              </div>
            </motion.div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>Legal Documents</h2>
                <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  {property.documents.length} files · pending IPFS pin
                </span>
              </div>
              <div className="space-y-2">
                {property.documents.map(doc => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">📄</span>
                      <div>
                        <p className="text-xs font-body" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                        <p className="text-[10px] font-data mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                          {doc.cid.slice(0, 14)}… · {doc.size}
                        </p>
                      </div>
                    </div>
                    {doc.pinned ? (
                      <a
                        href={`https://ipfs.io/ipfs/${doc.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body transition-opacity hover:opacity-70 shrink-0"
                        style={{ color: 'var(--gold-primary)' }}
                      >
                        ↗ IPFS
                      </a>
                    ) : (
                      <span
                        className="text-[10px] font-body rounded px-2 py-0.5 shrink-0"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-ghost)', border: '1px solid var(--border-subtle)' }}
                      >
                        Pinning soon
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Location map */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>Location Map</h2>
                <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  Dark map preview
                </span>
              </div>
              <div className="surface-panel rounded-xl overflow-hidden">
                <iframe
                  title={`${property.name} location map`}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>

            {/* Transaction history */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <div className="h-px" style={{ background: 'var(--border-visible)' }} />
                {ACTIVITY.map((a, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                      <span className="text-xs font-data" style={{ color: 'var(--text-ghost)' }}>{a.date}</span>
                      <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>{a.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>•••• tokens</span>
                      <ConfidentialBadge size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT — buy panel (sticky) */}
          <div className="lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <h2 className="font-display text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Buy Tokens</h2>
              <div className="h-px my-4" style={{ background: 'var(--border-subtle)' }} />

              <div className="mb-4">
                <p className="text-xs font-body mb-1" style={{ color: 'var(--text-ghost)' }}>Available</p>
                <p className="text-sm font-data" style={{ color: 'var(--gold-primary)' }}>
                  {property.availableTokens.toLocaleString()} tokens
                </p>
              </div>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-xs font-body mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Funded</span>
                  <span style={{ color: 'var(--gold-primary)' }}>{property.funded}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${property.funded}%` }} />
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-body mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Amount (tokens)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={property.availableTokens}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded text-sm font-data bg-transparent focus:outline-none"
                    style={{
                      border: '1px solid var(--border-visible)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-visible)')}
                    aria-label="Number of tokens to purchase"
                  />
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-body mb-1" style={{ color: 'var(--text-ghost)' }}>You pay</p>
                  <p className="font-data text-xl" style={{ color: 'var(--text-primary)' }}>${totalCost} <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>USDT</span></p>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--nox-green-dim)', border: '1px solid rgba(0,229,160,0.2)' }}>
                  <span className="text-sm">🔒</span>
                  <div>
                    <p className="text-xs font-body" style={{ color: 'var(--nox-green)' }}>Est. monthly income</p>
                    <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--text-secondary)' }}>Private after purchase</p>
                  </div>
                </div>
              </div>

              {!isConnected ? (
                <div className="space-y-3">
                  <WalletButton />
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                    <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>or</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  </div>
                  <button className="w-full py-2.5 px-4 rounded text-sm font-body btn-ghost">
                    Buy with Fiat →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleBuy}
                    disabled={
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      property.status === 'sold_out' ||
                      buying
                    }
                    className="w-full py-3 px-4 rounded text-sm btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {property.status === 'sold_out'
                      ? 'Sold Out'
                      : buyStep === 'encrypting'
                        ? '🔒 Encrypting...'
                        : buyStep === 'approving'
                          ? '⏳ Approving USDT...'
                          : buyStep === 'purchasing'
                            ? '⏳ Purchasing...'
                            : '🔒 Encrypt & Buy'}
                  </button>
                  <button className="w-full py-2.5 px-4 rounded text-sm font-body btn-ghost">
                    Buy with Fiat →
                  </button>
                </div>
              )}

              <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-sm">⚡</span>
                <div className="w-full">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>Powered by iExec Nox</p>
                    <span
                      className="rounded-full px-2 py-1 text-[9px] font-body uppercase tracking-[0.24em]"
                      style={{
                        background: 'rgba(0,229,160,0.08)',
                        border: '1px solid rgba(0,229,160,0.2)',
                        color: 'var(--nox-green)',
                      }}
                    >
                      TEE ready
                    </span>
                  </div>
                  <p className="text-[10px] font-body mt-1" style={{ color: 'var(--text-ghost)' }}>
                    Buy flow encrypts token amount via iExec Nox TEE before on-chain settlement.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setLightbox(false)}
          >
            <div className="relative max-w-4xl w-full" style={{ height: '80vh' }}>
              <Image src={property.images[activeImage]} alt={property.name} fill className="object-contain" sizes="100vw" />
            </div>
            <button
              className="absolute top-4 right-4 text-2xl"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionModal isOpen={txOpen} onClose={() => setTxOpen(false)} txHash={txHash} />
    </div>
  )
}
