'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { ConfidentialBadge } from './components/ui/ConfidentialBadge'
import { PropertyCard } from './components/ui/PropertyCard'
import { PROPERTIES } from './lib/propertiesData'

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

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

function StatItem({ label, value, prefix = '', suffix = '' }: {
  label: string; value: number; prefix?: string; suffix?: string
}) {
  const { ref, count } = useCountUp(value)
  return (
    <div ref={ref} className="text-center px-6 py-6">
      <p className="font-data text-2xl md:text-3xl mb-1" style={{ color: 'var(--gold-primary)' }}>
        {prefix}{count >= 1000000 ? `${(count / 1000000).toFixed(1)}M` : count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count}{suffix}
      </p>
      <p className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  )
}

function FloatingPropertyCard({ style, name, location, yieldPct, image }: {
  style: React.CSSProperties; name: string; location: string; yieldPct: number; image: string
}) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', width: '220px', ...style }}
    >
      <div className="relative h-28">
        <Image src={image} alt={name} fill className="object-cover" sizes="220px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a]/80 to-transparent" />
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <p className="font-display text-xs" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <ConfidentialBadge size="sm" />
        </div>
        <p className="text-[10px] font-body mb-2" style={{ color: 'var(--text-secondary)' }}>📍 {location}</p>
        <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>{yieldPct}% yield</p>
      </div>
    </div>
  )
}

function StepCard({ num, icon, title, desc }: { num: string; icon: string; title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-6 rounded-xl text-center cursor-default transition-all duration-200"
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
      }}
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
      <p className="font-data text-xs mb-4" style={{ color: 'var(--gold-dim)' }}>{num}</p>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </motion.div>
  )
}

function PrivacyComparisonCard({ label, without, withPrivacy }: {
  label: string; without: string; withPrivacy: string
}) {
  return (
    <div className="surface-panel rounded-xl p-4">
      <p className="text-[10px] font-body uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-ghost)' }}>
        {label}
      </p>
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-lg p-3" style={{ background: 'rgba(224,85,85,0.05)', border: '1px solid rgba(224,85,85,0.12)' }}>
          <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--status-error)' }}>
            Without Privacy
          </p>
          <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>{without}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.16)' }}>
          <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--nox-green)' }}>
            With ChainEstate
          </p>
          <p className="text-xs font-body" style={{ color: 'var(--text-primary)' }}>{withPrivacy}</p>
        </div>
      </div>
    </div>
  )
}

const COMPARISON_ROWS = [
  { label: 'Your balance',     without: '👁 Public on-chain',   with: '🔒 Encrypted' },
  { label: 'Income received',  without: '👁 Anyone can see',    with: '🔒 Only you know' },
  { label: 'Trade activity',   without: '👁 Fully traceable',   with: '🔒 Confidential' },
  { label: 'MEV exposure',     without: '⚠️ High risk',          with: '✅ Protected' },
  { label: 'Institutional use',without: '❌ Not viable',         with: '✅ Enterprise-ready' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="mx-auto max-w-8xl w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-body uppercase tracking-[0.3em] mb-6"
              style={{ color: 'var(--nox-green)' }}
            >
              [ Private REIT On-Chain ]
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6"
            >
              <span style={{ color: 'var(--text-primary)' }}>Own Real Estate.</span>
              <br />
              <span className="shimmer-text">Own Your Privacy.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-base font-body mb-10 max-w-md leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Fractional real estate investing with confidential ownership.<br />
              Your balances. Your income. Only yours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/properties">
                <button className="px-6 py-3 rounded text-sm btn-gold">Explore Properties</button>
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
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative flex justify-center items-center min-h-[300px]"
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
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-8 right-4 z-20"
              >
                <FloatingPropertyCard
                  name="Shibuya Terrace" location="Tokyo, Japan" yieldPct={5.9}
                  image={PROPERTIES[1].image} style={{ transform: 'rotate(2deg)' }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--gold-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="mx-auto max-w-8xl">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: 'none' }}>
            {[
              { label: 'Total Value Locked', value: 42800000, prefix: '$' },
              { label: 'Active Investors', value: 347 },
              { label: 'Properties Listed', value: 12 },
              { label: 'Avg. Rental Yield', value: 64, suffix: '%' },
            ].map((s, i) => (
              <div key={s.label} style={{ borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none', borderTop: i >= 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                <StatItem {...s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-8xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-center mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            How ChainEstate Works
          </motion.h2>
          <p className="text-center text-sm font-body mb-14" style={{ color: 'var(--text-secondary)' }}>
            Three steps to private, on-chain real estate ownership
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <StepCard num="01" icon="🏠" title="List Property" desc="Verified assets are tokenized and listed with full legal documentation stored on IPFS." />
            <div className="hidden md:flex justify-center text-2xl" style={{ color: 'var(--gold-dim)' }}>→</div>
            <StepCard num="02" icon="🔐" title="Buy ERC-7984 Token" desc="Purchase fractional tokens with encrypted ownership. Your balance is never exposed on-chain." />
            <div className="hidden md:flex justify-center text-2xl" style={{ color: 'var(--gold-dim)' }}>→</div>
            <StepCard num="03" icon="💰" title="Receive Private Income" desc="Monthly rental distributions deposited directly to your wallet — amounts visible only to you." />
          </div>
        </div>
      </section>

      {/* PRIVACY COMPARISON */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-center mb-14"
            style={{ color: 'var(--text-primary)' }}
          >
            Why Privacy Matters in RWA
          </motion.h2>

          <div className="md:hidden space-y-3">
            {COMPARISON_ROWS.map((row) => (
              <PrivacyComparisonCard
                key={row.label}
                label={row.label}
                without={row.without}
                withPrivacy={row.with}
              />
            ))}
          </div>

          <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="grid grid-cols-3">
              <div className="px-4 py-3 text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)', borderBottom: '1px solid var(--border-subtle)' }} />
              <div className="px-4 py-3 text-xs font-body text-center" style={{ color: 'var(--status-error)', background: 'rgba(224,85,85,0.05)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                Without Privacy
              </div>
              <div className="px-4 py-3 text-xs font-body text-center" style={{ color: 'var(--gold-primary)', background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                With ChainEstate
              </div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-3 transition-colors duration-150 hover:bg-white/[0.02]"
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

      {/* FEATURED PROPERTIES */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-8xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl md:text-3xl" style={{ color: 'var(--text-primary)' }}>
              Featured Properties
            </h2>
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

      {/* FOOTER */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="mx-auto max-w-8xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-display text-lg mb-2" style={{ color: 'var(--gold-primary)' }}>ChainEstate</p>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-ghost)' }}>
                Dark luxury meets cryptographic precision.<br />Private real estate. On-chain.
              </p>
            </div>
            <div>
              <p className="text-xs font-body uppercase tracking-widest mb-4" style={{ color: 'var(--text-ghost)' }}>Navigation</p>
              <div className="flex flex-col gap-2">
                {[['/', 'Home'], ['/properties', 'Properties'], ['/market', 'Market'], ['/dashboard', 'Dashboard'], ['/admin', 'Admin']].map(([href, label]) => (
                  <Link key={href} href={href} className="text-sm font-body hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-body uppercase tracking-widest mb-4" style={{ color: 'var(--text-ghost)' }}>Network Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--nox-green)', animation: 'activePulse 2s ease-in-out infinite' }} />
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Live on Arbitrum Sepolia</span>
              </div>
              <p className="text-xs font-body mt-3" style={{ color: 'var(--text-ghost)' }}>⚡ Powered by iExec Nox</p>
            </div>
          </div>
          <div className="pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
              © 2026 ChainEstate. All rights reserved. Built on Arbitrum Sepolia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
