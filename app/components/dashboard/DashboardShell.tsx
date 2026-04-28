'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { DASHBOARD_NAV_ITEMS, type DashboardTab } from './types'
import { TOKEN_PRICES } from '@/app/lib/contracts'

const CEST_BALANCE = 2_400

export function DashboardShell({
  tab,
  onTabChange,
  address,
  children,
}: {
  tab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  address?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen pb-24 pt-20 md:pb-10">
      <aside
        className="fixed bottom-0 left-0 top-20 hidden overflow-y-auto border-r px-3 py-6 md:flex md:w-[88px] xl:w-60 xl:px-4"
        style={{ borderColor: 'var(--border-subtle)', background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(18px)' }}
      >
        <div className="flex min-h-full w-full flex-col">
          <Link href="/" className="mb-6 flex items-center justify-center gap-3 px-2 xl:justify-start">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border text-xs font-data"
              style={{ borderColor: 'var(--border-visible)', background: 'rgba(201,168,76,0.08)', color: 'var(--gold-primary)' }}
            >
              CE
            </div>
            <div className="hidden xl:block">
              <p className="font-display text-lg" style={{ color: 'var(--gold-primary)' }}>
                ChainEstate
              </p>
              <p className="text-[10px] font-body uppercase tracking-[0.24em]" style={{ color: 'var(--text-ghost)' }}>
                Investor Vault
              </p>
            </div>
          </Link>

          <div className="mb-6 rounded-2xl border px-3 py-4" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-center gap-3 xl:justify-start">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-data"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold-bright)' }}
              >
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-body" style={{ color: 'var(--text-primary)' }}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <p className="mt-1 text-[10px] font-body uppercase tracking-[0.24em]" style={{ color: 'var(--nox-green)' }}>
                  Arbitrum Sepolia
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {DASHBOARD_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-body transition-all duration-150 xl:justify-start"
                style={{
                  background: tab === item.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                  color: tab === item.id ? 'var(--gold-primary)' : 'var(--text-secondary)',
                  borderLeft: tab === item.id ? '2px solid var(--gold-primary)' : '2px solid transparent',
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border p-3" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
            <p className="hidden text-[10px] font-body uppercase tracking-[0.24em] xl:block" style={{ color: 'var(--text-ghost)' }}>
              CEST Balance
            </p>
            <p className="mt-1 text-center font-data text-sm xl:text-left xl:text-base" style={{ color: 'var(--gold-primary)' }}>
              {CEST_BALANCE.toLocaleString()} CEST
            </p>
            <p className="mt-0.5 text-center text-[10px] font-data xl:text-left" style={{ color: 'var(--text-secondary)' }}>
              ≈ ${(CEST_BALANCE * TOKEN_PRICES.CEST).toFixed(2)}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-center text-[10px] font-body uppercase tracking-[0.24em] xl:text-left" style={{ color: 'var(--nox-green)' }}>
                🥈 Silver Tier
              </p>
              <span className="text-[9px] font-data hidden xl:block" style={{ color: 'var(--text-ghost)' }}>
                ${TOKEN_PRICES.CEST.toFixed(2)}/CEST
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="mx-auto max-w-[1680px] px-4 sm:px-6 md:ml-[88px] xl:ml-60">
        {children}
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(8,8,16,0.96)', backdropFilter: 'blur(16px)' }}
      >
        {DASHBOARD_NAV_ITEMS.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-body transition-colors"
            style={{ color: tab === item.id ? 'var(--gold-primary)' : 'var(--text-ghost)' }}
            aria-label={item.label}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
