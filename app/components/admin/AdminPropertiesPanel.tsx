'use client'

import { ConfidentialBadge } from '@/app/components/ui/ConfidentialBadge'
import type { AdminPropertyView, AdminSummary } from './types'

export function AdminPropertiesPanel({
  properties,
  summary,
  onOpenListing,
}: {
  properties: AdminPropertyView[]
  summary: AdminSummary
  onOpenListing: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="surface-panel rounded-xl p-5">
          <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            Properties Listed
          </p>
          <p className="font-data text-3xl" style={{ color: 'var(--gold-primary)' }}>
            {properties.length}
          </p>
        </div>
        <div className="surface-panel rounded-xl p-5">
          <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            Active Offerings
          </p>
          <p className="font-data text-3xl" style={{ color: 'var(--nox-green)' }}>
            {summary.active}
          </p>
        </div>
        <div className="surface-panel rounded-xl p-5">
          <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            Total Registry Value
          </p>
          <p className="font-data text-3xl" style={{ color: 'var(--gold-primary)' }}>
            ${(summary.totalValue / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      <div className="surface-panel rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
              Property Registry
            </h2>
            <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Operational listing control, token readiness, and sale status.
            </p>
          </div>
          <button onClick={onOpenListing} className="btn-gold rounded px-4 py-2 text-sm">
            + List New Property
          </button>
        </div>

        <div className="hidden overflow-hidden rounded-xl md:block" style={{ border: '1px solid var(--border-subtle)' }}>
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[10px] font-body uppercase tracking-widest"
            style={{ color: 'var(--text-ghost)', background: 'var(--bg-elevated)' }}
          >
            <span>Property</span>
            <span>Status</span>
            <span>Supply</span>
            <span>Funded</span>
            <span>Action</span>
          </div>
          {properties.map((property, index) => (
            <div
              key={property.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                background: index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}
            >
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                  {property.name}
                </p>
                <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                  {property.location}
                </p>
              </div>
              <div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-body uppercase tracking-widest"
                  style={{
                    background: property.status === 'active' ? 'rgba(0,229,160,0.1)' : 'rgba(224,85,85,0.1)',
                    color: property.status === 'active' ? 'var(--nox-green)' : 'var(--status-error)',
                    border: `1px solid ${property.status === 'active' ? 'rgba(0,229,160,0.2)' : 'rgba(224,85,85,0.2)'}`,
                  }}
                >
                  {property.status === 'active' ? 'Active' : 'Sold Out'}
                </span>
              </div>
              <p className="font-data text-sm" style={{ color: 'var(--text-primary)' }}>
                {property.totalTokens.toLocaleString()}
              </p>
              <div>
                <p className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>
                  {property.funded}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${property.funded}%` }} />
                </div>
              </div>
              <button
                className="rounded-full px-3 py-2 text-[10px] font-body uppercase tracking-widest"
                style={{ border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}
              >
                Manage
              </button>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:hidden">
          {properties.map((property) => (
            <div
              key={property.id}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                    {property.name}
                  </p>
                  <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                    {property.location}
                  </p>
                </div>
                <ConfidentialBadge size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                <div>
                  <p style={{ color: 'var(--text-ghost)' }}>Status</p>
                  <p
                    className="mt-1"
                    style={{ color: property.status === 'active' ? 'var(--nox-green)' : 'var(--status-error)' }}
                  >
                    {property.status === 'active' ? 'Active' : 'Sold Out'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-ghost)' }}>Supply</p>
                  <p className="mt-1 font-data" style={{ color: 'var(--text-primary)' }}>
                    {property.totalTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
