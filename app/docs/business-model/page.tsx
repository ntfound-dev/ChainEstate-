export default function BusinessModelPage() {
  return (
    <div>
      <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
        Docs / Business Model
      </p>
      <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
        Business Model
      </h1>
      <p className="text-base font-body leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        ChainEstate operates a platform fee model layered over a tokenized real estate marketplace.
        Revenue comes from transaction fees, property listing fees, and CEST token utility. The platform
        is self-sustaining from day one through secondary market volume.
      </p>

      {/* Market Opportunity */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Market Opportunity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Global Real Estate',        value: '$326T',  sub: 'Total market size' },
            { label: 'Tokenizable TAM',            value: '$16T',   sub: '~5% addressable in 5 years' },
            { label: 'RWA Market (2024)',          value: '$12B',   sub: 'On-chain real assets today' },
            { label: 'RWA Market (2030 projected)',value: '$16T',   sub: 'Boston Consulting Group est.' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}>
              <p className="text-[10px] font-body uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>{s.label}</p>
              <p className="font-data text-xl font-bold" style={{ color: 'var(--gold-primary)' }}>{s.value}</p>
              <p className="text-[10px] font-body mt-0.5" style={{ color: 'var(--text-ghost)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}>
          <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The global Real World Asset (RWA) tokenization market is projected to reach $16 trillion by 2030
            (BCG). Real estate represents the largest single category. ChainEstate targets the high-value
            residential segment (Dubai, Singapore, London, Tokyo, Barcelona) — markets with strong rental
            yields and international investor demand. Even capturing 0.1% of tokenized real estate volume
            generates <strong style={{ color: 'var(--text-primary)' }}>$16 billion in managed assets</strong>.
          </p>
        </div>
      </section>

      {/* Revenue Streams */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Revenue Streams
        </h2>

        <div className="space-y-4">
          {[
            {
              stream: '01 · Secondary Market Fees',
              color: 'var(--gold-primary)',
              dim: 'rgba(212,175,55,0.06)',
              border: 'rgba(212,175,55,0.2)',
              desc: 'Every peer-to-peer trade on SecondaryMarket.sol charges a 0.5% platform fee. CEST stakers receive discounts — PLATINUM tier trades for free, which drives CEST demand.',
              calc: 'Example: $10M monthly trading volume × 0.5% = $50,000/month platform revenue',
              items: [
                'Base fee: 0.5% per trade',
                'BRONZE (1K CEST): −10% → 0.45%',
                'SILVER (10K CEST): −30% → 0.35%',
                'GOLD (50K CEST): −50% → 0.25%',
                'PLATINUM (200K CEST): −100% → free',
              ],
            },
            {
              stream: '02 · Rent Distribution Fee',
              color: 'var(--nox-green)',
              dim: 'rgba(0,229,160,0.04)',
              border: 'rgba(0,229,160,0.2)',
              desc: 'When property operators distribute rental income via RentDistributor.sol, 5% goes to the platform treasury and 5% to a maintenance reserve. Holders receive the remaining 90%.',
              calc: 'Example: $2.64M TVL at avg 6.8% yield = $179K/year rent → $8,960/year platform fee',
              items: [
                'Platform fee: 5% of gross rent',
                'Maintenance reserve: 5% (platform-managed)',
                'Investor payout: 90%',
                'Monthly distributions, fully automated',
                'On-chain auditable — totals visible, per-investor private',
              ],
            },
            {
              stream: '03 · Property Listing Fee (Future)',
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
              desc: 'Property operators (developers, SPV managers) will pay a one-time listing fee to tokenize their asset on ChainEstate. Currently free during hackathon/testnet phase — onlyOwner callable.',
              calc: 'Target: $5,000–$25,000 per property listing on mainnet',
              items: [
                'One-time fee per property tokenization',
                'Covers legal review + smart contract deployment',
                'Registry.listProperty() gated to onlyOwner today',
                'Will open to whitelisted operators on mainnet',
              ],
            },
            {
              stream: '04 · SaaS Licensing (Future)',
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
              desc: 'Real estate investment managers and family offices will license the ChainEstate stack (contracts + frontend + privacy layer) as white-label infrastructure for their own tokenized funds.',
              calc: 'Target: $50,000–$200,000/year SaaS license per institutional client',
              items: [
                'Full stack: smart contracts + Next.js frontend + iExec Nox privacy',
                'Custom property types (commercial, industrial, REIT-like)',
                'Dedicated support + integration',
                'Revenue share model optional',
              ],
            },
          ].map(r => (
            <div key={r.stream} className="rounded-xl p-6" style={{ background: r.dim, border: `1px solid ${r.border}` }}>
              <h3 className="font-display text-base mb-2" style={{ color: r.color }}>{r.stream}</h3>
              <p className="text-sm font-body leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
              <div className="rounded-lg px-4 py-2 mb-4 text-xs font-data" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }}>
                {r.calc}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {r.items.map(it => (
                  <li key={it} className="flex items-start gap-2 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                    <span style={{ color: r.color }}>·</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CEST Token Economy */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          CEST Token Economy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-display text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Token Facts</h3>
            {[
              ['Symbol',       'CEST'],
              ['Price',        '$0.04 USD'],
              ['Total Supply', '1,000,000,000'],
              ['Market Cap',   '$40,000,000'],
              ['Standard',     'ERC20Votes (governance)'],
              ['Decimals',     '18'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-xs font-body" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-ghost)' }}>{k}</span>
                <span className="font-data" style={{ color: 'var(--gold-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-display text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Allocation</h3>
            {[
              ['Ecosystem',  '300M', '30%', 'DEX liquidity, partnerships, grants'],
              ['Airdrop',    '250M', '25%', 'Genesis community distribution'],
              ['Investor',   '200M', '20%', 'Seed + strategic investors'],
              ['Team',       '150M', '15%', '4-year vest, 1-year cliff'],
              ['Reserve',    '100M', '10%', 'Emergency + future use'],
            ].map(([cat, amt, pct, note]) => (
              <div key={cat} className="py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between text-xs font-body mb-0.5">
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  <span className="font-data" style={{ color: 'var(--gold-primary)' }}>{amt} <span style={{ color: 'var(--text-ghost)' }}>({pct})</span></span>
                </div>
                <p className="text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>{note}</p>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-display text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Token Value Drivers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'Fee reduction demand', icon: '💰', desc: 'Users stake CEST to unlock trading fee discounts. Higher volume → more demand for staking tiers.' },
            { title: 'Governance power',     icon: '🗳️', desc: 'CEST holders vote on platform decisions: fee changes, new property approvals, protocol upgrades.' },
            { title: 'Deflationary pressure', icon: '🔥', desc: 'A portion of platform fees will buy back and burn CEST — reducing supply as TVL grows.' },
          ].map(d => (
            <div key={d.title} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}>
              <span className="text-xl block mb-2">{d.icon}</span>
              <p className="font-display text-xs mb-2" style={{ color: 'var(--gold-primary)' }}>{d.title}</p>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Unit Economics */}
      <section>
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Unit Economics
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div className="px-5 py-3 text-[10px] font-body uppercase tracking-widest grid grid-cols-[1.5fr_1fr_1fr_1fr]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-ghost)' }}>
            <span>Scenario</span><span>TVL</span><span>Avg Volume/mo</span><span>Est. Revenue/mo</span>
          </div>
          {[
            ['Testnet (today)', '$2.64M',  '$200K',  '$1,000'],
            ['Mainnet launch',  '$10M',    '$2M',    '$10,000'],
            ['Growth (Year 1)', '$100M',   '$20M',   '$100,000'],
            ['Scale (Year 2)',  '$500M',   '$100M',  '$500,000'],
          ].map(([sc, tvl, vol, rev], i) => (
            <div
              key={sc}
              className="px-5 py-3.5 grid grid-cols-[1.5fr_1fr_1fr_1fr] text-xs font-body"
              style={{ borderTop: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <span style={{ color: 'var(--text-primary)' }}>{sc}</span>
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{tvl}</span>
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{vol}</span>
              <span className="font-data" style={{ color: 'var(--nox-green)' }}>{rev}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] font-body" style={{ color: 'var(--text-ghost)' }}>
          Revenue = secondary market fees (0.5%) + rent distribution fees (5%). Excludes listing fees and SaaS.
        </p>
      </section>
    </div>
  )
}
