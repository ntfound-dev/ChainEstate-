'use client'

import { ConfidentialBadge } from '@/app/components/ui/ConfidentialBadge'
import type { RegistryRow } from './types'

export function AdminRegistryPanel({ rows }: { rows: RegistryRow[] }) {
  return (
    <div className="surface-panel rounded-2xl p-5">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Operator Registry
        </h2>
        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
          Access roles for confidential operations and treasury controls.
        </p>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.wallet}
            className="flex flex-col gap-3 rounded-xl p-4 md:flex-row md:items-center md:justify-between"
            style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}
          >
            <div>
              <p className="font-data text-sm" style={{ color: 'var(--text-primary)' }}>
                {row.wallet}
              </p>
              <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                {row.scope}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ConfidentialBadge size="sm" />
              <div className="text-right">
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  {row.role}
                </p>
                <p className="mt-1 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--nox-green)' }}>
                  {row.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
