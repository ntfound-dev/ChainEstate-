'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PropertyCard } from '../components/ui/PropertyCard'
import { PROPERTIES } from '../lib/propertiesData'

const REGIONS = ['All', 'Asia', 'Middle East', 'Europe']

export default function PropertiesPage() {
  const [region, setRegion] = useState('All')
  const [minYield, setMinYield] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<'yield' | 'funded' | 'value'>('yield')
  const [sortOpen, setSortOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...PROPERTIES]
    if (region !== 'All') list = list.filter(p => p.region === region)
    if (minYield) list = list.filter(p => p.yield >= parseFloat(minYield))
    if (maxPrice) list = list.filter(p => p.value <= parseFloat(maxPrice))
    list.sort((a, b) => {
      if (sortBy === 'yield') return b.yield - a.yield
      if (sortBy === 'funded') return b.funded - a.funded
      return b.value - a.value
    })
    return list
  }, [region, minYield, maxPrice, sortBy])

  const active = filtered.filter(p => p.status === 'active').length
  const sold   = filtered.filter(p => p.status === 'sold_out').length

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-8xl px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Properties
            </motion.h1>
          </div>
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="px-4 py-2 rounded text-xs font-body flex items-center gap-2 transition-colors"
              style={{ border: '1px solid var(--border-visible)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
            >
              Sort: {sortBy === 'yield' ? 'Yield ↓' : sortBy === 'funded' ? 'Funded ↓' : 'Value ↓'}
              <span>▾</span>
            </button>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-1 rounded-lg overflow-hidden z-20"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-visible)', minWidth: '160px' }}
              >
                {(['yield', 'funded', 'value'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSortBy(s); setSortOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-xs font-body hover:bg-white/5 transition-colors capitalize"
                    style={{ color: sortBy === s ? 'var(--gold-primary)' : 'var(--text-secondary)' }}
                  >
                    {s === 'yield' ? 'Est. Yield' : s === 'funded' ? '% Funded' : 'Property Value'}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Divider + stats */}
        <div className="h-px mb-2" style={{ background: 'var(--border-visible)' }} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-body mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          {filtered.length} Properties · {active} Active · {sold} Sold Out
        </motion.p>

        {/* Filter bar — sticky */}
        <div
          className="sticky top-[56px] z-30 py-4 mb-8 -mx-6 px-6"
          style={{ background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Region pills */}
            <div className="flex gap-2 flex-wrap">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className="px-3 py-1.5 rounded-full text-xs font-body transition-all duration-150"
                  style={{
                    background: region === r ? 'var(--gold-primary)' : 'transparent',
                    color: region === r ? '#080810' : 'var(--text-secondary)',
                    border: `1px solid ${region === r ? 'var(--gold-primary)' : 'var(--border-visible)'}`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                <label className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>Min Yield</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={minYield}
                    onChange={e => setMinYield(e.target.value)}
                    placeholder="0"
                    className="w-16 bg-transparent text-xs font-body text-right pb-0.5 focus:outline-none"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--gold-primary)',
                    }}
                    aria-label="Minimum yield percentage"
                  />
                  <span className="absolute right-0 top-0 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>%</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                <label className="text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>Max Price</label>
                <div className="relative">
                  <span className="absolute left-0 top-0 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    placeholder="900000"
                    className="w-24 bg-transparent pl-3 text-xs font-body text-right pb-0.5 focus:outline-none"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--gold-primary)',
                    }}
                    aria-label="Maximum property value in US dollars"
                  />
                </div>
              </div>

              <button
                onClick={() => { setRegion('All'); setMinYield(''); setMaxPrice('') }}
                className="px-3 py-2 rounded-full text-[10px] font-body uppercase tracking-widest transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-visible)' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>No properties found</p>
            <p className="text-sm font-body" style={{ color: 'var(--text-ghost)' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
