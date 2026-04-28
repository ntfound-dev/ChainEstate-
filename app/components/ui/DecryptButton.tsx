'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface DecryptButtonProps {
  value: string
  className?: string
  onDecrypt?: (value: string) => void
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,*#@!%&'

function scramble(length: number) {
  return Array.from({ length }, () =>
    SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
  ).join('')
}

type State = 'locked' | 'decrypting' | 'revealed'

export function DecryptButton({ value, className = '', onDecrypt }: DecryptButtonProps) {
  const [state, setState] = useState<State>('locked')
  const [display, setDisplay] = useState('•'.repeat(Math.min(value.length, 8)))
  const animationRef = useRef<number>()

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleDecrypt = () => {
    if (state !== 'locked') return
    setState('decrypting')

    const total = 800
    const scrambleEnd = 600
    const start = Date.now()

    const tick = () => {
      const elapsed = Date.now() - start
      if (elapsed < 140) {
        setDisplay('⏳ Decrypting...')
        animationRef.current = requestAnimationFrame(tick)
        return
      }
      if (elapsed < scrambleEnd) {
        setDisplay(scramble(value.length))
        animationRef.current = requestAnimationFrame(tick)
      } else if (elapsed < total) {
        setDisplay(value)
        setState('revealed')
        onDecrypt?.(value)
      }
    }
    animationRef.current = requestAnimationFrame(tick)
  }

  if (state === 'revealed') {
    return (
      <motion.span
        className={`inline-flex items-center gap-2 font-data ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ color: 'var(--nox-green)', textShadow: '0 0 12px var(--nox-green)' }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-body uppercase tracking-widest"
          style={{
            borderColor: 'rgba(0,229,160,0.28)',
            background: 'rgba(0,229,160,0.08)',
          }}
        >
          🔓 Open
        </span>
        {display}
      </motion.span>
    )
  }

  return (
    <button
      onClick={handleDecrypt}
      disabled={state === 'decrypting'}
      className={`inline-flex items-center gap-1.5 text-sm font-body transition-all ${className}`}
      style={{ color: 'var(--nox-green)', cursor: state === 'decrypting' ? 'wait' : 'pointer' }}
      aria-label="Decrypt value"
      aria-busy={state === 'decrypting'}
    >
      {state === 'decrypting' ? (
        <AnimatePresence mode="wait">
          <motion.span
            key={display}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs tracking-widest"
            style={{ color: 'var(--nox-green)' }}
          >
            <motion.span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--nox-green)' }}
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.55, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {display}
          </motion.span>
        </AnimatePresence>
      ) : (
        <>
          <span
            className="rounded px-2 py-0.5 text-xs"
            style={{
              background: 'var(--nox-green-dim)',
              border: '1px solid rgba(0,229,160,0.3)',
              animation: 'noxPulse 2s ease-in-out infinite',
            }}
          >
            🔒 {display}
          </span>
          <span className="text-xs opacity-60">Decrypt →</span>
        </>
      )}
    </button>
  )
}
