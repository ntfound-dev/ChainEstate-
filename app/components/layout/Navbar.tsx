'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WalletButton } from '../web3/WalletButton'

const NAV_LINKS = [
  { href: '/properties', label: 'Properties' },
  { href: '/market', label: 'Market' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/airdrop', label: 'Airdrop' },
  { href: '/faucet', label: 'Faucet' },
]

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        height: scrolled ? '56px' : '80px',
        background: scrolled ? 'rgba(8,8,16,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      }}
    >
      <nav className="mx-auto max-w-8xl h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="ChainEstate home">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-data"
            style={{ background: 'var(--gold-primary)', color: '#080810' }}
          >
            CE
          </div>
          <span
            className="font-display text-lg tracking-wide hidden sm:block group-hover:opacity-80 transition-opacity"
            style={{ color: 'var(--gold-primary)' }}
          >
            ChainEstate
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="relative text-sm font-body tracking-wide transition-colors duration-150"
                style={{ color: active ? 'var(--gold-primary)' : 'var(--text-secondary)' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
              >
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--gold-primary)' }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <WalletButton />
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden px-6 pb-4 flex flex-col gap-1"
          style={{ background: 'rgba(8,8,16,0.98)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-body border-b"
              style={{
                color: pathname.startsWith(href) ? 'var(--gold-primary)' : 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {label}
            </Link>
          ))}
        </motion.div>
      )}
    </header>
  )
}
