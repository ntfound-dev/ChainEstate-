'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  txHash?: string
}

const STEPS = [
  'Encrypting input via Nox SDK',
  'Sending to Arbitrum Sepolia',
  'TEE Processing (Intel TDX)...',
]

export function TransactionModal({ isOpen, onClose, txHash }: TransactionModalProps) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isOpen) { setStep(0); setProgress(0); setDone(false); return }

    const timers = [
      setTimeout(() => { setStep(1); setProgress(33) }, 1200),
      setTimeout(() => { setStep(2); setProgress(66) }, 2800),
      setTimeout(() => { setProgress(100) }, 5000),
      setTimeout(() => { setDone(true) }, 5800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={done ? onClose : undefined} />
          <motion.div
            className="relative w-full max-w-md rounded-xl p-6"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-visible)' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl">⚡</span>
              <h3 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>
                Processing Transaction
              </h3>
            </div>

            <div className="h-px mb-5" style={{ background: 'var(--border-subtle)' }} />

            {/* Steps */}
            <div className="space-y-3 mb-6">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {step > i ? (
                      <span style={{ color: 'var(--nox-green)' }}>✓</span>
                    ) : step === i ? (
                      <motion.div
                        className="w-3 h-3 rounded-full"
                        style={{ background: 'var(--gold-primary)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ background: 'var(--text-ghost)' }} />
                    )}
                  </div>
                  <span
                    className="text-sm font-body"
                    style={{
                      color: step > i ? 'var(--nox-green)' : step === i ? 'var(--text-primary)' : 'var(--text-ghost)',
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
              {step === 2 && (
                <p className="text-xs font-body pl-8" style={{ color: 'var(--text-secondary)' }}>
                  This may take 30–60 seconds. Your data is being processed securely in a Trusted Execution Environment.
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
              <motion.div
                className="h-full rounded-full progress-bar-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs font-data text-right mb-4" style={{ color: 'var(--gold-primary)' }}>
              {progress}%
            </p>

            {/* Tx hash */}
            {txHash && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-body hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>Transaction: {txHash.slice(0, 10)}...{txHash.slice(-6)}</span>
                <span>↗ Arbiscan</span>
              </a>
            )}

            {/* Done */}
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                <p className="text-sm font-body" style={{ color: 'var(--nox-green)' }}>
                  ✓ Done! Check your dashboard.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 rounded text-sm btn-gold"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
