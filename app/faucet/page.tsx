'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientAccount as useAccount } from '../components/web3/useClientAccount'
import { WalletButton } from '../components/web3/WalletButton'
import { useToast } from '../components/ui/Toast'
import { TOKEN_PRICES } from '../lib/contracts'

type Token = 'usdt' | 'cest'
type ClaimState = 'idle' | 'claiming' | 'done' | 'cooldown'

interface TokenState {
  state: ClaimState
  txHash?: string
  error?: string
}

const OUR_TOKENS = [
  {
    id: 'usdt' as Token,
    symbol: 'USDT',
    name: 'Mock USDT',
    amount: '1,000',
    icon: '💵',
    description: 'Testnet stablecoin used to purchase property tokens and pay into rent pools.',
    address: '0x9a822B9A50D090CfcCa1e6474efCd653112d8501',
    color: 'var(--nox-green)',
    dimColor: 'var(--nox-green-dim)',
    borderColor: 'rgba(0,229,160,0.2)',
  },
  {
    id: 'cest' as Token,
    symbol: 'CEST',
    name: 'ChainEstate Token',
    amount: '2,400',
    usdValue: `$${(2400 * TOKEN_PRICES.CEST).toFixed(2)}`,
    icon: '🏛️',
    description: 'Platform governance token. Stake for fee discounts and on-chain voting power.',
    address: '0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D',
    color: 'var(--gold-primary)',
    dimColor: 'rgba(212,175,55,0.06)',
    borderColor: 'rgba(212,175,55,0.2)',
  },
]

const EXTERNAL_FAUCETS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    provider: 'Circle',
    icon: '🔵',
    description: 'Official Circle USDC testnet — funds your wallet with USDC on Arbitrum Sepolia.',
    href: 'https://faucet.circle.com/',
    color: '#2775CA',
    dimColor: 'rgba(39,117,202,0.08)',
    borderColor: 'rgba(39,117,202,0.25)',
    label: 'Get USDC at Circle Faucet →',
  },
  {
    symbol: 'RLC',
    name: 'iExec RLC',
    provider: 'iExec',
    icon: '⚡',
    description: 'Official iExec RLC testnet faucet — required for iExec Nox TEE computation tasks.',
    href: 'https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet',
    color: '#FFD700',
    dimColor: 'rgba(255,215,0,0.06)',
    borderColor: 'rgba(255,215,0,0.2)',
    label: 'Get RLC at iExec Explorer →',
  },
]

export default function FaucetPage() {
  const { address, isConnected } = useAccount()
  const { showToast } = useToast()
  const [states, setStates] = useState<Record<Token, TokenState>>({
    usdt: { state: 'idle' },
    cest: { state: 'idle' },
  })

  const claim = async (token: Token) => {
    if (!address) return
    setStates((prev) => ({ ...prev, [token]: { state: 'claiming' } }))

    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, token }),
      })
      const data = await res.json()

      if (!res.ok) {
        const errMsg: string = data.error ?? 'Claim failed'
        setStates((prev) => ({
          ...prev,
          [token]: { state: res.status === 429 ? 'cooldown' : 'idle', error: errMsg },
        }))
        showToast('Claim failed', errMsg, 'error')
        return
      }

      setStates((prev) => ({ ...prev, [token]: { state: 'done', txHash: data.txHash } }))
      const meta = OUR_TOKENS.find((t) => t.id === token)!
      showToast(
        `${meta.amount} ${meta.symbol} sent!`,
        `Tx: ${(data.txHash as string).slice(0, 18)}…`,
        'success',
      )
    } catch {
      setStates((prev) => ({ ...prev, [token]: { state: 'idle', error: 'Network error' } }))
      showToast('Network error', 'Could not reach the faucet — try again.', 'error')
    }
  }

  return (
    <div className="min-h-screen pb-24 pt-28">
      <div className="mx-auto max-w-2xl px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <p className="mb-3 text-4xl">🚰</p>
          <h1 className="mb-3 font-display text-3xl tracking-wide" style={{ color: 'var(--gold-primary)' }}>
            Testnet Faucet
          </h1>
          <p className="mx-auto max-w-md text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Collect free testnet tokens on Arbitrum Sepolia to explore ChainEstate.
          </p>
        </motion.div>

        {/* Network badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 flex items-center justify-center"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-body uppercase tracking-widest"
            style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', color: 'var(--nox-green)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            Arbitrum Sepolia Testnet
          </span>
        </motion.div>

        {/* ── Section 1: Our mock tokens ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-3 flex items-center gap-3"
        >
          <span className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            Provided by ChainEstate
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span
            className="rounded px-2 py-0.5 text-[10px] font-body uppercase tracking-wide"
            style={{ background: 'rgba(0,229,160,0.08)', color: 'var(--nox-green)', border: '1px solid rgba(0,229,160,0.15)' }}
          >
            Mock tokens · 24h limit
          </span>
        </motion.div>

        <div className="mb-8 space-y-4">
          {OUR_TOKENS.map((token, i) => {
            const ts = states[token.id]
            const busy = ts.state === 'claiming'
            const done = ts.state === 'done'
            const cooldown = ts.state === 'cooldown'

            return (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="rounded-xl p-6"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${done ? token.borderColor : 'var(--border-visible)'}`,
                  transition: 'border-color 0.3s',
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ background: token.dimColor, border: `1px solid ${token.borderColor}` }}
                    >
                      {token.icon}
                    </div>
                    <div>
                      <p className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
                        {token.name}
                      </p>
                      <p className="text-[10px] font-data mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                        {token.address.slice(0, 10)}…{token.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-data text-xl font-bold" style={{ color: token.color }}>
                      {token.amount}
                    </p>
                    <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                      {token.symbol} / claim
                    </p>
                    {'usdValue' in token && (
                      <p className="text-[10px] font-data mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                        ≈ {(token as { usdValue: string }).usdValue}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mb-5 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {token.description}
                </p>

                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg p-3 text-center"
                      style={{ background: token.dimColor, border: `1px solid ${token.borderColor}` }}
                    >
                      <p className="mb-1 text-xs font-body" style={{ color: token.color }}>
                        ✓ Tokens sent successfully
                      </p>
                      {ts.txHash && (
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${ts.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-data underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                          style={{ color: token.color }}
                        >
                          {ts.txHash.slice(0, 22)}…
                        </a>
                      )}
                    </motion.div>
                  ) : cooldown ? (
                    <motion.div
                      key="cooldown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                        ⏱ {ts.error ?? 'Cooldown active — try again in 24h'}
                      </p>
                    </motion.div>
                  ) : !isConnected ? (
                    <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <WalletButton />
                    </motion.div>
                  ) : (
                    <motion.button
                      key="claim"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => claim(token.id)}
                      disabled={busy}
                      className="w-full rounded px-4 py-3 text-sm font-body font-medium tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: busy ? 'var(--bg-elevated)' : token.color,
                        color: busy ? 'var(--text-secondary)' : '#080810',
                        border: busy ? '1px solid var(--border-visible)' : 'none',
                      }}
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        `Claim ${token.amount} ${token.symbol}`
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* ── Section 2: Official external faucets ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="mb-3 flex items-center gap-3"
        >
          <span className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            Official protocol faucets
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span
            className="rounded px-2 py-0.5 text-[10px] font-body uppercase tracking-wide"
            style={{ background: 'rgba(212,175,55,0.06)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            External · no limit
          </span>
        </motion.div>

        <div className="mb-8 space-y-4">
          {EXTERNAL_FAUCETS.map((faucet, i) => (
            <motion.div
              key={faucet.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 + i * 0.08 }}
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ background: faucet.dimColor, border: `1px solid ${faucet.borderColor}` }}
                  >
                    {faucet.icon}
                  </div>
                  <div>
                    <p className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
                      {faucet.name}
                    </p>
                    <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                      by {faucet.provider}
                    </p>
                  </div>
                </div>
                <div
                  className="shrink-0 rounded px-2 py-1 text-[10px] font-body uppercase tracking-wide"
                  style={{ background: faucet.dimColor, color: faucet.color, border: `1px solid ${faucet.borderColor}` }}
                >
                  {faucet.symbol}
                </div>
              </div>

              <p className="mb-5 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {faucet.description}
              </p>

              <a
                href={faucet.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded px-4 py-3 text-sm font-body font-medium tracking-wide transition-all hover:opacity-90 active:scale-[0.99]"
                style={{
                  background: faucet.dimColor,
                  color: faucet.color,
                  border: `1px solid ${faucet.borderColor}`,
                }}
              >
                {faucet.label}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="mb-3 text-xs font-display uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            What to do with testnet tokens
          </p>
          <ul className="space-y-2 text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex gap-2">
              <span style={{ color: 'var(--gold-primary)' }}>1.</span>
              <span><strong className="font-medium" style={{ color: 'var(--text-primary)' }}>USDT</strong> — buy fractional property tokens on the Properties page.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: 'var(--gold-primary)' }}>2.</span>
              <span><strong className="font-medium" style={{ color: 'var(--text-primary)' }}>USDC</strong> — alternative payment rail, accepted alongside USDT.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: 'var(--gold-primary)' }}>3.</span>
              <span><strong className="font-medium" style={{ color: 'var(--text-primary)' }}>RLC</strong> — powers iExec Nox TEE computation that encrypts your trade amounts.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: 'var(--gold-primary)' }}>4.</span>
              <span><strong className="font-medium" style={{ color: 'var(--text-primary)' }}>CEST</strong> — stake for platform fee discounts and governance voting rights.</span>
            </li>
          </ul>
        </motion.div>

      </div>
    </div>
  )
}
