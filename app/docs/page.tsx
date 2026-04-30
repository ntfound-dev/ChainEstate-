import Link from 'next/link'

const QUICK_LINKS = [
  { href: '/docs/problem-solution', icon: '🎯', title: 'Problem & Solution', desc: 'Why real estate needs blockchain — and why blockchain needs privacy.' },
  { href: '/docs/business-model',   icon: '💼', title: 'Business Model',     desc: 'How ChainEstate generates revenue and sustains the ecosystem.' },
  { href: '/docs/roadmap',          icon: '🗺️', title: 'Roadmap',            desc: 'Milestones from testnet launch to global institutional adoption.' },
  { href: '/docs/contracts',        icon: '📜', title: 'Smart Contracts',    desc: 'Architecture, function signatures, and integration patterns.' },
  { href: '/docs/sdk',              icon: '⚡', title: 'SDK & Integration',  desc: 'iExec Nox handle client, buy/sell flows, direct transfer, governance voting, ABI reference.' },
]

const STATS = [
  { label: 'Properties Live',  value: '5',          sub: 'All on Arbitrum Sepolia' },
  { label: 'Total Supply',     value: '$2.64M',      sub: 'USDT tokenized real estate' },
  { label: 'CEST Market Cap',  value: '$40M',        sub: '1B supply · $0.04 each' },
  { label: 'Airdrop Pool',     value: '$10M',        sub: '250M CEST to community' },
  { label: 'Tests Passing',    value: '60',          sub: 'Across 5 contract suites' },
  { label: 'Privacy Layer',    value: 'Intel TDX',   sub: 'iExec Nox ERC-7984' },
]

export default function DocsOverview() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
          Documentation
        </p>
        <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
          ChainEstate Docs
        </h1>
        <p className="text-base font-body leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          ChainEstate is a fractional real estate tokenization platform built on Arbitrum Sepolia using
          iExec Nox ERC-7984 confidential tokens. Investor balances and transfer amounts are encrypted
          via Intel TDX TEE — no on-chain observer can infer how much any wallet holds.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
          >
            <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>
              {s.label}
            </p>
            <p className="font-data text-xl font-bold" style={{ color: 'var(--gold-primary)' }}>
              {s.value}
            </p>
            <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--text-ghost)' }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
        Contents
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {QUICK_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-xl p-5 transition-all duration-150"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{l.icon}</span>
              <span className="font-display text-sm group-hover:opacity-80" style={{ color: 'var(--gold-primary)' }}>
                {l.title}
              </span>
            </div>
            <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {l.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Tech stack */}
      <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
        Tech Stack
      </h2>
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{ border: '1px solid var(--border-visible)' }}
      >
        {[
          { layer: 'Blockchain',    tech: 'Arbitrum Sepolia',                  detail: 'chainId 421614 — EVM-compatible L2' },
          { layer: 'Privacy',       tech: 'iExec Nox — ERC-7984',             detail: 'Intel TDX TEE, encrypted euint256 balances' },
          { layer: 'Smart Contracts', tech: 'Solidity 0.8.28 + Hardhat',      detail: '5 core contracts, 60 tests passing' },
          { layer: 'Frontend',      tech: 'Next.js 14 App Router',            detail: 'Tailwind CSS, Framer Motion, dark luxury design' },
          { layer: 'Web3',          tech: 'Wagmi v2 + Viem',                  detail: 'useWriteContract, usePublicClient, Arbitrum Sepolia' },
          { layer: 'Nox SDK',       tech: '@iexec-nox/handle',                detail: 'createViemHandleClient, encryptInput → {handle, handleProof}' },
          { layer: 'AI',            tech: 'ChainGPT (@chaingpt/generalchat)', detail: 'Streaming Web3 AI assistant' },
        ].map((row, i, arr) => (
          <div
            key={row.layer}
            className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr_1fr] px-5 py-3.5"
            style={{
              borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
            }}
          >
            <span className="text-xs font-body uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>
              {row.layer}
            </span>
            <span className="text-xs font-data font-semibold" style={{ color: 'var(--gold-primary)' }}>
              {row.tech}
            </span>
            <span className="hidden sm:block text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              {row.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Hackathon challenges */}
      <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
        Hackathon Challenges
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            badge: 'ChainGPT',
            color: 'var(--gold-primary)',
            dim: 'rgba(212,175,55,0.08)',
            border: 'rgba(212,175,55,0.25)',
            title: 'AI-Powered Web3 Product',
            points: [
              'ChainGPT SDK integrated in AIChatbot component',
              'Streaming responses via /api/chatbot proxy',
              'Answers questions about ERC-7984, iExec Nox, contracts',
            ],
          },
          {
            badge: 'iExec Nox',
            color: 'var(--nox-green)',
            dim: 'rgba(0,229,160,0.06)',
            border: 'rgba(0,229,160,0.2)',
            title: 'ERC-7984 Confidential Tokens — 5 Utility Types',
            points: [
              'Private Payments: purchaseTokens with Nox handle + proof',
              'Private Transfers: executeBuy via confidentialTransferFrom',
              'Rewards: equal-share rent distribution (RentDistributor)',
              'Governance: token-gated proposals + voting (ConfidentialGovernance)',
              'Access Control: onlyHolder modifier via registry.isHolder()',
            ],
          },
        ].map(c => (
          <div
            key={c.badge}
            className="rounded-xl p-5"
            style={{ background: c.dim, border: `1px solid ${c.border}` }}
          >
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-body uppercase tracking-widest mb-3"
              style={{ background: c.dim, color: c.color, border: `1px solid ${c.border}` }}
            >
              {c.badge}
            </span>
            <p className="font-display text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              {c.title}
            </p>
            <ul className="space-y-1.5">
              {c.points.map(pt => (
                <li key={pt} className="flex items-start gap-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: c.color }}>✓</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
