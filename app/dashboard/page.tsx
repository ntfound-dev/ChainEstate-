'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { DashboardConnectState } from '../components/dashboard/DashboardConnectState'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { KpiCard, SectionHeader, TerminalPanel, formatCompact, formatCurrency } from '../components/dashboard/shared'
import type { DashboardTab, PortfolioHolding, ToastType } from '../components/dashboard/types'
import { ConfidentialBadge } from '../components/ui/ConfidentialBadge'
import { TransactionModal } from '../components/ui/TransactionModal'
import { useToast } from '../components/ui/Toast'
import {
  DASHBOARD_ACTIVITY,
  DASHBOARD_HOLDINGS,
  DASHBOARD_INCOME_SERIES,
  DASHBOARD_PROPOSALS,
  DASHBOARD_TRANSFER_CONTACTS,
  DASHBOARD_WATCHLIST,
} from '../lib/dashboardData'
import { PROPERTIES } from '../lib/propertiesData'

const ACTIVITY_STYLES: Record<(typeof DASHBOARD_ACTIVITY)[number]['status'], { color: string; glow: string; label: string }> = {
  success: { color: 'var(--nox-green)', glow: 'rgba(0,229,160,0.18)', label: 'Settled' },
  warning: { color: 'var(--status-warning)', glow: 'rgba(240,168,76,0.18)', label: 'Review' },
  info: { color: 'var(--status-info)', glow: 'rgba(76,142,240,0.18)', label: 'Synced' },
}

const SETTINGS_ROWS = [
  {
    title: 'Auto-lock portfolio values',
    description: 'Require a fresh decrypt action after 10 minutes of inactivity.',
    value: 'Enabled',
  },
  {
    title: 'Trusted device signing',
    description: 'Only allow decrypt actions from your enrolled wallet browser.',
    value: '2 devices',
  },
  {
    title: 'Settlement notifications',
    description: 'Receive alerts when rent or market orders clear the TEE queue.',
    value: 'Telegram + email',
  },
]

function HoldingsPanel({
  holdings,
  onSecureAction,
}: {
  holdings: PortfolioHolding[]
  onSecureAction: (message: string, sub: string, type?: ToastType) => void
}) {
  const [decryptedRows, setDecryptedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    setDecryptedRows((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <TerminalPanel className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
            My Properties
          </h2>
          <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
            Per-row decrypt controls • transfer only appears after reveal
          </p>
        </div>
        <Link href="/properties">
          <button className="rounded-full px-4 py-2 text-xs btn-ghost">+ Buy More</button>
        </Link>
      </div>

      <div className="grid gap-3 md:hidden">
        {holdings.map((holding, index) => {
          const revealed = decryptedRows.has(holding.propertyId)

          return (
            <motion.div
              key={holding.propertyId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Link href={`/properties/${holding.propertyId}`} className="hover:opacity-80">
                    <p className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
                      {holding.name}
                    </p>
                    <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                      {holding.location} · {holding.allocation}% allocation
                    </p>
                  </Link>
                </div>
                <ConfidentialBadge size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Tokens Held', revealed ? holding.tokens.toLocaleString() : '🔒 ••••'],
                  ['Value', revealed ? formatCurrency(holding.value) : '🔒 ••••'],
                  ['Monthly Income', revealed ? formatCurrency(holding.monthlyIncome) : '🔒 ••••'],
                  ['Next Dist.', holding.nextDistribution],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-data" style={{ color: label === 'Next Dist.' ? 'var(--gold-primary)' : revealed ? 'var(--nox-green)' : 'var(--text-secondary)' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => toggleRow(holding.propertyId)}
                  className="text-[10px] font-body uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ color: 'var(--nox-green)' }}
                >
                  {revealed ? '🔓 Hide Position' : 'Decrypt Position →'}
                </button>

                {revealed && (
                  <button
                    onClick={() => onSecureAction('Transfer initiated', `${holding.ticker} routed via confidential transfer lane`, 'info')}
                    className="rounded-full px-3 py-1.5 text-[10px] font-body uppercase tracking-widest"
                    style={{ border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}
                  >
                    🔁 Transfer
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border md:block" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="grid grid-cols-[2.1fr_0.8fr_0.9fr_0.9fr_0.85fr_auto] gap-4 px-5 py-3 text-[10px] font-body uppercase tracking-widest"
          style={{ color: 'var(--text-ghost)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <span>Property</span>
          <span>Allocation</span>
          <span>Tokens Held</span>
          <span>Value</span>
          <span>Next Dist.</span>
          <span>Since</span>
        </div>

        {holdings.map((holding, index) => {
          const revealed = decryptedRows.has(holding.propertyId)

          return (
            <motion.div
              key={holding.propertyId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-[2.1fr_0.8fr_0.9fr_0.9fr_0.85fr_auto] gap-4 px-5 py-4"
              style={{
                borderBottom: index < holdings.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/properties/${holding.propertyId}`} className="hover:opacity-80">
                      <p className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
                        {holding.name}
                      </p>
                    </Link>
                    <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                      {holding.location}
                    </p>
                  </div>
                  <ConfidentialBadge size="sm" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-body uppercase tracking-widest">
                  <button onClick={() => toggleRow(holding.propertyId)} style={{ color: 'var(--nox-green)' }}>
                    {revealed ? '🔓 Hide ←' : 'Decrypt →'}
                  </button>
                  <span style={{ color: 'var(--text-ghost)' }}>Occ. {holding.occupancy}%</span>
                  {revealed && (
                    <button
                      onClick={() => onSecureAction('Transfer initiated', `${holding.ticker} routed via confidential transfer lane`, 'info')}
                      style={{ color: 'var(--gold-primary)' }}
                    >
                      🔁 Transfer
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-full">
                  <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                    {holding.allocation}%
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                    <div className="progress-bar-fill h-full rounded-full" style={{ width: `${holding.allocation}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <span className="font-data text-sm" style={{ color: revealed ? 'var(--nox-green)' : 'var(--text-secondary)' }}>
                  {revealed ? holding.tokens.toLocaleString() : '🔒 ••••'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="font-data text-sm" style={{ color: revealed ? 'var(--nox-green)' : 'var(--text-secondary)' }}>
                  {revealed ? formatCurrency(holding.value) : '🔒 ••••'}
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                  {holding.nextDistribution}
                </span>
                <span className="mt-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  {holding.yield}% yield
                </span>
              </div>

              <div className="flex items-center text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                {holding.since}
              </div>
            </motion.div>
          )
        })}
      </div>
    </TerminalPanel>
  )
}

function IncomeChartPanel() {
  const [revealed, setRevealed] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(DASHBOARD_INCOME_SERIES.length - 1)
  const hoveredPoint = DASHBOARD_INCOME_SERIES[hoveredIndex]
  const maxValue = Math.max(...DASHBOARD_INCOME_SERIES.map((entry) => entry.amount))
  const annualized = DASHBOARD_INCOME_SERIES.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <TerminalPanel className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
            Income History
          </h2>
          <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
            12 months of confidential rent settlements
          </p>
        </div>
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="text-xs font-body uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ color: 'var(--nox-green)' }}
          >
            Decrypt Income Data →
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.05)' }}>
          <p className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
            Focus Window
          </p>
          <p className="mt-4 font-data text-3xl" style={{ color: revealed ? 'var(--nox-green)' : 'var(--text-primary)' }}>
            {revealed ? formatCurrency(hoveredPoint.amount) : hoveredPoint.encryptedLabel}
          </p>
          <p className="mt-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
            {hoveredPoint.month} settlement · {hoveredPoint.source}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-body">
            <div className="rounded-xl p-3" style={{ background: 'rgba(8,8,16,0.28)' }}>
              <p style={{ color: 'var(--text-ghost)' }}>Annualized</p>
              <p className="mt-2 font-data" style={{ color: 'var(--gold-primary)' }}>
                {revealed ? formatCurrency(annualized) : '$••••'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(8,8,16,0.28)' }}>
              <p style={{ color: 'var(--text-ghost)' }}>Tooltip Mode</p>
              <p className="mt-2 font-data" style={{ color: 'var(--text-primary)' }}>
                {revealed ? 'Open' : 'Locked'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
              Hover or focus each bar
            </div>
            <div className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: revealed ? 'var(--nox-green)' : 'var(--text-ghost)' }}>
              {revealed ? 'Values decrypted' : 'Encrypted by default'}
            </div>
          </div>

          <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 sm:gap-4">
            <div className="flex flex-col justify-between text-right text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              <span>{revealed ? '$40' : '$•••'}</span>
              <span>{revealed ? '$20' : '$•••'}</span>
              <span>0</span>
            </div>

            <div className="grid h-64 grid-cols-12 items-end gap-2 sm:gap-3">
              {DASHBOARD_INCOME_SERIES.map((entry, index) => {
                const active = index === hoveredIndex
                const barHeight = Math.max(18, (entry.amount / maxValue) * 180)

                return (
                  <button
                    key={entry.month}
                    type="button"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onFocus={() => setHoveredIndex(index)}
                    className="group flex h-full flex-col items-center justify-end gap-3 rounded-xl pb-1 focus:outline-none"
                    aria-label={`${entry.month} income bar`}
                  >
                    <div
                      className="relative flex h-full w-full items-end justify-center overflow-hidden rounded-2xl border px-1.5 py-3 transition-all duration-200"
                      style={{
                        borderColor: active ? 'var(--gold-primary)' : 'var(--border-subtle)',
                        background: active ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                        boxShadow: active ? '0 0 24px rgba(201,168,76,0.12)' : 'none',
                      }}
                    >
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
                        className="w-full rounded-t-xl"
                        style={{
                          height: `${barHeight}px`,
                          transformOrigin: 'bottom',
                          background: active
                            ? 'linear-gradient(180deg, var(--gold-bright), var(--gold-primary))'
                            : 'linear-gradient(180deg, rgba(240,201,110,0.82), rgba(201,168,76,0.45))',
                        }}
                      />
                      {active && (
                        <div className="absolute inset-x-2 top-3 text-center text-[9px] font-body uppercase tracking-widest" style={{ color: 'var(--gold-primary)' }}>
                          {revealed ? formatCurrency(entry.amount, 0) : entry.encryptedLabel}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: active ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
                      {entry.month}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </TerminalPanel>
  )
}

function SignalPanel({
  holdings,
  onRefresh,
}: {
  holdings: PortfolioHolding[]
  onRefresh: () => void
}) {
  const totalMonthlyIncome = holdings.reduce((sum, holding) => sum + holding.monthlyIncome, 0)

  return (
    <TerminalPanel accent="green" className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: 'var(--nox-green)' }}>
            Private Signal
          </p>
          <h2 className="mt-3 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
            Portfolio Command Rail
          </h2>
        </div>
        <ConfidentialBadge size="sm" />
      </div>

      <div className="grid gap-3">
        {[
          ['Privacy Layer', 'Nox TEE + ERC-7984'],
          ['Next Income Window', `${holdings[0]?.nextDistribution ?? 'May 05'} · 09:00 UTC`],
          ['Monthly Cashflow', formatCurrency(totalMonthlyIncome)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
            <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              {label}
            </p>
            <p className="mt-2 font-data text-base" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onRefresh} className="rounded-full px-4 py-2 text-xs btn-gold">
          ↻ Refresh vault
        </button>
        <Link href="/market">
          <button className="rounded-full px-4 py-2 text-xs btn-ghost">Open Market</button>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
            Watchlist
          </h3>
          <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            3 live cues
          </span>
        </div>
        <div className="grid gap-3">
          {DASHBOARD_WATCHLIST.map((item) => (
            <div key={item.ticker} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                    {item.ticker}
                  </p>
                  <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {item.location}
                  </p>
                </div>
                <span
                  className="rounded-full border px-2 py-1 text-[9px] font-body uppercase tracking-[0.24em]"
                  style={{
                    borderColor: item.status === 'Hot' ? 'rgba(0,229,160,0.2)' : 'var(--border-visible)',
                    color: item.status === 'Hot' ? 'var(--nox-green)' : 'var(--gold-primary)',
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-body leading-relaxed" style={{ color: 'var(--text-ghost)' }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </TerminalPanel>
  )
}

function ActivityPanel() {
  return (
    <TerminalPanel className="space-y-5" accent="neutral">
      <div>
        <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Confidential Feed
        </h2>
        <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
          Operator events and encrypted portfolio telemetry
        </p>
      </div>

      <div className="grid gap-3">
        {DASHBOARD_ACTIVITY.map((item) => {
          const style = ACTIVITY_STYLES[item.status]

          return (
            <div
              key={`${item.time}-${item.title}`}
              className="rounded-2xl border p-4"
              style={{
                borderColor: style.glow,
                background: 'rgba(255,255,255,0.015)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: style.color, boxShadow: `0 0 18px ${style.glow}` }}
                  />
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-body uppercase tracking-[0.24em]" style={{ color: style.color }}>
                  {style.label}
                </span>
              </div>
              <p className="mt-3 pl-5 text-[10px] font-data" style={{ color: 'var(--text-ghost)' }}>
                {item.time}
              </p>
            </div>
          )
        })}
      </div>
    </TerminalPanel>
  )
}

function OverviewTab({
  holdings,
  onSecureAction,
  onRefresh,
}: {
  holdings: PortfolioHolding[]
  onSecureAction: (message: string, sub: string, type?: ToastType) => void
  onRefresh: () => void
}) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)
  const totalTokens = holdings.reduce((sum, holding) => sum + holding.tokens, 0)
  const monthlyIncome = holdings.reduce((sum, holding) => sum + holding.monthlyIncome, 0)
  const annualYield = ((monthlyIncome * 12) / totalValue) * 100

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="[ Private Bloomberg Terminal ]"
        title="Portfolio Overview"
        description="Private positions, encrypted rental flow, and secondary market controls in one vault-grade view."
        action={(
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.05)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--nox-green)', animation: 'activePulse 2s ease-in-out infinite' }} />
              <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Last updated: just now
              </span>
            </div>
            <button onClick={onRefresh} className="rounded-full px-4 py-2 text-xs btn-ghost">
              ↻ Refresh
            </button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <KpiCard title="Total Value" value={formatCurrency(totalValue)} meta="Net asset value across your private RWA portfolio." progress={96} />
        <KpiCard title="Tokens Held" value={`${formatCompact(totalTokens).toUpperCase()} TKN`} meta="Balances stay sealed until you explicitly decrypt them." progress={91} />
        <KpiCard title="Income This Month" value={formatCurrency(monthlyIncome)} meta="Confidential distributions routed through the TEE lane." accent="green" progress={88} />
        <KpiCard title="Est. Annual Yield" value={`${annualYield.toFixed(1)}%`} meta="Weighted against live positions and funded occupancy." encrypted={false} accent="gold" progress={64} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-6">
          <HoldingsPanel holdings={holdings} onSecureAction={onSecureAction} />
          <IncomeChartPanel />
        </div>
        <div className="space-y-6">
          <SignalPanel holdings={holdings} onRefresh={onRefresh} />
          <ActivityPanel />
        </div>
      </div>
    </div>
  )
}

function PropertiesTab({ holdings }: { holdings: PortfolioHolding[] }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Properties"
        description="Asset-level snapshots of the homes and towers already inside your vault, with allocation and income context alongside each position."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {holdings.map((holding, index) => (
          <motion.article
            key={holding.propertyId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="terminal-panel overflow-hidden rounded-[24px]"
          >
            <div className="relative h-48">
              {holding.property && (
                <Image
                  src={holding.property.image}
                  alt={holding.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 33vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/35 to-transparent" />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                <span
                  className="rounded-full border px-3 py-1 text-[9px] font-body uppercase tracking-[0.24em]"
                  style={{ borderColor: 'rgba(0,229,160,0.2)', background: 'rgba(0,229,160,0.08)', color: 'var(--nox-green)' }}
                >
                  {holding.occupancy}% occupied
                </span>
                <ConfidentialBadge size="sm" />
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                    {holding.name}
                  </p>
                  <p className="mt-1 text-xs font-body uppercase tracking-[0.24em]" style={{ color: 'var(--text-ghost)' }}>
                    {holding.location}
                  </p>
                </div>
                <span className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                  {holding.ticker}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-body">
                {[
                  ['Value', formatCurrency(holding.value)],
                  ['Income', formatCurrency(holding.monthlyIncome)],
                  ['Allocation', `${holding.allocation}%`],
                  ['Next Dist.', holding.nextDistribution],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ color: 'var(--text-ghost)' }}>{label}</p>
                    <p className="mt-2 font-data" style={{ color: label === 'Next Dist.' ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/properties/${holding.propertyId}`}>
                  <button className="rounded-full px-4 py-2 text-xs btn-gold">View Asset →</button>
                </Link>
                <Link href="/market">
                  <button className="rounded-full px-4 py-2 text-xs btn-ghost">Trade Token</button>
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}

function IncomeTab({ holdings }: { holdings: PortfolioHolding[] }) {
  const yearlyCashflow = holdings.reduce((sum, holding) => sum + holding.monthlyIncome, 0) * 12

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Income History"
        description="Track twelve months of private rent flow, next payout windows, and which assets are carrying the strongest distribution momentum."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <IncomeChartPanel />
        <TerminalPanel accent="green" className="space-y-5">
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Settlement Queue
            </h2>
            <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
              Upcoming distribution windows
            </p>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
            <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Annualized income
            </p>
            <p className="mt-3 font-data text-3xl" style={{ color: 'var(--nox-green)' }}>
              {formatCurrency(yearlyCashflow)}
            </p>
          </div>

          <div className="grid gap-3">
            {holdings.map((holding) => (
              <div key={holding.propertyId} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                      {holding.name}
                    </p>
                    <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                      Next payout: {holding.nextDistribution}
                    </p>
                  </div>
                  <span className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                    {formatCurrency(holding.monthlyIncome)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${holding.occupancy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </div>
  )
}

function TransferTab({
  holdings,
  onSecureAction,
}: {
  holdings: PortfolioHolding[]
  onSecureAction: (message: string, sub: string, type?: ToastType) => void
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(holdings[0]?.propertyId ?? '')
  const [recipient, setRecipient] = useState(DASHBOARD_TRANSFER_CONTACTS[0]?.address ?? '')
  const [amount, setAmount] = useState('250')

  const selectedHolding = holdings.find((holding) => holding.propertyId === selectedPropertyId) ?? holdings[0]
  const selectedRecipient = DASHBOARD_TRANSFER_CONTACTS.find((contact) => contact.address === recipient)
  const transferAmount = Number(amount) || 0
  const fee = transferAmount * 0.005
  const remaining = Math.max((selectedHolding?.tokens ?? 0) - transferAmount, 0)

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transfer Tokens"
        description="Move tokenized ownership through the confidential transfer lane. Review the asset, recipient, and encrypted payload before execution."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <TerminalPanel className="space-y-5">
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Encrypted Transfer Form
            </h2>
            <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
              Review every field before signing
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Property token
              </label>
              <select
                value={selectedPropertyId}
                onChange={(event) => setSelectedPropertyId(event.target.value)}
                className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
              >
                {holdings.map((holding) => (
                  <option key={holding.propertyId} value={holding.propertyId} style={{ background: '#13131f' }}>
                    {holding.ticker} · {holding.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Recipient
              </label>
              <select
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
              >
                {DASHBOARD_TRANSFER_CONTACTS.map((contact) => (
                  <option key={contact.address} value={contact.address} style={{ background: '#13131f' }}>
                    {contact.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Amount (tokens)
              </label>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-data"
                inputMode="numeric"
                placeholder="250"
              />
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
              <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Recipient note
              </p>
              <p className="mt-2 text-sm font-body leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {selectedRecipient?.note ?? 'Whitelisted confidential recipient'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSecureAction('Transfer initiated', `${transferAmount || 0} ${selectedHolding?.ticker ?? 'TKN'} moving through encrypted settlement`, 'info')}
            disabled={!selectedHolding || transferAmount <= 0}
            className="w-full rounded-xl px-4 py-3 text-sm btn-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            🔒 Encrypt & Transfer
          </button>
        </TerminalPanel>

        <TerminalPanel accent="green" className="space-y-5">
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Transfer Preview
            </h2>
            <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
              Confidential values remain client-side until signed
            </p>
          </div>

          {[
            ['Asset', selectedHolding?.ticker ?? 'Select holding'],
            ['Available', `${selectedHolding?.tokens.toLocaleString() ?? 0} tokens`],
            ['Amount', `${transferAmount || 0} tokens`],
            ['Fee', `${fee.toFixed(2)} tokens`],
            ['Remaining', `${remaining.toLocaleString()} tokens`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span className="font-data text-sm" style={{ color: label === 'Remaining' ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                {value}
              </span>
            </div>
          ))}

          <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
            <p className="text-xs font-body" style={{ color: 'var(--nox-green)' }}>
              ⚡ Transfers settle through the operator pattern and can take 30 to 60 seconds inside the TEE queue.
            </p>
          </div>
        </TerminalPanel>
      </div>
    </div>
  )
}

function GovernanceTab({
  onSecureAction,
}: {
  onSecureAction: (message: string, sub: string, type?: ToastType) => void
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Governance"
        description="Review the next registry decisions, sign encrypted support messages, and keep upcoming property launches aligned with treasury policy."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {DASHBOARD_PROPOSALS.map((proposal, index) => (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <TerminalPanel className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                    {proposal.id}
                  </p>
                  <h2 className="mt-2 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                    {proposal.title}
                  </h2>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-[9px] font-body uppercase tracking-[0.24em]"
                  style={{
                    borderColor: proposal.status === 'Active' ? 'rgba(0,229,160,0.2)' : 'var(--border-visible)',
                    color: proposal.status === 'Active' ? 'var(--nox-green)' : 'var(--gold-primary)',
                  }}
                >
                  {proposal.status}
                </span>
              </div>

              <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {proposal.summary}
              </p>

              <div>
                <div className="mb-2 flex items-center justify-between text-[10px] font-body uppercase tracking-widest">
                  <span style={{ color: 'var(--text-ghost)' }}>Support</span>
                  <span style={{ color: 'var(--gold-primary)' }}>{proposal.support}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${proposal.support}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs font-body">
                <span style={{ color: 'var(--text-ghost)' }}>Ends on {proposal.endsOn}</span>
                <button
                  onClick={() => onSecureAction('Governance signature queued', `${proposal.id} support message forwarded to the private registry`, 'success')}
                  className="rounded-full px-4 py-2 text-xs btn-gold"
                >
                  Sign Support
                </button>
              </div>
            </TerminalPanel>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Control how aggressively the dashboard locks itself, which devices can decrypt values, and where operational alerts should be delivered."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <TerminalPanel className="space-y-4">
          {SETTINGS_ROWS.map((row) => (
            <div key={row.title} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
                    {row.title}
                  </p>
                  <p className="mt-2 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {row.description}
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 text-[9px] font-body uppercase tracking-[0.24em]" style={{ borderColor: 'rgba(0,229,160,0.18)', color: 'var(--nox-green)' }}>
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </TerminalPanel>

        <TerminalPanel accent="green" className="space-y-5">
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Security Snapshot
            </h2>
            <p className="mt-2 text-xs font-body uppercase tracking-[0.28em]" style={{ color: 'var(--text-ghost)' }}>
              Current posture
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ['Trusted devices', '2 enrolled'],
              ['Decrypt timeout', '10 minutes'],
              ['Network', 'Arbitrum Sepolia'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border p-4" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
                <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                  {label}
                </p>
                <p className="mt-2 font-data text-base" style={{ color: 'var(--text-primary)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const { showToast } = useToast()
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [txOpen, setTxOpen] = useState(false)
  const timersRef = useRef<number[]>([])

  const holdings = useMemo<PortfolioHolding[]>(
    () =>
      DASHBOARD_HOLDINGS.map((holding) => ({
        ...holding,
        property: PROPERTIES.find((property) => property.id === holding.propertyId),
      })),
    [],
  )

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const queueSecureAction = (message: string, sub: string, type: ToastType = 'success') => {
    setTxOpen(true)
    const timer = window.setTimeout(() => {
      setTxOpen(false)
      showToast(message, sub, type)
    }, 6500)
    timersRef.current.push(timer)
  }

  const handleRefresh = () => {
    showToast('Vault synchronized', 'Latest private positions pulled from Arbitrum Sepolia', 'info')
  }

  if (!isConnected) {
    return <DashboardConnectState />
  }

  return (
    <DashboardShell tab={tab} onTabChange={setTab} address={address}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'overview' && (
              <OverviewTab holdings={holdings} onSecureAction={queueSecureAction} onRefresh={handleRefresh} />
            )}
            {tab === 'properties' && <PropertiesTab holdings={holdings} />}
            {tab === 'income' && <IncomeTab holdings={holdings} />}
            {tab === 'transfer' && <TransferTab holdings={holdings} onSecureAction={queueSecureAction} />}
            {tab === 'governance' && <GovernanceTab onSecureAction={queueSecureAction} />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      <TransactionModal
        isOpen={txOpen}
        onClose={() => setTxOpen(false)}
        txHash="0x7f3a1b2c4d5e6f7890abcdef1234567890abcd"
      />
    </DashboardShell>
  )
}
