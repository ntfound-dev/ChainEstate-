export default function ProblemSolutionPage() {
  return (
    <div>
      <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
        Docs / Problem & Solution
      </p>
      <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
        Problem & Solution
      </h1>
      <p className="text-base font-body leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        Real estate is the world&apos;s largest asset class at $326 trillion — yet it remains one of the least
        accessible and most opaque investments for ordinary people. ChainEstate solves this with
        fractional tokenization, instant liquidity, and financial privacy powered by Intel TDX TEE.
      </p>

      {/* The Problem */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          The Problem
        </h2>

        <div className="space-y-4 mb-8">
          {[
            {
              title: 'Massive entry barrier',
              icon: '🚧',
              problem: 'Buying property requires $100,000–$1,000,000+ in capital. Even a "cheap" studio in Dubai costs $150K minimum.',
              impact: '99% of the global population is permanently excluded from real estate wealth.',
            },
            {
              title: 'Zero liquidity',
              icon: '🧊',
              problem: 'You cannot sell 20% of your apartment. Real estate is all-or-nothing — sell the whole thing or nothing. A typical sale takes 3–12 months.',
              impact: 'Capital is locked. Investors cannot rebalance, exit, or access equity without full disposal.',
            },
            {
              title: 'No financial privacy',
              icon: '👁️',
              problem: 'On public blockchains, every wallet\'s real estate portfolio is visible to anyone. A whale accumulating Dubai apartments is front-run before deals close.',
              impact: 'RWA (Real World Asset) tokens on Ethereum or Solana today expose your entire net worth publicly.',
            },
            {
              title: 'Rent opacity',
              icon: '❓',
              problem: 'Traditional rental income distribution is manual, trust-based, and opaque. Investors often cannot verify they received a fair share.',
              impact: 'No on-chain proof of yield. Platform operators can skim undetected.',
            },
            {
              title: 'Geographic exclusion',
              icon: '🌍',
              problem: 'Cross-border real estate investment involves lawyers, notaries, local bank accounts, tax filings in multiple jurisdictions, and 6–18 months of paperwork.',
              impact: 'Only wealthy individuals with legal teams can invest internationally.',
            },
          ].map(p => (
            <div
              key={p.title}
              className="rounded-xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{p.icon}</span>
                <h3 className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
              </div>
              <p className="text-sm font-body mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {p.problem}
              </p>
              <div className="flex items-start gap-2">
                <span className="text-xs mt-0.5" style={{ color: 'var(--status-error)' }}>⚠</span>
                <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>{p.impact}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Existing solutions and failures */}
        <h3 className="font-display text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Existing Solutions — Why They Fail
        </h3>
        <div
          className="rounded-xl overflow-hidden mb-4"
          style={{ border: '1px solid var(--border-visible)' }}
        >
          {[
            ['REITs (Real Estate Investment Trusts)', 'Requires broker account. Geographic limits. Exposes portfolio publicly in SEC filings. Illiquid during market closures.'],
            ['Traditional RWA tokens (Ethereum)', 'Every wallet balance is fully public — no privacy. High gas fees. Regulatory grey area.'],
            ['Real estate crowdfunding platforms', 'Centralized, can freeze funds. No secondary market. Often requires accredited investor status.'],
            ['StrataDeed / competitors', '"ZK privacy" claims — most use ZK proofs only for tx validity, not for hiding balances on-chain.'],
          ].map(([name, fail], i, arr) => (
            <div
              key={name}
              className="grid grid-cols-[1fr_1.4fr] px-5 py-3.5"
              style={{
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              <span className="text-xs font-data" style={{ color: 'var(--text-secondary)' }}>{name}</span>
              <span className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>{fail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The Solution */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          The Solution
        </h2>

        <div className="space-y-4 mb-8">
          {[
            {
              problem: 'Massive entry barrier',
              solution: 'Fractional tokens from $1',
              icon: '✓',
              detail: 'Each PropertyToken represents $1 USDT of equity. Anyone with a wallet and USDT can invest — no minimum, no broker, no paperwork. A user in Indonesia can own $50 of a Dubai penthouse today.',
              color: 'var(--nox-green)',
            },
            {
              problem: 'Zero liquidity',
              solution: 'Real on-chain secondary market',
              icon: '✓',
              detail: 'SecondaryMarket.sol enables peer-to-peer listing and instant settlement. Sellers call grantOperator + createListing. Buyers call executeBuy. Settlement is one transaction — no waiting.',
              color: 'var(--nox-green)',
            },
            {
              problem: 'No financial privacy',
              solution: 'iExec Nox ERC-7984 — Intel TDX TEE',
              icon: '🔒',
              detail: 'PropertyToken balances are stored as euint256 — encrypted on-chain. Only the holder can decrypt via the iExec Handle Gateway (Intel TDX). On-chain observers see only a ciphertext — impossible to infer holdings.',
              color: 'var(--gold-primary)',
            },
            {
              problem: 'Rent opacity',
              solution: 'Automated on-chain distribution',
              icon: '✓',
              detail: 'RentDistributor.sol receives monthly USDT from the property operator and distributes 90% to holders automatically. Platform takes 5%, maintenance reserve 5%. All totals are on-chain auditable.',
              color: 'var(--nox-green)',
            },
            {
              problem: 'Geographic exclusion',
              solution: 'Permissionless — any wallet worldwide',
              icon: '✓',
              detail: 'No KYC, no jurisdiction restrictions, no broker. Connect MetaMask, get testnet USDT from the faucet, and invest in 60 seconds from anywhere in the world.',
              color: 'var(--nox-green)',
            },
          ].map(s => (
            <div
              key={s.problem}
              className="rounded-xl p-5"
              style={{ background: 'var(--bg-surface)', border: `1px solid var(--border-visible)` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-base font-bold mt-0.5" style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <p className="text-[10px] font-body uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-ghost)' }}>
                    Solves: {s.problem}
                  </p>
                  <h3 className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>{s.solution}</h3>
                </div>
              </div>
              <p className="text-sm font-body leading-relaxed pl-6" style={{ color: 'var(--text-secondary)' }}>
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Concrete example */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Concrete Example — Alice Buys Dubai Property
        </h2>
        <div
          className="rounded-xl p-6"
          style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.2)' }}
        >
          {[
            { step: '1', title: 'Alice visits /faucet', text: 'Claims 1,000 testnet USDT. No KYC, no broker. 30 seconds.' },
            { step: '2', title: 'Opens Pearl Residences, Dubai', text: 'Sees 78% funded, 6.8% yield, $500,000 total value. Decides to invest $100.' },
            { step: '3', title: 'Clicks "Encrypt & Buy"', text: 'The @iexec-nox/handle SDK sends her tokenAmount to the Intel TDX TEE. Returns an encrypted {handle, handleProof}.' },
            { step: '4', title: 'USDT approved + purchase on-chain', text: 'Two wallet confirmations: approve(propertyContract, 100_000_000) then purchaseTokens(handle, handleProof, 100). Both on Arbitrum Sepolia.' },
            { step: '5', title: 'Alice holds 100 PEARL-DXB-001 tokens', text: 'Her balance is stored as euint256 — encrypted. Nobody can see she holds 100 tokens. Not even the platform.' },
            { step: '6', title: 'Monthly rent arrives', text: 'RentDistributor receives USDT from the property operator. 90% distributed equally to all holders. Alice receives ~$0.57 USDT automatically.' },
            { step: '7', title: 'Alice sells half on secondary market', text: 'Calls grantOperator + createListing(50 tokens, $1.025/token). A buyer executes. Alice receives 51.25 USDT (after 0.5% fee). All confidential.' },
          ].map((s, i, arr) => (
            <div
              key={s.step}
              className="flex gap-4"
              style={{ paddingBottom: i < arr.length - 1 ? '16px' : '0', marginBottom: i < arr.length - 1 ? '16px' : '0', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,229,160,0.1)' : 'none' }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-data"
                style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--nox-green)', border: '1px solid rgba(0,229,160,0.3)' }}
              >
                {s.step}
              </div>
              <div>
                <p className="text-sm font-display mb-1" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy comparison */}
      <section>
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Privacy Comparison
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)' }}>
            <p className="font-display text-sm mb-4" style={{ color: 'var(--status-error)' }}>❌ Other RWA Platforms</p>
            {[
              'Balance visible: address → 10,000 PROP tokens (readable by anyone)',
              'Transfer amount public: "Alice sent 500 tokens to Bob"',
              '"ZK privacy" = validity proofs only, amounts still visible',
              'Portfolio analysis: competitors can see your exact holdings',
              'Front-running: large buyers identified before deals close',
            ].map(pt => (
              <div key={pt} className="flex items-start gap-2 mb-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--status-error)' }}>✕</span>
                {pt}
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5" style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.2)' }}>
            <p className="font-display text-sm mb-4" style={{ color: 'var(--nox-green)' }}>✓ ChainEstate + iExec Nox</p>
            {[
              'Balance encrypted: address → 0x8f3a... (euint256 ciphertext)',
              'Transfer amounts hidden: only handle + proof on-chain',
              'Intel TDX TEE hardware: genuine privacy, not software claims',
              'Portfolio invisible: positions unreadable without Handle Gateway',
              'No front-running: accumulation strategy stays private',
            ].map(pt => (
              <div key={pt} className="flex items-start gap-2 mb-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--nox-green)' }}>✓</span>
                {pt}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
