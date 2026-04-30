'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { ConfidentialBadge } from './components/ui/ConfidentialBadge'
import { PropertyCard } from './components/ui/PropertyCard'
import { PROPERTIES } from './lib/propertiesData'

// ─── helpers ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return { ref, count }
}

function StatItem({
  label, value, prefix = '', suffix = '', divisor = 1,
}: { label: string; value: number; prefix?: string; suffix?: string; divisor?: number }) {
  const { ref, count } = useCountUp(value)
  const display = divisor > 1 ? (count / divisor).toFixed(1) : count >= 1_000_000
    ? `${(count / 1_000_000).toFixed(1)}M`
    : count >= 1_000 ? `${(count / 1_000).toFixed(1)}K` : count.toString()

  return (
    <div ref={ref} className="text-center px-6 py-6">
      <p className="font-data text-2xl md:text-3xl mb-1" style={{ color: 'var(--gold-primary)' }}>
        {prefix}{display}{suffix}
      </p>
      <p className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}

function FloatingPropertyCard({ style, name, location, yieldPct, image }: {
  style: React.CSSProperties; name: string; location: string; yieldPct: number; image: string
}) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', width: '220px', ...style }}
    >
      <div className="relative h-28">
        <Image src={image} alt={name} fill className="object-cover" sizes="220px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a]/80 to-transparent" />
        <div className="absolute top-2 right-2">
          <ConfidentialBadge size="sm" />
        </div>
      </div>
      <div className="p-3">
        <p className="font-display text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="text-[10px] font-body mb-2" style={{ color: 'var(--text-secondary)' }}>📍 {location}</p>
        <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>{yieldPct}% APY</p>
      </div>
    </div>
  )
}

const TECH_PILLARS = [
  {
    icon: '🔐',
    label: 'Intel TDX TEE',
    tag: 'iExec Nox',
    desc: 'Your trade amounts are computed inside a hardware-sealed Intel TDX enclave. Not claimed. Provably private.',
    color: 'var(--nox-green)',
    dim: 'var(--nox-green-dim)',
    border: 'rgba(0,229,160,0.2)',
  },
  {
    icon: '🪙',
    label: 'ERC-7984 Token',
    tag: 'Confidential',
    desc: 'Encrypted balance standard. Your portfolio size is numerically sealed on-chain — not just hidden behind a UI.',
    color: 'var(--gold-primary)',
    dim: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.2)',
  },
  {
    icon: '⚡',
    label: 'Arbitrum Sepolia',
    tag: 'L2 Speed',
    desc: 'Ethereum-secured L2 with sub-second finality. Property trades settle in seconds, not days.',
    color: '#7B8CDE',
    dim: 'rgba(123,140,222,0.08)',
    border: 'rgba(123,140,222,0.2)',
  },
  {
    icon: '🤖',
    label: 'ChainGPT AI',
    tag: 'Built-in',
    desc: 'AI-powered real estate advisor embedded directly in the platform. Ask anything, anytime.',
    color: '#E29CD2',
    dim: 'rgba(226,156,210,0.08)',
    border: 'rgba(226,156,210,0.2)',
  },
]

const COMPARISON_ROWS = [
  { label: 'Portfolio balance',  without: '👁 Public on-chain',   with: '🔒 Encrypted in TEE' },
  { label: 'Rental income',     without: '👁 Anyone can see',    with: '🔒 Only you know' },
  { label: 'Trade amounts',     without: '👁 Fully traceable',   with: '🔒 Confidential compute' },
  { label: 'MEV exposure',      without: '⚠️ Front-run risk',    with: '✅ TEE-protected' },
  { label: 'Whale surveillance',without: '⚠️ Visible to all',    with: '✅ Zero information leak' },
  { label: 'Institutional use', without: '❌ Compliance risk',   with: '✅ Enterprise-ready' },
]

function PrivacyComparisonCard({ label, without, withPrivacy }: {
  label: string; without: string; withPrivacy: string
}) {
  return (
    <div className="surface-panel rounded-xl p-4">
      <p className="text-[10px] font-body uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--text-ghost)' }}>
        {label}
      </p>
      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-lg p-3" style={{ background: 'rgba(224,85,85,0.05)', border: '1px solid rgba(224,85,85,0.12)' }}>
          <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--status-error)' }}>Others</p>
          <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>{without}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.16)' }}>
          <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--nox-green)' }}>ChainEstate</p>
          <p className="text-xs font-body" style={{ color: 'var(--text-primary)' }}>{withPrivacy}</p>
        </div>
      </div>
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="mx-auto max-w-8xl w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Tech badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 mb-6"
            >
              {[
                { label: 'Intel TDX TEE', color: 'var(--nox-green)', bg: 'var(--nox-green-dim)', border: 'rgba(0,229,160,0.25)' },
                { label: 'iExec Nox',      color: 'var(--nox-green)', bg: 'var(--nox-green-dim)', border: 'rgba(0,229,160,0.25)' },
                { label: 'ERC-7984',       color: 'var(--gold-primary)', bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.2)' },
                { label: 'Arbitrum',       color: '#7B8CDE', bg: 'rgba(123,140,222,0.08)', border: 'rgba(123,140,222,0.2)' },
              ].map(({ label, color, bg, border }) => (
                <span
                  key={label}
                  className="rounded-full px-2.5 py-1 text-[10px] font-body uppercase tracking-wider"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                >
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6"
            >
              <span style={{ color: 'var(--text-primary)' }}>Real Estate.</span>
              <br />
              <span style={{ color: 'var(--text-primary)' }}>Fractionalized.</span>
              <br />
              <span className="shimmer-text">Encrypted.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-base font-body mb-3 max-w-lg leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Others{' '}
              <em style={{ color: 'var(--status-error)', fontStyle: 'normal' }}>claim</em>{' '}
              privacy. We use{' '}
              <strong style={{ color: 'var(--nox-green)', fontWeight: 500 }}>Intel TDX Trusted Execution Environment</strong>{' '}
              — the only way to provably encrypt your property portfolio on-chain.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              className="text-sm font-body mb-10 max-w-md"
              style={{ color: 'var(--text-ghost)' }}
            >
              Your balances. Your income. Your trades. Sealed in hardware.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/properties">
                <button className="px-6 py-3 rounded text-sm btn-gold">Explore Properties</button>
              </Link>
              <Link href="/airdrop">
                <button
                  className="px-6 py-3 rounded text-sm font-body font-medium transition-all hover:opacity-90"
                  style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--nox-green)', border: '1px solid rgba(0,229,160,0.3)' }}
                >
                  🪂 Claim Airdrop
                </button>
              </Link>
              <Link href="#how-it-works">
                <button className="px-6 py-3 rounded text-sm btn-ghost">How It Works</button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative flex justify-center items-center min-h-[340px]"
          >
            <div className="relative w-full max-w-sm flex justify-center">
              <motion.div
                animate={{ y: [-8, 0, -8] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                className="relative z-10"
              >
                <FloatingPropertyCard
                  name="The Pearl Residences" location="Dubai, UAE" yieldPct={6.8}
                  image={PROPERTIES[0].image} style={{ transform: 'rotate(-3deg)' }}
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-10 right-2 z-20"
              >
                <FloatingPropertyCard
                  name="Marina Heights" location="Singapore" yieldPct={7.2}
                  image={PROPERTIES[2].image} style={{ transform: 'rotate(2deg)' }}
                />
              </motion.div>
              {/* Glow orb */}
              <div
                className="absolute inset-0 -z-10 rounded-full opacity-20 blur-3xl"
                style={{ background: 'var(--gold-primary)', transform: 'scale(0.7)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--gold-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="mx-auto max-w-8xl">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Total Value Locked',   value: 2640000, prefix: '$' },
              { label: 'Active Investors',      value: 347 },
              { label: 'Properties Tokenized', value: 5 },
              { label: 'Best Annual Yield',     value: 81, suffix: '%', divisor: 10 },
            ].map((s, i) => (
              <div key={s.label} style={{ borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none', borderTop: i >= 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                <StatItem {...s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TECH PILLARS ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-8xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <p className="text-xs font-body uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--nox-green)' }}>
              [ Technical Foundation ]
            </p>
            <h2 className="font-display text-3xl md:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
              Built Different. Provably.
            </h2>
            <p className="mx-auto max-w-xl text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every privacy claim in this industry is marketing — except ours.
              ChainEstate uses hardware-level Trusted Execution Environments.
              The math is open. The silicon doesn&apos;t lie.
            </p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TECH_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-xl p-5 cursor-default"
                style={{ background: pillar.dim, border: `1px solid ${pillar.border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${pillar.border}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl">{pillar.icon}</span>
                  <span
                    className="rounded px-2 py-0.5 text-[9px] font-body uppercase tracking-wider"
                    style={{ background: 'rgba(0,0,0,0.3)', color: pillar.color, border: `1px solid ${pillar.border}` }}
                  >
                    {pillar.tag}
                  </span>
                </div>
                <p className="font-display text-sm mb-2" style={{ color: pillar.color }}>{pillar.label}</p>
                <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="mx-auto max-w-8xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl mb-3" style={{ color: 'var(--text-primary)' }}>
              How It Works
            </h2>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Three steps to private, on-chain real estate income
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {[
              {
                num: '01', icon: '🏛️', title: 'Property Tokenized',
                desc: 'Verified real estate assets are fractioned into ERC-7984 tokens. Legal docs pinned to IPFS. NFT metadata on-chain.',
              },
              null,
              {
                num: '02', icon: '🔐', title: 'Buy Encrypted Tokens',
                desc: 'Purchase fractional ownership with confidential amounts. Your balance is sealed in Intel TDX — unreadable to anyone including us.',
              },
              null,
              {
                num: '03', icon: '💎', title: 'Earn Private Income',
                desc: 'Monthly rental distributions flow directly to your wallet. Trade on the secondary market. Vote on governance proposals.',
              },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="hidden md:flex justify-center">
                  <span className="text-2xl" style={{ color: 'var(--gold-dim)' }}>→</span>
                </div>
              ) : (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Number(item.num) * 0.15 }}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-xl text-center cursor-default transition-all duration-200"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border-active)'
                    el.style.boxShadow = '0 0 30px var(--gold-glow)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border-subtle)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  <p className="font-data text-xs mb-4" style={{ color: 'var(--gold-dim)' }}>{item.num}</p>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-display text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ══ PRIVACY COMPARISON ═════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Privacy That Is Not a Claim
            </h2>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              On every other chain, your real estate portfolio is an open book. Not here.
            </p>
          </motion.div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {COMPARISON_ROWS.map((row) => (
              <PrivacyComparisonCard key={row.label} label={row.label} without={row.without} withPrivacy={row.with} />
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="grid grid-cols-3">
              <div className="px-4 py-3 text-xs font-body" style={{ color: 'var(--text-ghost)', borderBottom: '1px solid var(--border-subtle)' }} />
              <div className="px-4 py-3 text-xs font-body text-center" style={{ color: 'var(--status-error)', background: 'rgba(224,85,85,0.05)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                Other Platforms
              </div>
              <div className="px-4 py-3 text-xs font-body text-center" style={{ color: 'var(--gold-primary)', background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                ChainEstate + iExec TEE
              </div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="grid grid-cols-3 transition-colors duration-150 hover:bg-white/[0.015]"
                style={{ borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <div className="px-4 py-4 text-xs font-body" style={{ color: 'var(--text-secondary)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  {row.label}
                </div>
                <div className="px-4 py-4 text-xs font-body text-center" style={{ color: '#c45', background: 'rgba(224,85,85,0.03)', borderLeft: '1px solid var(--border-subtle)' }}>
                  {row.without}
                </div>
                <div className="px-4 py-4 text-xs font-body text-center" style={{ color: 'var(--nox-green)', background: 'rgba(0,229,160,0.03)', borderLeft: '1px solid var(--border-subtle)' }}>
                  {row.with}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AIRDROP BANNER ═════════════════════════════════════════════════════ */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-8xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,229,160,0.06) 0%, rgba(212,175,55,0.06) 100%)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <div>
              <p className="text-xs font-body uppercase tracking-widest mb-2" style={{ color: 'var(--nox-green)' }}>
                Genesis Airdrop — Live Now
              </p>
              <h3 className="font-display text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
                250,000,000 CEST to Distribute
              </h3>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-data px-2 py-1 rounded" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  CEST = $0.04
                </span>
                <span className="text-xs font-data px-2 py-1 rounded" style={{ background: 'rgba(0,229,160,0.08)', color: 'var(--nox-green)', border: '1px solid rgba(0,229,160,0.2)' }}>
                  Pool ≈ $10,000,000
                </span>
              </div>
              <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Follow, star, join — complete all tasks and claim your allocation before snapshot on May 20, 2026.
              </p>
            </div>
            <Link href="/airdrop" className="shrink-0">
              <button className="px-8 py-3 rounded text-sm btn-gold whitespace-nowrap">
                🪂 Claim Airdrop →
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURED PROPERTIES ════════════════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="mx-auto max-w-8xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
                Featured Properties
              </h2>
              <p className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                ERC-7984 · NFT Metadata on IPFS · Arbitrum Sepolia
              </p>
            </div>
            <Link href="/properties">
              <span className="text-sm font-body transition-opacity hover:opacity-70" style={{ color: 'var(--gold-primary)' }}>
                View All →
              </span>
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2">
            {PROPERTIES.slice(0, 3).map((p, i) => (
              <div key={p.id} className="min-w-[280px] sm:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start">
                <PropertyCard property={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: 'var(--bg-void)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="mx-auto max-w-8xl px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-data"
                  style={{ background: 'var(--gold-primary)', color: '#080810' }}
                >
                  CE
                </div>
                <span className="font-display text-lg" style={{ color: 'var(--gold-primary)' }}>ChainEstate</span>
              </div>
              <p className="text-xs font-body leading-relaxed mb-4" style={{ color: 'var(--text-ghost)' }}>
                Dark luxury meets cryptographic precision.<br />
                Private real estate. On-chain. Provably.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--nox-green)', animation: 'activePulse 2s ease-in-out infinite' }} />
                <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>Live on Arbitrum Sepolia</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[10px] font-body uppercase tracking-widest mb-4" style={{ color: 'var(--text-ghost)' }}>Platform</p>
              <div className="flex flex-col gap-2.5">
                {[
                  ['/properties', 'Properties'],
                  ['/market', 'Secondary Market'],
                  ['/dashboard', 'Dashboard'],
                  ['/admin', 'Admin Panel'],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="text-sm font-body hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Community */}
            <div>
              <p className="text-[10px] font-body uppercase tracking-widest mb-4" style={{ color: 'var(--text-ghost)' }}>Community</p>
              <div className="flex flex-col gap-2.5">
                {[
                  ['/airdrop', '🪂 Airdrop'],
                  ['/faucet', '🚰 Testnet Faucet'],
                  ['https://x.com/ChainEstatee', '𝕏 Twitter / X'],
                  ['https://github.com/ntfound-dev/ChainEstate-', '⭐ GitHub'],
                  ['https://t.me/+WDbtaMWs-_1lYmRl', '✈️ Telegram'],
                ].map(([href, label]) => (
                  href.startsWith('http') ? (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-body hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </a>
                  ) : (
                    <Link key={href} href={href} className="text-sm font-body hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* Tech */}
            <div>
              <p className="text-[10px] font-body uppercase tracking-widest mb-4" style={{ color: 'var(--text-ghost)' }}>Technology</p>
              <div className="flex flex-col gap-2">
                {[
                  ['⚡', 'iExec Nox TEE'],
                  ['🔐', 'Intel TDX Enclave'],
                  ['🪙', 'ERC-7984 Standard'],
                  ['🤖', 'ChainGPT AI'],
                  ['⛓️', 'Arbitrum Sepolia L2'],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
              © 2026 ChainEstate. Built for the ChainGPT × iExec Hackathon.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>⚡ Powered by iExec Nox</span>
              <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>🤖 AI by ChainGPT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
