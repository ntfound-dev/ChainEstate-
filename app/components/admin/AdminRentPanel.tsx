'use client'

import type { AdminPropertyView } from './types'

export function AdminRentPanel({
  properties,
  selectedPropertyId,
  selectedPropertyName,
  depositAmount,
  depositValue,
  platformFee,
  reserve,
  distributable,
  onSelectedPropertyIdChange,
  onDepositAmountChange,
  onTriggerDistribution,
}: {
  properties: AdminPropertyView[]
  selectedPropertyId: string
  selectedPropertyName: string
  depositAmount: string
  depositValue: number
  platformFee: number
  reserve: number
  distributable: number
  onSelectedPropertyIdChange: (propertyId: string) => void
  onDepositAmountChange: (amount: string) => void
  onTriggerDistribution: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="surface-panel rounded-2xl p-5">
        <h2 className="mb-5 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Rent Distribution
        </h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Select Property
            </label>
            <select
              value={selectedPropertyId}
              onChange={(event) => onSelectedPropertyIdChange(event.target.value)}
              className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id} style={{ background: '#13131f' }}>
                  {property.name}, {property.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
              Deposit Amount (USDT)
            </label>
            <input
              value={depositAmount}
              onChange={(event) => onDepositAmountChange(event.target.value)}
              className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-data"
              inputMode="decimal"
              placeholder="3000"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className="btn-ghost w-full rounded py-3 text-sm">Deposit Rent</button>
            <button className="btn-gold w-full rounded py-3 text-sm" onClick={onTriggerDistribution}>
              Trigger Distribution
            </button>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.18)' }}
          >
            <p className="text-xs font-body" style={{ color: 'var(--nox-green)' }}>
              ⚡ This uses the ERC-7984 operator pattern with confidential settlement.
            </p>
            <p className="mt-1 text-[10px] font-body" style={{ color: 'var(--text-secondary)' }}>
              TEE processing typically takes 30 to 60 seconds.
            </p>
          </div>
        </div>
      </div>

      <div className="surface-panel rounded-2xl p-5">
        <h2 className="mb-5 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
          Distribution Summary
        </h2>
        <div className="space-y-4">
          {[
            ['Selected Asset', selectedPropertyName],
            ['Total Deposited', `$${depositValue.toLocaleString()} USDT`],
            ['Platform Fee (5%)', `- $${platformFee.toFixed(2)}`],
            ['Maintenance Reserve (5%)', `- $${reserve.toFixed(2)}`],
            ['To Distribute', `$${distributable.toFixed(2)} USDT`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b pb-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span
                className="font-data text-sm"
                style={{ color: label === 'To Distribute' ? 'var(--gold-primary)' : 'var(--text-primary)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
