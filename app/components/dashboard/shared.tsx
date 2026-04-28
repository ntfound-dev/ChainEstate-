'use client'

import type { ReactNode } from 'react'
import { DecryptButton } from '@/app/components/ui/DecryptButton'

export function formatCurrency(value: number, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function TerminalPanel({
  children,
  className = '',
  accent = 'gold',
}: {
  children: ReactNode
  className?: string
  accent?: 'gold' | 'green' | 'neutral'
}) {
  const accentMap = {
    gold: {
      border: 'var(--border-subtle)',
      beam: 'rgba(201,168,76,0.45)',
    },
    green: {
      border: 'rgba(0,229,160,0.18)',
      beam: 'rgba(0,229,160,0.4)',
    },
    neutral: {
      border: 'rgba(255,255,255,0.08)',
      beam: 'rgba(240,237,232,0.2)',
    },
  } as const

  const current = accentMap[accent]

  return (
    <div
      className={`terminal-panel relative overflow-hidden rounded-[24px] p-5 sm:p-6 ${className}`}
      style={{
        borderColor: current.border,
        boxShadow: '0 26px 70px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${current.beam}, transparent)` }}
      />
      {children}
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-3 text-[10px] font-body uppercase tracking-[0.32em]" style={{ color: 'var(--nox-green)' }}>
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

export function KpiCard({
  title,
  value,
  meta,
  encrypted = true,
  accent = 'gold',
  progress,
}: {
  title: string
  value: string
  meta: string
  encrypted?: boolean
  accent?: 'gold' | 'green'
  progress?: number
}) {
  const accentColor = accent === 'green' ? 'var(--nox-green)' : 'var(--gold-primary)'
  const chipLabel = encrypted ? 'Sealed' : 'Live'

  return (
    <TerminalPanel accent={accent}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
          {title}
        </p>
        <span
          className="rounded-full border px-2 py-1 text-[9px] font-body uppercase tracking-[0.24em]"
          style={{
            color: accentColor,
            borderColor: accent === 'green' ? 'rgba(0,229,160,0.2)' : 'var(--border-visible)',
            background: accent === 'green' ? 'rgba(0,229,160,0.06)' : 'rgba(201,168,76,0.06)',
          }}
        >
          {chipLabel}
        </span>
      </div>

      <div className="mt-7">
        {encrypted ? (
          <DecryptButton value={value} className="text-lg sm:text-xl" />
        ) : (
          <p
            className="font-data text-3xl"
            style={{
              color: accentColor,
              textShadow: `0 0 24px ${accent === 'green' ? 'rgba(0,229,160,0.18)' : 'rgba(201,168,76,0.18)'}`,
            }}
          >
            {value}
          </p>
        )}
      </div>

      <p className="mt-4 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {meta}
      </p>

      {typeof progress === 'number' && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-body uppercase tracking-widest">
            <span style={{ color: 'var(--text-ghost)' }}>Confidence</span>
            <span style={{ color: accentColor }}>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: accent === 'green'
                  ? 'linear-gradient(90deg, rgba(0,229,160,0.35), rgba(0,229,160,0.95))'
                  : 'linear-gradient(90deg, var(--gold-dim), var(--gold-primary))',
              }}
            />
          </div>
        </div>
      )}
    </TerminalPanel>
  )
}
