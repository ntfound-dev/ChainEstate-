import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from './components/layout/Navbar'
import { Web3Provider } from './components/web3/Web3Provider'
import { ToastProvider } from './components/ui/Toast'
import { AIChatbot } from './components/ui/AIChatbot'
import { EncryptedRain } from './components/effects/EncryptedRain'
import { AmbientOrbs } from './components/effects/AmbientOrbs'
import { NoxErrorSuppressor } from './components/web3/NoxErrorSuppressor'

export const metadata: Metadata = {
  title: 'ChainEstate — Private Real Estate on Chain',
  description: 'Fractional real estate investing with confidential ownership. Your balances. Your income. Only yours.',
  keywords: ['real estate', 'blockchain', 'privacy', 'RWA', 'DeFi', 'fractional ownership'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen relative" style={{ background: 'var(--bg-void)' }}>
        <Web3Provider>
          <NoxErrorSuppressor />
          <ToastProvider>
            {/* Background layers */}
            <EncryptedRain />
            <AmbientOrbs />

            {/* App */}
            <div className="relative z-10">
              <Navbar />
              <main>{children}</main>
              <AIChatbot />
            </div>
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
