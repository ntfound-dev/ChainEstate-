'use client'

import { motion } from 'framer-motion'

export function AdminHeader() {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <p className="mb-4 text-[10px] font-body uppercase tracking-[0.3em]" style={{ color: 'var(--nox-green)' }}>
        [ Control Room ]
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Admin Panel
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Registry operations, confidential rent flows, and token launch controls for ChainEstate assets.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full px-4 py-2" style={{ border: '1px solid var(--border-visible)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--nox-green)', animation: 'activePulse 2s ease-in-out infinite' }} />
          <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Arbitrum Sepolia Operator Online
          </span>
        </div>
      </div>
    </motion.div>
  )
}
