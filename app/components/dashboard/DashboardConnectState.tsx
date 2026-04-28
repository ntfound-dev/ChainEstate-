'use client'

import { WalletButton } from '@/app/components/web3/WalletButton'
import { TerminalPanel } from './shared'

export function DashboardConnectState() {
  return (
    <div className="min-h-screen px-6 pt-24">
      <div className="mx-auto max-w-xl">
        <TerminalPanel accent="green" className="py-12 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
            style={{ borderColor: 'rgba(0,229,160,0.2)', background: 'rgba(0,229,160,0.08)' }}
          >
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="mt-6 font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
            Connect Your Wallet
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Connect to open the investor terminal, decrypt your balances, and manage confidential real estate positions.
          </p>
          <div className="mt-8 flex justify-center">
            <WalletButton />
          </div>
        </TerminalPanel>
      </div>
    </div>
  )
}
