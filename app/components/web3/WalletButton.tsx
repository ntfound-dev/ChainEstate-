'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent SSR/client HTML mismatch — wagmi state is only known client-side
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) {
    return (
      <button className="px-4 py-2 rounded text-xs font-body btn-ghost opacity-0 pointer-events-none" aria-hidden>
        Connect Wallet
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-body transition-all duration-150"
          style={{
            border: '1px solid var(--border-visible)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--nox-green)' }} />
          {address.slice(0, 6)}...{address.slice(-4)}
          <span className="px-1.5 py-0.5 rounded text-[9px]"
            style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold-primary)', border: '1px solid var(--border-subtle)' }}>
            ◉ Arbitrum Sepolia
          </span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 rounded-lg overflow-hidden z-50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-visible)', minWidth: '160px' }}
            >
              <button
                onClick={() => { disconnect(); setOpen(false) }}
                className="w-full text-left px-4 py-3 text-xs font-body transition-colors hover:bg-white/5"
                style={{ color: 'var(--status-error)' }}
              >
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 rounded text-xs font-body btn-ghost"
      >
        Connect Wallet
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 rounded-lg overflow-hidden z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-visible)', minWidth: '200px' }}
          >
            <p className="px-4 pt-3 pb-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Select Wallet
            </p>
            {connectors.map(connector => (
              <button
                key={connector.id}
                onClick={() => { connect({ connector }); setOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm font-body transition-colors hover:bg-white/5 flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="w-6 h-6 rounded flex items-center justify-center text-xs"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  {connector.name === 'MetaMask' ? '🦊' : connector.name === 'Coinbase Wallet' ? '💙' : '🔌'}
                </span>
                {connector.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
