'use client'

import type { AdminPropertyView, AdminSummary } from './types'

export function AdminAnalyticsPanel({
  properties,
  summary,
}: {
  properties: AdminPropertyView[]
  summary: AdminSummary
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="surface-panel rounded-2xl p-5">
        <h2 className="mb-5 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Portfolio Analytics
        </h2>
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                    {property.name}
                  </p>
                  <p className="mt-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    {property.region}
                  </p>
                </div>
                <span className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                  {property.yield}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                <div className="progress-bar-fill h-full rounded-full" style={{ width: `${property.funded}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-panel rounded-2xl p-5">
        <h2 className="mb-5 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Snapshot
        </h2>
        <div className="grid gap-4">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Average Yield
            </p>
            <p className="font-data text-3xl" style={{ color: 'var(--gold-primary)' }}>
              {summary.averageYield.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Confidential Distribution
            </p>
            <p className="font-data text-3xl" style={{ color: 'var(--nox-green)' }}>
              347 wallets
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              TEE Queue
            </p>
            <p className="font-data text-3xl" style={{ color: 'var(--text-primary)' }}>
              31 sec avg
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
