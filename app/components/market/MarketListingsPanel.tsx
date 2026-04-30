'use client'

import { motion } from 'framer-motion'
import { ConfidentialBadge } from '@/app/components/ui/ConfidentialBadge'
import type { MarketListingView, TradeType } from './types'

export function MarketListingsPanel({
  search,
  filtered,
  selectedTicker,
  mode,
  onSearchChange,
  onSelect,
}: {
  search: string
  filtered: MarketListingView[]
  selectedTicker?: string
  mode: TradeType
  onSearchChange: (value: string) => void
  onSelect: (listing: MarketListingView, mode: TradeType) => void
}) {
  return (
    <div>
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-ghost)' }}>
          ⌕
        </span>
        <input
          type="text"
          placeholder="Search token or property..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg bg-transparent py-2.5 pl-8 pr-4 text-sm font-body focus:outline-none"
          style={{
            border: '1px solid var(--border-visible)',
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)',
          }}
          onFocus={(event) => (event.currentTarget.style.borderColor = 'var(--gold-primary)')}
          onBlur={(event) => (event.currentTarget.style.borderColor = 'var(--border-visible)')}
          aria-label="Search market listings"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center" style={{ background: 'var(--bg-surface)' }}>
          <p className="font-body text-sm" style={{ color: 'var(--text-ghost)' }}>
            No results found
          </p>
        </div>
      ) : (
        <>
          <div
            className="hidden rounded-t-lg border-b md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:gap-4 md:px-5 md:py-3"
            style={{ color: 'var(--text-ghost)', background: 'var(--bg-elevated)', borderBottomColor: 'var(--border-subtle)' }}
          >
            <span className="text-[10px] font-body uppercase tracking-widest">Property Token</span>
            <span className="text-[10px] font-body uppercase tracking-widest">Last Price</span>
            <span className="text-[10px] font-body uppercase tracking-widest">24h Change</span>
            <span className="text-[10px] font-body uppercase tracking-widest">Volume</span>
            <span className="text-[10px] font-body uppercase tracking-widest">Action</span>
          </div>

          <div className="hidden md:block">
            {filtered.map((listing, index) => (
              <motion.div
                key={listing.ticker}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors duration-150"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background:
                    selectedTicker === listing.ticker ? 'rgba(201,168,76,0.05)' : index % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
                  borderLeft: selectedTicker === listing.ticker ? '2px solid var(--gold-primary)' : '2px solid transparent',
                }}
                onClick={() => onSelect(listing, mode)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                      {listing.ticker}
                    </p>
                    {listing.isDex && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[8px] font-body uppercase tracking-wider"
                        style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.3)' }}
                      >
                        GOV
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                    {listing.name}
                  </p>
                </div>
                <p className="font-data text-sm" style={{ color: 'var(--text-primary)' }}>
                  ${listing.lastPrice < 1 ? listing.lastPrice.toFixed(3) : listing.lastPrice.toFixed(2)}
                </p>
                <p
                  className="font-data text-sm"
                  style={{ color: listing.changePositive ? 'var(--nox-green)' : 'var(--status-error)' }}
                >
                  {listing.changePositive ? '+' : ''}
                  {listing.change24h}% {listing.changePositive ? '▲' : '▼'}
                </p>
                <div className="flex flex-col">
                  <span className="font-data text-xs" style={{ color: 'var(--text-primary)' }}>
                    {listing.volume24h ? listing.volume24h.toLocaleString() : '—'}
                  </span>
                  <span className="text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>
                    {listing.isDex ? 'CEST' : 'tokens'}
                  </span>
                </div>
                {listing.isDex ? (
                  <span
                    className="rounded px-3 py-1.5 text-xs font-body whitespace-nowrap"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-ghost)', cursor: 'default' }}
                    title="CEST Uniswap listing planned Q2 2026 — not yet live"
                  >
                    Q2 2026
                  </span>
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(listing, mode)
                    }}
                    className="rounded px-3 py-1.5 text-xs font-body transition-all duration-150"
                    style={{ border: '1px solid var(--gold-dim)', color: 'var(--gold-primary)' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = 'var(--gold-glow)'
                      event.currentTarget.style.borderColor = 'var(--gold-primary)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'transparent'
                      event.currentTarget.style.borderColor = 'var(--gold-dim)'
                    }}
                  >
                    Trade
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((listing, index) => (
              <motion.button
                key={listing.ticker}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(listing, mode)}
                className="surface-panel rounded-xl p-4 text-left"
                style={{ borderColor: selectedTicker === listing.ticker ? 'var(--gold-primary)' : 'var(--border-subtle)' }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                      {listing.ticker}
                    </p>
                    <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                      {listing.name}
                    </p>
                  </div>
                  <ConfidentialBadge size="sm" />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                      Last Price
                    </p>
                    <p className="mt-1 font-data text-base" style={{ color: 'var(--text-primary)' }}>
                      ${listing.lastPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                      24h Change
                    </p>
                    <p
                      className="mt-1 font-data text-base"
                      style={{ color: listing.changePositive ? 'var(--nox-green)' : 'var(--status-error)' }}
                    >
                      {listing.changePositive ? '+' : ''}
                      {listing.change24h}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Volume: Private
                  </span>
                  <span className="text-xs font-body" style={{ color: 'var(--gold-primary)' }}>
                    Trade →
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
