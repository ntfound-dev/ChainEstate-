'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const SECTIONS = [
  { href: '/docs',                    label: 'Overview',            icon: '⛓' },
  { href: '/docs/getting-started',    label: 'Getting Started',     icon: '🚀' },
  { href: '/docs/problem-solution',   label: 'Problem & Solution',  icon: '🎯' },
  { href: '/docs/business-model',     label: 'Business Model',      icon: '💼' },
  { href: '/docs/roadmap',            label: 'Roadmap',             icon: '🗺️' },
  { href: '/docs/contracts',          label: 'Smart Contracts',     icon: '📜' },
  { href: '/docs/sdk',                label: 'SDK & Integration',   icon: '⚡' },
]

export function DocsSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const current = SECTIONS.find(s =>
    s.href === '/docs' ? pathname === '/docs' : pathname.startsWith(s.href)
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="flex items-center gap-2 mb-6 lg:hidden text-sm font-body px-4 py-2 rounded-lg"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}
        onClick={() => setOpen(!open)}
      >
        <span>{open ? '✕' : '☰'}</span>
        <span>{current?.label ?? 'Docs'}</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`${open ? 'block' : 'hidden'} lg:block w-full lg:w-52 xl:w-60 shrink-0`}
      >
        <div className="lg:sticky lg:top-28">
          <p className="mb-3 text-[10px] font-body uppercase tracking-[0.28em] px-3" style={{ color: 'var(--text-ghost)' }}>
            Documentation
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map(section => {
              const active = section.href === '/docs'
                ? pathname === '/docs'
                : pathname.startsWith(section.href)
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-150"
                  style={{
                    background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color: active ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    borderLeft: `2px solid ${active ? 'var(--gold-primary)' : 'transparent'}`,
                  }}
                >
                  <span className="text-base">{section.icon}</span>
                  <span>{section.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 px-3 py-4 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-[10px] font-body uppercase tracking-widest mb-2" style={{ color: 'var(--text-ghost)' }}>
              Testnet
            </p>
            <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              All contracts live on Arbitrum Sepolia.
            </p>
            <a
              href="https://sepolia.arbiscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[10px] font-body transition-opacity hover:opacity-70"
              style={{ color: 'var(--gold-primary)' }}
            >
              ↗ Arbiscan Explorer
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
