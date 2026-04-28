'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ConfidentialBadge } from '@/app/components/ui/ConfidentialBadge'
import { WalletButton } from '@/app/components/web3/WalletButton'
import type { HandleStatus, MarketListingView, TradeType } from './types'

export function MarketTradePanel({
  selected,
  tradeType,
  amount,
  total,
  isConnected,
  handleStatus,
  onTradeTypeChange,
  onAmountChange,
  onExecute,
  onClear,
}: {
  selected: MarketListingView | null
  tradeType: TradeType
  amount: string
  total: string
  isConnected: boolean
  handleStatus: HandleStatus
  onTradeTypeChange: (tradeType: TradeType) => void
  onAmountChange: (value: string) => void
  onExecute: () => void
  onClear: () => void
}) {
  return (
    <div>
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.ticker}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="rounded-xl p-6 lg:sticky lg:top-24"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
                Trade: {selected.ticker}
              </h2>
              <button
                onClick={onClear}
                className="text-sm"
                style={{ color: 'var(--text-ghost)' }}
                aria-label="Close trade panel"
              >
                ×
              </button>
            </div>

            <div className="mb-5 flex overflow-hidden rounded" style={{ border: '1px solid var(--border-visible)' }}>
              {(['buy', 'sell'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => onTradeTypeChange(option)}
                  className="flex-1 py-2 text-xs font-body uppercase tracking-wider transition-all duration-150 capitalize"
                  style={{
                    background: tradeType === option ? (option === 'buy' ? 'var(--nox-green)' : 'var(--status-error)') : 'transparent',
                    color: tradeType === option ? '#080810' : 'var(--text-secondary)',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Amount (tokens)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => onAmountChange(event.target.value)}
                  placeholder="0"
                  className="w-full rounded px-3 py-2.5 text-sm font-data bg-transparent focus:outline-none"
                  style={{ border: '1px solid var(--border-visible)', color: 'var(--text-primary)' }}
                  onFocus={(event) => (event.currentTarget.style.borderColor = 'var(--gold-primary)')}
                  onBlur={(event) => (event.currentTarget.style.borderColor = 'var(--border-visible)')}
                  aria-label="Amount of tokens"
                />
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                <div className="mb-2 flex justify-between text-xs font-body">
                  <span style={{ color: 'var(--text-ghost)' }}>Price per token</span>
                  <span className="font-data" style={{ color: 'var(--text-primary)' }}>
                    ${selected.lastPrice.toFixed(2)} (market)
                  </span>
                </div>
                <div className="flex justify-between text-xs font-body">
                  <span style={{ color: 'var(--text-ghost)' }}>Total</span>
                  <span className="font-data" style={{ color: 'var(--gold-primary)' }}>
                    ${total}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--nox-green-dim)', border: '1px solid rgba(0,229,160,0.2)' }}>
                <ConfidentialBadge size="sm" />
                <span className="text-[10px] font-body" style={{ color: 'var(--text-secondary)' }}>
                  Your holdings remain private
                </span>
              </div>

              {!isConnected ? (
                <WalletButton />
              ) : (
                <button
                  onClick={onExecute}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full rounded px-4 py-3 text-sm btn-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none"
                >
                  🔒 Encrypt & Execute
                </button>
              )}

              <p className="text-[10px] font-body text-center" style={{ color: 'var(--text-ghost)' }}>
                Platform fee: 0.5%
              </p>
              <p className="text-[10px] font-body text-center leading-relaxed" style={{ color: handleStatus === 'ready' ? 'var(--nox-green)' : 'var(--text-ghost)' }}>
                {handleStatus === 'ready'
                  ? 'Trade input encryption is routed through @iexec-nox/handle before settlement.'
                  : 'Connect on Arbitrum Sepolia to initialize the official iExec Nox SDK trade flow.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl p-8 text-center lg:sticky lg:top-24"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="mb-4 text-3xl">📊</p>
            <p className="mb-2 font-display text-sm" style={{ color: 'var(--text-secondary)' }}>
              Select a token to trade
            </p>
            <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
              Click any row or the Trade button to open the trading panel.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
