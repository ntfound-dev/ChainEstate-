'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientAccount as useAccount } from '../components/web3/useClientAccount'
import { WalletButton } from '../components/web3/WalletButton'
import { useToast } from '../components/ui/Toast'
import {
  TOKEN_PRICES, CEST_MARKET_CAP,
  TIER_BENEFITS, TIER_THRESHOLDS, TIER_MINT_COSTS,
} from '../lib/contracts'

// Official ChainEstate social handles
const SOCIALS = {
  twitter:  { handle: '@ChainEstatee',          url: 'https://x.com/ChainEstatee'                     },
  github:   { handle: 'ntfound-dev/ChainEstate-', url: 'https://github.com/ntfound-dev/ChainEstate-'  },
  telegram: { handle: 't.me/+WDbtaMWs-_1lYmRl',  url: 'https://t.me/+WDbtaMWs-_1lYmRl'              },
}

const TOTAL_AIRDROP = '250,000,000'
const SNAPSHOT_DATE = 'May 20, 2026'
const CLAIM_DATE    = 'Jun 01, 2026'
const CEST_PRICE    = TOKEN_PRICES.CEST

interface Task {
  id: string
  label: string
  description: string
  points: number
  icon: string
  type: 'wallet' | 'twitter' | 'github' | 'telegram'
}

const TASKS: Task[] = [
  {
    id: 'wallet',
    label: 'Connect Wallet',
    description: 'Connect a wallet on Arbitrum Sepolia to register your address.',
    points: 500,
    icon: '🔗',
    type: 'wallet',
  },
  {
    id: 'twitter',
    label: 'Follow on Twitter / X',
    description: `Follow ${SOCIALS.twitter.handle} and enter your handle to verify.`,
    points: 1500,
    icon: '𝕏',
    type: 'twitter',
  },
  {
    id: 'github',
    label: 'Star on GitHub',
    description: `Star the ntfound-dev/ChainEstate- repository and enter your GitHub username.`,
    points: 1000,
    icon: '⭐',
    type: 'github',
  },
  {
    id: 'telegram',
    label: 'Join Telegram',
    description: `Join ${SOCIALS.telegram.handle} and enter your Telegram username.`,
    points: 1000,
    icon: '✈️',
    type: 'telegram',
  },
]

const TOTAL_POINTS = TASKS.reduce((s, t) => s + t.points, 0)

// On-chain interaction bonus points (earned by using the protocol during testnet)
const INTERACTION_POINTS = [
  { action: 'Purchase property tokens',  pts: 2000 },
  { action: 'Execute secondary market buy', pts: 1500 },
  { action: 'Cast governance vote',      pts:  800 },
  { action: 'List on secondary market',  pts:  500 },
  { action: 'Direct token transfer',     pts:  300 },
]

function tierFromCest(bal: number) {
  if (bal >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM' as const
  if (bal >= TIER_THRESHOLDS.GOLD)     return 'GOLD'     as const
  if (bal >= TIER_THRESHOLDS.SILVER)   return 'SILVER'   as const
  if (bal >= TIER_THRESHOLDS.BRONZE)   return 'BRONZE'   as const
  return null
}

function pointsToCest(pts: number, multiplierBps = 100): number {
  // Linear: full 4000 social pts → 5000 CEST base; then multiply by tier
  const base = Math.round((pts / TOTAL_POINTS) * 5000)
  return Math.round((base * multiplierBps) / 100)
}

const STORAGE_KEY = 'ce_airdrop_v1'

interface StoredState {
  twitter?: string
  github?: string
  telegram?: string
  verified: Record<string, boolean>
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { verified: {} }
  } catch {
    return { verified: {} }
  }
}

function saveState(s: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch { /* ignore */ }
}

export default function AirdropPage() {
  const { address, isConnected } = useAccount()
  const { showToast } = useToast()

  const [stored, setStored] = useState<StoredState>({ verified: {} })
  const [inputs, setInputs]   = useState({ twitter: '', github: '', telegram: '' })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const s = loadState()
    setStored(s)
    setInputs({ twitter: s.twitter ?? '', github: s.github ?? '', telegram: s.telegram ?? '' })
    setHydrated(true)
  }, [])

  const setInput = (field: 'twitter' | 'github' | 'telegram', value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  const verify = (taskId: string) => {
    const next: StoredState = {
      ...stored,
      twitter:  inputs.twitter  || stored.twitter,
      github:   inputs.github   || stored.github,
      telegram: inputs.telegram || stored.telegram,
      verified: { ...stored.verified, [taskId]: true },
    }

    // Validate social handle was entered for non-wallet tasks
    const task = TASKS.find((t) => t.id === taskId)!
    if (task.type !== 'wallet') {
      const val = inputs[task.type as 'twitter' | 'github' | 'telegram']
      if (!val.trim()) {
        showToast('Handle required', 'Enter your username before verifying.', 'warning')
        return
      }
    }

    setStored(next)
    saveState(next)
    showToast('Task verified!', `+${task.points.toLocaleString()} pts recorded.`, 'success')
  }

  const openAndVerify = (task: Task) => {
    if (task.type === 'twitter')  window.open(SOCIALS.twitter.url, '_blank')
    if (task.type === 'github')   window.open(SOCIALS.github.url, '_blank')
    if (task.type === 'telegram') window.open(SOCIALS.telegram.url, '_blank')
  }

  // Compute points
  const walletDone = isConnected
  const earnedPoints =
    (walletDone ? 500 : 0) +
    (stored.verified['twitter']  ? 1500 : 0) +
    (stored.verified['github']   ? 1000 : 0) +
    (stored.verified['telegram'] ? 1000 : 0)

  // Tier multiplier — derived from stored CEST balance (demo: read from localStorage)
  // In production this reads from TierNFT.airdropMultiplierBps(address) on-chain
  const [cestBal, setCestBal] = useState<number>(0)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ce_demo_cest_bal')
      if (raw) setCestBal(Number(raw))
    } catch { /* ignore */ }
  }, [])

  const tierKey       = tierFromCest(cestBal)
  const tierBenefits  = tierKey ? TIER_BENEFITS[tierKey] : null
  const multiplierBps = tierBenefits ? tierBenefits.multiplierBps : 100

  const cest = pointsToCest(earnedPoints, multiplierBps)
  const tasksCompleted = [
    walletDone,
    !!stored.verified['twitter'],
    !!stored.verified['github'],
    !!stored.verified['telegram'],
  ].filter(Boolean).length

  if (!hydrated) return null

  return (
    <div className="min-h-screen pb-24 pt-28">
      <div className="mx-auto max-w-3xl px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <p className="mb-3 text-5xl">🪂</p>
          <h1 className="mb-2 font-display text-4xl tracking-wide shimmer-text">
            CEST Genesis Airdrop
          </h1>
          <p className="mx-auto max-w-lg text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Complete tasks to earn your allocation from the 250M CEST community airdrop pool.
            Snapshot on {SNAPSHOT_DATE} — claim opens {CLAIM_DATE}.
          </p>
        </motion.div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            {
              label: 'CEST Price',
              value: `$${CEST_PRICE.toFixed(2)}`,
              sub: `$${(CEST_MARKET_CAP / 1_000_000).toFixed(0)}M mkt cap`,
            },
            {
              label: 'Airdrop Pool',
              value: `${TOTAL_AIRDROP} CEST`,
              sub: `$${((250_000_000 * CEST_PRICE) / 1_000_000).toFixed(0)}M value`,
            },
            {
              label: 'Snapshot',
              value: SNAPSHOT_DATE,
              sub: `Claim: ${CLAIM_DATE}`,
            },
            {
              label: 'Your Allocation',
              value: cest > 0 ? `${cest.toLocaleString()} CEST` : '—',
              sub: cest > 0 ? `≈ $${(cest * CEST_PRICE).toFixed(2)}` : 'Complete tasks',
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <p className="mb-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                {label}
              </p>
              <p className="font-data text-sm font-semibold leading-tight" style={{ color: 'var(--gold-primary)' }}>
                {value}
              </p>
              <p className="mt-1 text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>
                {sub}
              </p>
            </div>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* ── Task list ── */}
          <div className="space-y-4">
            <p className="text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>
              Social Tasks — {tasksCompleted}/{TASKS.length} complete
            </p>

            {TASKS.map((task, i) => {
              const isWallet   = task.type === 'wallet'
              const done       = isWallet ? walletDone : !!stored.verified[task.id]
              const inputField = task.type as 'twitter' | 'github' | 'telegram'
              const inputVal   = isWallet ? '' : inputs[inputField]

              const placeholder: Record<string, string> = {
                twitter:  '@yourhandle',
                github:   'yourusername',
                telegram: '@yourusername',
              }

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="rounded-xl p-5"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${done ? 'rgba(0,229,160,0.3)' : 'var(--border-visible)'}`,
                    transition: 'border-color 0.3s',
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                        style={{
                          background: done ? 'var(--nox-green-dim)' : 'var(--bg-elevated)',
                          border: `1px solid ${done ? 'rgba(0,229,160,0.3)' : 'var(--border-subtle)'}`,
                        }}
                      >
                        {done ? '✓' : task.icon}
                      </div>
                      <div>
                        <p className="font-display text-sm" style={{ color: done ? 'var(--nox-green)' : 'var(--text-primary)' }}>
                          {task.label}
                        </p>
                        <p className="text-xs font-body mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded px-2 py-1 text-[10px] font-data"
                      style={{
                        background: done ? 'var(--nox-green-dim)' : 'var(--bg-elevated)',
                        color:      done ? 'var(--nox-green)'    : 'var(--text-ghost)',
                        border: `1px solid ${done ? 'rgba(0,229,160,0.2)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      +{task.points.toLocaleString()} pts
                    </span>
                  </div>

                  {!done && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        {isWallet ? (
                          <WalletButton />
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={inputVal}
                                onChange={(e) => setInput(inputField, e.target.value)}
                                placeholder={placeholder[task.type]}
                                className="flex-1 rounded px-3 py-2 text-xs font-data bg-transparent focus:outline-none"
                                style={{ border: '1px solid var(--border-visible)', color: 'var(--text-primary)' }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-primary)')}
                                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-visible)')}
                              />
                              <button
                                onClick={() => openAndVerify(task)}
                                className="rounded px-3 py-2 text-xs font-body transition-opacity hover:opacity-80"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-visible)' }}
                              >
                                {task.type === 'twitter' ? 'Follow →' : task.type === 'github' ? 'Star →' : 'Join →'}
                              </button>
                            </div>
                            <button
                              onClick={() => verify(task.id)}
                              disabled={!inputVal.trim()}
                              className="w-full rounded px-4 py-2.5 text-xs font-body font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                background: 'var(--gold-primary)',
                                color: '#080810',
                              }}
                            >
                              Verify & Claim Points
                            </button>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )
            })}
            {/* On-chain interaction points */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(0,229,160,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⚡</span>
                <div>
                  <p className="font-display text-sm" style={{ color: 'var(--nox-green)' }}>
                    On-Chain Interaction Points
                  </p>
                  <p className="text-xs font-body mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Earn bonus points by using ChainEstate on testnet. Multiplied by your tier badge.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {INTERACTION_POINTS.map(({ action, pts }) => (
                  <div key={action} className="flex items-center justify-between text-xs font-body">
                    <span style={{ color: 'var(--text-secondary)' }}>→ {action}</span>
                    <span className="font-data" style={{ color: 'var(--nox-green)' }}>
                      +{pts.toLocaleString()} pts
                      {tierBenefits ? ` × ${tierBenefits.multiplierBps / 100}` : ''}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-body leading-snug" style={{ color: 'var(--text-ghost)' }}>
                Points are recorded on-chain by the operator after verifying your transactions.
                Snapshot on {SNAPSHOT_DATE}.
              </p>
            </motion.div>
          </div>

          {/* ── Allocation sidebar ── */}
          <div className="space-y-4">

            {/* Score card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl p-5 lg:sticky lg:top-24"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <p className="mb-4 text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Your Score
              </p>

              {/* Progress ring (simple bar) */}
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs font-body">
                  <span style={{ color: 'var(--text-secondary)' }}>Points earned</span>
                  <span className="font-data" style={{ color: 'var(--gold-primary)' }}>
                    {earnedPoints.toLocaleString()} / {TOTAL_POINTS.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--gold-primary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(earnedPoints / TOTAL_POINTS) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {TASKS.map((task) => {
                  const done = task.type === 'wallet' ? walletDone : !!stored.verified[task.id]
                  return (
                    <div key={task.id} className="flex items-center justify-between text-xs font-body">
                      <span style={{ color: done ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
                        {done ? '✓' : '○'} {task.label}
                      </span>
                      <span
                        className="font-data"
                        style={{ color: done ? 'var(--nox-green)' : 'var(--text-ghost)' }}
                      >
                        {done ? `+${task.points.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div
                className="rounded-lg p-4 text-center"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                <p className="mb-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  Estimated Allocation
                </p>
                <p className="font-data text-2xl font-bold" style={{ color: 'var(--gold-primary)' }}>
                  {cest > 0 ? cest.toLocaleString() : '0'}
                </p>
                <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>CEST tokens</p>
                {cest > 0 && (
                  <p className="mt-1 font-data text-sm" style={{ color: 'var(--nox-green)' }}>
                    ≈ ${(cest * CEST_PRICE).toFixed(2)} USD
                  </p>
                )}
                <p className="mt-2 text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>
                  @ ${CEST_PRICE.toFixed(2)} / CEST
                </p>
              </div>

              {/* Tier multiplier row */}
              <div
                className="rounded-lg px-3 py-2.5 flex items-center justify-between"
                style={{
                  background: tierBenefits ? 'rgba(212,175,55,0.06)' : 'var(--bg-elevated)',
                  border: `1px solid ${tierBenefits ? 'rgba(212,175,55,0.25)' : 'var(--border-subtle)'}`,
                }}
              >
                <div>
                  <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Tier Multiplier
                  </p>
                  {tierBenefits ? (
                    <p className="text-xs font-data font-semibold mt-0.5" style={{ color: 'var(--gold-primary)' }}>
                      {tierBenefits.emoji} {tierBenefits.label} · {tierBenefits.multiplierBps / 100}×
                    </p>
                  ) : (
                    <p className="text-xs font-data mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                      1× — mint a Tier Badge to boost
                    </p>
                  )}
                </div>
                {!tierBenefits && isConnected && (
                  <a
                    href="/faucet"
                    className="text-[10px] font-body px-2 py-1 rounded transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.2)' }}
                  >
                    Get CEST
                  </a>
                )}
              </div>

              {address && (
                <p className="mt-1 text-center text-[10px] font-data truncate" style={{ color: 'var(--text-ghost)' }}>
                  {address}
                </p>
              )}

              <button
                disabled
                className="mt-4 w-full rounded px-4 py-3 text-sm font-body font-medium cursor-not-allowed opacity-40"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-visible)' }}
              >
                Claim opens {CLAIM_DATE}
              </button>
            </motion.div>

            {/* Tier badge CTA */}
            {tierBenefits && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                <p className="text-[10px] font-body uppercase tracking-widest mb-2" style={{ color: 'var(--text-ghost)' }}>
                  Tier Badge NFT
                </p>
                <p className="text-xs font-body leading-snug mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Mint your {tierBenefits.emoji} {tierBenefits.label} badge to lock in
                  the {tierBenefits.multiplierBps / 100}× airdrop multiplier and
                  get a {tierBenefits.discount}% platform fee discount.
                  Costs {TIER_MINT_COSTS[tierKey!].toLocaleString()} CEST (burned → treasury).
                </p>
                <div className="text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>
                  Contract: TierNFT · deploying soon
                </div>
              </motion.div>
            )}

            {/* Official links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="mb-3 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Official Links
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Twitter / X',   href: SOCIALS.twitter.url,   icon: '𝕏', handle: SOCIALS.twitter.handle },
                  { label: 'GitHub',         href: SOCIALS.github.url,    icon: '⭐', handle: SOCIALS.github.handle },
                  { label: 'Telegram',       href: SOCIALS.telegram.url,  icon: '✈️', handle: SOCIALS.telegram.handle },
                ].map(({ label, href, icon, handle }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-body transition-opacity hover:opacity-80"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-sm w-5 text-center">{icon}</span>
                    <span className="flex-1">{label}</span>
                    <span className="font-data text-[10px]" style={{ color: 'var(--text-ghost)' }}>{handle}</span>
                    <span style={{ color: 'var(--gold-primary)' }}>↗</span>
                  </a>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 rounded-xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="mb-4 text-xs font-display uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            How the Airdrop Works
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <p className="mb-1 font-display text-sm" style={{ color: 'var(--gold-primary)' }}>1. Earn Points</p>
              <p>Complete tasks on this page before the snapshot on {SNAPSHOT_DATE}. Each task adds points to your allocation.</p>
            </div>
            <div>
              <p className="mb-1 font-display text-sm" style={{ color: 'var(--gold-primary)' }}>2. Snapshot</p>
              <p>We record your wallet address and task completion on {SNAPSHOT_DATE}. No action needed from you on that day.</p>
            </div>
            <div>
              <p className="mb-1 font-display text-sm" style={{ color: 'var(--gold-primary)' }}>3. Claim CEST</p>
              <p>The claim window opens {CLAIM_DATE}. Visit this page and click Claim — CEST transfers directly to your wallet.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
