const PHASES = [
  {
    phase: 'Phase 0',
    period: 'Q1 2026 — Now',
    title: 'Hackathon & Testnet',
    status: 'current',
    color: 'var(--nox-green)',
    dim: 'rgba(0,229,160,0.06)',
    border: 'rgba(0,229,160,0.25)',
    items: [
      { done: true,  text: 'Deploy all 5 core smart contracts on Arbitrum Sepolia' },
      { done: true,  text: 'List all 5 PropertyToken contracts (ERC-7984) on-chain' },
      { done: true,  text: 'Real on-chain buy flow: Nox encrypt → USDT approve → purchaseTokens' },
      { done: true,  text: 'Multi-currency payment: USDT, USDC, CEST (switchable per purchase)' },
      { done: true,  text: 'Real secondary market sell: grantOperator → createListing' },
      { done: true,  text: 'Real secondary market buy: USDT approve → executeBuy' },
      { done: true,  text: 'Legal documents pinned to IPFS — ipfs.io + Cloudflare gateway links' },
      { done: true,  text: 'Dashboard: on-chain holder verification via PropertyRegistry' },
      { done: true,  text: 'Dashboard: governance castVote + operator-pattern token transfer' },
      { done: true,  text: 'CEST token: 1B supply, staking tiers, governance votes' },
      { done: true,  text: 'ChainGPT AI assistant integration (streaming, all languages)' },
      { done: true,  text: 'Genesis airdrop: 250M CEST pool, task tracker' },
      { done: true,  text: 'Testnet faucet: 1,000 USDT + 2,400 CEST per address' },
      { done: true,  text: 'NFT metadata API: ERC-721 standard for all 5 properties' },
      { done: true,  text: 'ConfidentialGovernance: token-gated proposals + voting' },
      { done: true,  text: '60 tests passing across 5 contract suites' },
    ],
  },
  {
    phase: 'Phase 1',
    period: 'Q2 2026',
    title: 'Mainnet Launch',
    status: 'upcoming',
    color: 'var(--gold-primary)',
    dim: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.2)',
    items: [
      { done: false, text: 'Deploy to Arbitrum One mainnet with audited contracts' },
      { done: false, text: 'Third-party security audit (Trail of Bits / Certik)' },
      { done: false, text: 'List first 3 real-world properties (SPV + legal structure)' },
      { done: false, text: 'CEST airdrop claim window opens June 1, 2026' },
      { done: false, text: 'Uniswap V3 CEST/USDT liquidity pool launch' },
      { done: false, text: 'Fiat on-ramp: buy property tokens with credit card (Stripe / Moonpay)' },
      { done: false, text: 'Native USDC mainnet integration (Circle CCTP)' },
      { done: false, text: 'Mobile-optimised frontend (React Native app)' },
      { done: false, text: 'Email + Telegram notifications for rent distributions' },
    ],
  },
  {
    phase: 'Phase 2',
    period: 'Q3 2026',
    title: 'Growth & Governance',
    status: 'planned',
    color: 'var(--text-secondary)',
    dim: 'rgba(255,255,255,0.02)',
    border: 'var(--border-visible)',
    items: [
      { done: false, text: 'DAO governance: CEST holders vote on new property listings' },
      { done: false, text: 'Pro-rata rent distribution (encrypted sum via iExec Nox compute)' },
      { done: false, text: 'On-chain portfolio analytics (privacy-preserving aggregates)' },
      { done: false, text: '10+ properties across 6 countries' },
      { done: false, text: 'B2B: property developer API for tokenization-as-a-service' },
      { done: false, text: 'CEST staking rewards from platform fee buybacks' },
      { done: false, text: 'Cross-chain bridge: Base, Optimism' },
      { done: false, text: 'Fiat on-ramp integration (Stripe / Moonpay)' },
    ],
  },
  {
    phase: 'Phase 3',
    period: 'Q4 2026 — 2027',
    title: 'Institutional & Scale',
    status: 'planned',
    color: 'var(--text-secondary)',
    dim: 'rgba(255,255,255,0.02)',
    border: 'var(--border-visible)',
    items: [
      { done: false, text: 'Institutional partnerships: REITs, family offices, hedge funds' },
      { done: false, text: 'White-label SaaS: licensed ChainEstate stack for operators' },
      { done: false, text: 'Commercial real estate: offices, warehouses, hotels' },
      { done: false, text: 'KYC-optional premium tier for regulated jurisdictions' },
      { done: false, text: 'Automated property management (IoT + on-chain reporting)' },
      { done: false, text: '$100M+ TVL milestone' },
      { done: false, text: 'CoinGecko / CoinMarketCap CEST listing' },
      { done: false, text: 'Series A fundraise' },
    ],
  },
]

export default function RoadmapPage() {
  return (
    <div>
      <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
        Docs / Roadmap
      </p>
      <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
        Roadmap
      </h1>
      <p className="text-base font-body leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        From hackathon testnet to global institutional RWA platform. Four phases spanning Q1 2026 to 2027,
        each building on the privacy infrastructure established with iExec Nox ERC-7984.
      </p>

      {/* Progress summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {[
          { label: 'Phase 0',    value: '100%',  sub: 'Testnet complete',    color: 'var(--nox-green)' },
          { label: 'Phase 1',    value: 'Q2 \'26', sub: 'Mainnet launch',    color: 'var(--gold-primary)' },
          { label: 'Phase 2',    value: 'Q3 \'26', sub: 'Growth & DAO',      color: 'var(--text-secondary)' },
          { label: 'Phase 3',    value: '2027',  sub: 'Institutional scale', color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}>
            <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>{s.label}</p>
            <p className="font-data text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--text-ghost)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {PHASES.map(phase => (
          <div
            key={phase.phase}
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${phase.border}` }}
          >
            {/* Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              style={{ background: phase.dim, borderBottom: `1px solid ${phase.border}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-body uppercase tracking-widest"
                  style={{ background: phase.status === 'current' ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.04)', color: phase.color, border: `1px solid ${phase.border}` }}
                >
                  {phase.status === 'current' ? '● Live' : phase.status === 'upcoming' ? '◎ Next' : '○ Planned'}
                </span>
                <div>
                  <span className="font-display text-sm" style={{ color: phase.color }}>{phase.phase} — {phase.title}</span>
                </div>
              </div>
              <span className="text-xs font-data" style={{ color: 'var(--text-ghost)' }}>{phase.period}</span>
            </div>

            {/* Items */}
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phase.items.map(item => (
                <div key={item.text} className="flex items-start gap-2.5 text-xs font-body">
                  <span
                    className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{
                      background: item.done ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${item.done ? 'rgba(0,229,160,0.4)' : 'var(--border-subtle)'}`,
                      color: item.done ? 'var(--nox-green)' : 'var(--text-ghost)',
                    }}
                  >
                    {item.done ? '✓' : '·'}
                  </span>
                  <span style={{ color: item.done ? 'var(--text-secondary)' : 'var(--text-ghost)' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Key milestones */}
      <div className="mt-12">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Key Milestones
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          {[
            ['Apr 2026', 'Testnet launch + hackathon submission', 'Complete', 'var(--nox-green)'],
            ['Jun 2026', 'CEST genesis airdrop claim opens',      'Scheduled', 'var(--gold-primary)'],
            ['Jun 2026', 'Arbitrum One mainnet deployment',        'Planned',   'var(--gold-primary)'],
            ['Jul 2026', 'Uniswap CEST/USDT pool launch',         'Planned',   'var(--gold-primary)'],
            ['Sep 2026', 'DAO governance goes live',               'Planned',   'var(--text-secondary)'],
            ['Dec 2026', '$10M TVL target',                        'Target',    'var(--text-secondary)'],
            ['Q1 2027',  'Institutional partnerships',             'Target',    'var(--text-secondary)'],
            ['Q2 2027',  '$100M TVL milestone',                    'Target',    'var(--text-secondary)'],
          ].map(([date, milestone, status, color], i) => (
            <div
              key={date + milestone}
              className="grid grid-cols-[120px_1fr_80px] items-center px-5 py-3.5 text-xs font-body"
              style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <span className="font-data" style={{ color: 'var(--text-ghost)' }}>{date}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{milestone}</span>
              <span className="text-right font-data text-[10px]" style={{ color: color as string }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
