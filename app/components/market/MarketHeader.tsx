'use client'

import { motion } from 'framer-motion'

export function MarketHeader({
  mode,
  onModeChange,
}: {
  mode: 'buy' | 'sell'
  onModeChange: (mode: 'buy' | 'sell') => void
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Market
          </h1>
          <p className="mt-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
            Secondary market for ChainEstate property tokens. All trading volumes are private.
          </p>
        </motion.div>
        <div className="flex overflow-hidden rounded" style={{ border: '1px solid var(--border-visible)' }}>
          {(['buy', 'sell'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onModeChange(option)}
              className="px-6 py-2 text-xs font-body uppercase tracking-wider transition-all duration-150"
              style={{
                background: mode === option ? (option === 'buy' ? 'var(--nox-green)' : 'var(--status-error)') : 'transparent',
                color: mode === option ? '#080810' : 'var(--text-secondary)',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 h-px" style={{ background: 'var(--border-visible)' }} />
    </>
  )
}
