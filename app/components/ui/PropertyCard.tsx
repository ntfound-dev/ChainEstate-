'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ConfidentialBadge } from './ConfidentialBadge'

interface Property {
  id: string
  name: string
  location: string
  image: string
  funded: number
  pricePerToken: number
  yield: number
  totalTokens: number
  status: 'active' | 'sold_out'
}

interface PropertyCardProps {
  property: Property
  index?: number
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { id, name, location, image, funded, pricePerToken, yield: yieldPct, totalTokens, status } = property

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="card-shine group rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6)'
        el.style.borderColor = 'var(--border-visible)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'
        el.style.borderColor = 'var(--border-subtle)'
      }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-body uppercase tracking-wider"
            style={{
              background: status === 'active' ? 'rgba(0,229,160,0.1)' : 'rgba(224,85,85,0.1)',
              color: status === 'active' ? 'var(--nox-green)' : 'var(--status-error)',
              border: `1px solid ${status === 'active' ? 'rgba(0,229,160,0.3)' : 'rgba(224,85,85,0.3)'}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                background: status === 'active' ? 'var(--nox-green)' : 'var(--status-error)',
                animation: status === 'active' ? 'activePulse 2s ease-in-out infinite' : 'none',
              }}
            />
            {status === 'active' ? 'ACTIVE' : 'SOLD OUT'}
          </span>
          <ConfidentialBadge size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-base mb-1" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>
        <p className="text-xs font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
          📍 {location}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-body mb-1.5">
            <span style={{ color: 'var(--text-secondary)' }}>Funded</span>
            <span style={{ color: 'var(--gold-primary)' }}>{funded}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div className="progress-bar-fill h-full rounded-full" style={{ width: `${funded}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs font-body mb-4">
          <div>
            <p style={{ color: 'var(--text-ghost)' }}>Per Token</p>
            <p className="font-data mt-0.5" style={{ color: 'var(--text-primary)' }}>
              ${pricePerToken.toFixed(2)}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-ghost)' }}>Est. Yield</p>
            <p className="font-data mt-0.5" style={{ color: 'var(--gold-primary)' }}>
              {yieldPct}%
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-ghost)' }}>Total Supply</p>
            <p className="font-data mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {(totalTokens / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/properties/${id}`}>
          <span
            className="block text-center py-2 px-4 rounded text-sm font-body transition-all duration-150"
            style={{
              background: 'transparent',
              border: '1px solid var(--gold-dim)',
              color: 'var(--gold-primary)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'var(--gold-glow)'
              el.style.borderColor = 'var(--gold-primary)'
              el.style.boxShadow = '0 0 20px var(--gold-glow)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.borderColor = 'var(--gold-dim)'
              el.style.boxShadow = 'none'
            }}
          >
            View Property →
          </span>
        </Link>
      </div>
    </motion.div>
  )
}
