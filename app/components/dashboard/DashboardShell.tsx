'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useReadContract } from 'wagmi'
import { DASHBOARD_NAV_ITEMS, type DashboardTab } from './types'
import {
  TOKEN_PRICES, ADDRESSES, ERC20_ABI,
  TIER_BENEFITS, TIER_THRESHOLDS, TIER_MINT_COSTS, TIER_NFT_ABI,
} from '@/app/lib/contracts'

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
  const addr = address as `0x${string}` | undefined

  const { data: cestRaw } = useReadContract({
    address: ADDRESSES.cestToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr },
  })

  const { data: usdtRaw } = useReadContract({
    address: ADDRESSES.usdt,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr },
  })

  const { data: hasBadgeRaw } = useReadContract({
    address: ADDRESSES.tierNFT,
    abi: TIER_NFT_ABI,
    functionName: 'hasBadge',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr },
  })

  const { data: badgeTierRaw } = useReadContract({
    address: ADDRESSES.tierNFT,
    abi: TIER_NFT_ABI,
    functionName: 'badgeTier',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr },
  })

  const { data: multiplierRaw } = useReadContract({
    address: ADDRESSES.tierNFT,
    abi: TIER_NFT_ABI,
    functionName: 'airdropMultiplierBps',
    args: addr ? [addr] : undefined,
    query: { enabled: !!addr },
  })

  // CEST has 18 decimals, USDT has 6
  const cestBalance = cestRaw ? Number(cestRaw) / 1e18 : null
  const usdtBalance = usdtRaw ? Number(usdtRaw) / 1e6 : null

  const cestDisplay = cestBalance !== null ? cestBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const usdtDisplay = usdtBalance !== null ? `$${usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'

  // Tier from live CEST balance (for eligibility display)
  const cestTierKey = cestBalance === null ? null
    : cestBalance >= TIER_THRESHOLDS.PLATINUM ? 'PLATINUM'
    : cestBalance >= TIER_THRESHOLDS.GOLD     ? 'GOLD'
    : cestBalance >= TIER_THRESHOLDS.SILVER   ? 'SILVER'
    : cestBalance >= TIER_THRESHOLDS.BRONZE   ? 'BRONZE'
    : null

  const cestTierBenefits = cestTierKey ? TIER_BENEFITS[cestTierKey] : null

  // Minted badge info (from contract)
  const hasBadge     = hasBadgeRaw ?? false
  const mintedTierN  = (badgeTierRaw as number | undefined) ?? 0  // 0=None,1=Bronze…4=Platinum
  const TIER_KEYS    = ['', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const
  const mintedKey    = mintedTierN > 0 ? TIER_KEYS[mintedTierN] : null
  const mintedBenef  = mintedKey ? TIER_BENEFITS[mintedKey] : null
  const multiplier   = multiplierRaw ? Number(multiplierRaw) / 100 : 1
  const mintCost     = cestTierKey ? TIER_MINT_COSTS[cestTierKey] : null

  // Can upgrade? live tier > minted tier
  const liveTierN   = cestTierKey ? (['BRONZE','SILVER','GOLD','PLATINUM'].indexOf(cestTierKey) + 1) : 0
  const canUpgrade  = hasBadge && liveTierN > mintedTierN
  const canMint     = !hasBadge && !!cestTierKey

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

          {/* USDT balance */}
          <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
            <p className="hidden text-[10px] font-body uppercase tracking-[0.24em] xl:block" style={{ color: 'var(--text-ghost)' }}>
              USDT Balance
            </p>
            <p className="mt-1 text-center font-data text-sm xl:text-left xl:text-base" style={{ color: 'var(--gold-primary)' }}>
              {usdtDisplay}
            </p>
            <p className="mt-0.5 text-center text-[10px] font-data xl:text-left" style={{ color: 'var(--text-ghost)' }}>
              on-chain · 6 dec
            </p>
          </div>

          {/* CEST balance + Tier badge */}
          <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: 'rgba(0,229,160,0.18)', background: 'rgba(0,229,160,0.04)' }}>
            <p className="hidden text-[10px] font-body uppercase tracking-[0.24em] xl:block" style={{ color: 'var(--text-ghost)' }}>
              CEST Balance
            </p>
            <p className="mt-1 text-center font-data text-sm xl:text-left xl:text-base" style={{ color: 'var(--gold-primary)' }}>
              {cestDisplay} CEST
            </p>
            {cestBalance !== null && (
              <p className="mt-0.5 text-center text-[10px] font-data xl:text-left" style={{ color: 'var(--text-secondary)' }}>
                ≈ ${(cestBalance * TOKEN_PRICES.CEST).toFixed(2)} · ${TOKEN_PRICES.CEST.toFixed(2)}/CEST
              </p>
            )}

            {/* Minted badge */}
            {mintedBenef && (
              <div className="mt-2 hidden xl:block">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{mintedBenef.emoji}</span>
                  <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--nox-green)' }}>
                    {mintedBenef.label} Badge
                  </span>
                  <span className="ml-auto text-[9px] font-data px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--nox-green)' }}>
                    NFT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-data">
                  <div className="rounded px-1.5 py-1 text-center" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold-primary)' }}>
                    -{mintedBenef.discount}% fee
                  </div>
                  <div className="rounded px-1.5 py-1 text-center" style={{ background: 'rgba(0,229,160,0.08)', color: 'var(--nox-green)' }}>
                    {multiplier.toFixed(2)}× airdrop
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: just show tier badge emoji */}
            {mintedBenef && (
              <p className="mt-1 text-center text-xs xl:hidden">{mintedBenef.emoji}</p>
            )}

            {/* Eligible but no badge yet */}
            {cestTierBenefits && !mintedBenef && (
              <div className="mt-2 hidden xl:block">
                <p className="text-[10px] font-body mb-1" style={{ color: 'var(--text-ghost)' }}>
                  Eligible: {cestTierBenefits.emoji} {cestTierBenefits.label}
                </p>
                <p className="text-[9px] font-body leading-snug" style={{ color: 'var(--text-ghost)' }}>
                  -{cestTierBenefits.discount}% fee · {cestTierBenefits.multiplierBps / 100}× airdrop
                </p>
              </div>
            )}

            {/* Mint / Upgrade CTA */}
            {(canMint || canUpgrade) && (
              <Link
                href="/airdrop"
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-body font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 hidden xl:flex"
                style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                {canUpgrade ? '↑ Upgrade Badge' : `Mint Badge · ${mintCost?.toLocaleString()} CEST`}
              </Link>
            )}
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
