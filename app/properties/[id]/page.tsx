'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { ConfidentialBadge } from '../../components/ui/ConfidentialBadge'
import { TransactionModal } from '../../components/ui/TransactionModal'
import { useToast } from '../../components/ui/Toast'
import { WalletButton } from '../../components/web3/WalletButton'
import { useNoxHandleClient } from '../../components/web3/useNoxHandleClient'
import { PROPERTIES } from '../../lib/propertiesData'

const ACTIVITY = [
  { date: '2026/03/18 14:22', type: 'Token Purchase' },
  { date: '2026/03/15 09:01', type: 'Rent Distribution' },
  { date: '2026/03/10 11:44', type: 'Token Purchase' },
]

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = PROPERTIES.find(p => p.id === params.id) ?? PROPERTIES[0]
  const { isConnected } = useAccount()
  const { showToast } = useToast()
  const { handleClient, status: handleStatus, error: handleError } = useNoxHandleClient()
  const mapQuery = encodeURIComponent(property.location)

  const [amount, setAmount] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  const [step, setStep] = useState(0) // 0=idle 1=encrypting 2=sending 3=tee

  const totalCost = amount ? (parseFloat(amount) * property.pricePerToken).toFixed(2) : '0.00'

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    if (!handleClient) {
      showToast(
        'Nox handle client not ready',
        handleStatus === 'initializing'
          ? 'Waiting for the iExec Nox SDK to initialize on Arbitrum Sepolia.'
          : handleError ?? 'Reconnect your wallet to prepare confidential inputs.',
        'warning'
      )
      return
    }

    try {
      const tokenAmount = BigInt(Math.max(1, Math.trunc(Number(amount))))
      const encryptedPayload = await handleClient.encryptInput(
        tokenAmount,
        'uint256',
        property.contractAddress as `0x${string}`
      )

      showToast(
        'Encrypted payload prepared',
        `Handle ${encryptedPayload.handle.slice(0, 10)}... ready for ${property.ticker}.`,
        'info'
      )
    } catch (error) {
      showToast(
        'Nox encryption failed',
        error instanceof Error ? error.message : 'Unable to encrypt the confidential token amount.',
        'error'
      )
      return
    }

    setTxOpen(true)
    setTimeout(() => {
      setTxOpen(false)
      showToast('Tokens purchased successfully!', 'Balance updated · 🔒 Confidential', 'success')
      setAmount('')
    }, 6500)
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

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>Documents</h2>
                <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  {property.documents.length} files on IPFS
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
                      <span className="text-xs font-body" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                    </div>
                    <a
                      href={`https://ipfs.io/ipfs/${doc.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-body transition-opacity hover:opacity-70"
                      style={{ color: 'var(--gold-primary)' }}
                    >
                      ↗ IPFS
                    </a>
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
                    disabled={!amount || parseFloat(amount) <= 0 || property.status === 'sold_out'}
                    className="w-full py-3 px-4 rounded text-sm btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {property.status === 'sold_out' ? 'Sold Out' : '🔒 Encrypt & Buy'}
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
                        background: handleStatus === 'ready' ? 'rgba(0,229,160,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${handleStatus === 'ready' ? 'rgba(0,229,160,0.2)' : 'var(--border-subtle)'}`,
                        color: handleStatus === 'ready' ? 'var(--nox-green)' : 'var(--text-secondary)',
                      }}
                    >
                      {handleStatus === 'ready' ? 'SDK ready' : handleStatus === 'initializing' ? 'SDK loading' : 'SDK idle'}
                    </span>
                  </div>
                  <p className="text-[10px] font-body mt-1" style={{ color: 'var(--text-ghost)' }}>
                    {handleStatus === 'ready'
                      ? 'Buy flow now prepares confidential inputs with @iexec-nox/handle before settlement.'
                      : 'Connect on Arbitrum Sepolia to initialize the official iExec Nox handle client.'}
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

      <TransactionModal isOpen={txOpen} onClose={() => setTxOpen(false)} txHash="0x7f3a1b2c4d5e6f7890abcdef1234567890abcd" />
    </div>
  )
}
