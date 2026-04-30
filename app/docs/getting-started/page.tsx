export default function GettingStartedPage() {
  return (
    <div>
      <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
        Docs / Getting Started
      </p>
      <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
        Getting Started
      </h1>
      <p className="text-base font-body leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        Everything you need to install, configure, and run ChainEstate locally — or just use the live app on Arbitrum Sepolia right now.
      </p>

      {/* Option A — use live app */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Option A — Use the Live App
        </h2>
        <div className="rounded-xl p-6" style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.2)' }}>
          <p className="text-sm font-body leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            No setup needed. Everything is already deployed on Arbitrum Sepolia.
          </p>
          {[
            { step: '1', title: 'Open the live app', text: 'Go to chain-estate-rouge.vercel.app' },
            { step: '2', title: 'Connect MetaMask', text: 'Click "Connect Wallet" — MetaMask will prompt you to switch to Arbitrum Sepolia (chainId 421614). The app adds the network automatically.' },
            { step: '3', title: 'Get ETH for gas', text: 'Need Sepolia ETH first? Claim from Google Cloud Web3 Faucet → bridge to Arbitrum Sepolia via portal.arbitrum.io.' },
            { step: '4', title: 'Claim testnet tokens', text: 'Visit /faucet — claim 1,000 USDT and 2,400 CEST. One claim per address per 24h.' },
            { step: '5', title: 'Buy a property token', text: 'Go to /properties → pick a property → enter amount → click "🔒 Encrypt & Buy with USDT". The iExec TEE task runs automatically.' },
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

      {/* Option B — run locally */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Option B — Run Locally
        </h2>

        {/* Prerequisites */}
        <h3 className="font-display text-base mb-3" style={{ color: 'var(--text-primary)' }}>Prerequisites</h3>
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border-visible)' }}>
          {[
            ['Node.js', '20+', 'node --version'],
            ['npm', '10+', 'npm --version'],
            ['MetaMask', 'Browser extension', 'metamask.io'],
            ['Arbitrum Sepolia ETH', 'For gas fees', 'Google Cloud Faucet → Arbitrum Bridge'],
          ].map(([dep, ver, note], i, arr) => (
            <div
              key={dep}
              className="grid grid-cols-[1fr_100px_1.5fr] items-center px-5 py-3.5 text-xs font-body"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{dep}</span>
              <span style={{ color: 'var(--text-ghost)' }}>{ver}</span>
              <code className="font-data text-[10px]" style={{ color: 'var(--gold-primary)' }}>{note}</code>
            </div>
          ))}
        </div>

        {/* Step 1 — Clone */}
        <h3 className="font-display text-base mb-3" style={{ color: 'var(--text-primary)' }}>1. Clone & Install</h3>
        <div className="rounded-xl p-4 mb-6 font-data text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--nox-green)' }}>
          <pre className="overflow-x-auto leading-relaxed">{`git clone https://github.com/ntfound-dev/ChainEstate-
cd ChainEstate
npm install`}</pre>
        </div>

        {/* Step 2 — Env */}
        <h3 className="font-display text-base mb-3" style={{ color: 'var(--text-primary)' }}>2. Environment Variables</h3>
        <div className="rounded-xl p-4 mb-3 font-data text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}>
          <pre className="overflow-x-auto leading-relaxed">{`cp .env.example .env.local`}</pre>
        </div>
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border-visible)' }}>
          <div className="grid grid-cols-[1.2fr_1fr_1.5fr] px-5 py-2.5 text-[10px] font-body uppercase tracking-widest" style={{ background: 'var(--bg-elevated)', color: 'var(--text-ghost)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>Variable</span><span>Required</span><span>Description</span>
          </div>
          {[
            ['PRIVATE_KEY', 'Yes', 'Wallet private key — signs iExec request orders server-side. Needs RLC on Bellecour (0.1 RLC/task).'],
            ['IEXEC_IAPP_ADDRESS', 'Yes', '0xB11bC7288eE239F6536829E410d22Eb514C5E282 — the deployed Intel TDX iApp'],
            ['ARBITRUM_SEPOLIA_RPC', 'Yes', 'Server-side RPC — use PublicNode or Infura (https://arbitrum-sepolia-rpc.publicnode.com)'],
            ['NEXT_PUBLIC_RPC_URL', 'Yes', 'Client-side RPC — same value as ARBITRUM_SEPOLIA_RPC'],
            ['NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC', 'Yes', 'MetaMask fallback RPC — same value'],
            ['CHAINGPT_API_KEY', 'Optional', 'ChainGPT API key for the AI assistant — get at chaingpt.org'],
          ].map(([key, req, desc], i, arr) => (
            <div
              key={key}
              className="grid grid-cols-[1.2fr_1fr_1.5fr] items-start px-5 py-3.5 text-xs"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <code className="font-data text-[11px]" style={{ color: 'var(--gold-primary)' }}>{key}</code>
              <span className="font-body" style={{ color: req === 'Yes' ? 'var(--nox-green)' : 'var(--text-ghost)' }}>{req}</span>
              <span className="font-body leading-relaxed" style={{ color: 'var(--text-ghost)' }}>{desc}</span>
            </div>
          ))}
        </div>

        {/* Step 3 — Run */}
        <h3 className="font-display text-base mb-3" style={{ color: 'var(--text-primary)' }}>3. Run Development Server</h3>
        <div className="rounded-xl p-4 mb-2 font-data text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--nox-green)' }}>
          <pre>{`npm run dev
# Open http://localhost:3000`}</pre>
        </div>
        <p className="text-xs font-body mb-6" style={{ color: 'var(--text-ghost)' }}>
          Then visit <code className="font-data" style={{ color: 'var(--gold-primary)' }}>/faucet</code> to claim testnet USDT and CEST.
        </p>

        {/* Step 4 — Tests */}
        <h3 className="font-display text-base mb-3" style={{ color: 'var(--text-primary)' }}>4. Run Tests</h3>
        <div className="rounded-xl p-4 font-data text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}>
          <pre className="overflow-x-auto leading-relaxed">{`npm run test          # 73 passing
npx hardhat coverage  # Coverage report`}</pre>
        </div>
      </section>

      {/* Privacy Architecture */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Privacy Architecture — iExec TEE Flow
        </h2>
        <p className="text-sm font-body leading-relaxed mb-6 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Raw token amounts <strong style={{ color: 'var(--text-primary)' }}>never touch the blockchain in plaintext</strong>. Every buy flows through an Intel TDX TEE (Trusted Execution Environment) before any value reaches Arbitrum Sepolia.
        </p>
        <div className="rounded-xl p-5 font-data text-xs leading-relaxed overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}>
          <p className="mb-1" style={{ color: 'var(--text-ghost)' }}>// TEE buy flow</p>
          <pre>{`Browser
   │
   ▼  POST /api/iexec-buy  { tokenAmount, contractAddress, buyerAddress }
   │
Next.js API (Server)
   │  iExec SDK: fetchAppOrderbook → fetchWorkerpoolOrderbook
   │             → createRequestorder → matchOrders
   │  Returns: { taskid }
   │
   ▼  Browser polls GET /api/iexec-poll?taskid=...  every 5s
   │
iExec Network — Intel TDX TEE Worker (Bellecour)
   │  iApp receives args inside verified hardware enclave
   │  → POST Nox Gateway: { value: uint256Hex, solidityType,
   │                         applicationContract, owner }
   │  ← Nox Gateway returns: { handle: bytes32, handleProof: bytes }
   │  iApp writes result.json → IPFS
   │
   ▼  /api/iexec-poll: downloads result → returns { handle, handleProof }
   │
Browser — MetaMask
   │  1. USDT.approve(propertyContract, amount × 1_000_000)
   │  2. PropertyToken.purchaseTokens(handle, handleProof, clearAmount)
   │     └─ Nox.fromExternal(handle, handleProof) → euint256 (encrypted)
   ▼
Arbitrum Sepolia — only encrypted handle on-chain`}</pre>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            { title: 'Nox Gateway', desc: 'Only accepts requests from verified TEE enclaves — raw amounts cannot be injected by a malicious frontend.' },
            { title: 'fromExternal()', desc: 'On-chain verification of the TDX attestation proof. Smart contract rejects any handle not signed by a real Intel TDX enclave.' },
            { title: 'toEuint256() NOT used', desc: 'The bypass function is intentionally excluded — it would allow plaintext-to-encrypted conversion without TEE, defeating the privacy model.' },
          ].map(c => (
            <div key={c.title} className="rounded-xl p-4" style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.15)' }}>
              <p className="text-xs font-data mb-2" style={{ color: 'var(--nox-green)' }}>{c.title}</p>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction flows */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Transaction Flows
        </h2>
        <div className="space-y-4">
          {[
            {
              title: 'Primary Market Buy',
              route: '/properties/[id]',
              color: 'var(--nox-green)',
              dim: 'rgba(0,229,160,0.04)',
              border: 'rgba(0,229,160,0.2)',
              steps: [
                'POST /api/iexec-buy → iExec TEE task submitted (taskid returned)',
                'Frontend polls /api/iexec-poll every 5s until: { handle, handleProof }',
                'USDT.approve(propertyContract, tokenAmount × 1_000_000)',
                'PropertyToken.purchaseTokens(handle, handleProof, clearAmount)',
                '→ balance stored as euint256 via Nox.fromExternal()',
              ],
            },
            {
              title: 'Secondary Market — List',
              route: '/market',
              color: 'var(--gold-primary)',
              dim: 'rgba(212,175,55,0.04)',
              border: 'rgba(212,175,55,0.2)',
              steps: [
                'PropertyToken.grantOperator(secondaryMarket, expiry)   // 7-day window recommended',
                'SecondaryMarket.createListing(tokenContract, propertyId, tokenAmount, pricePerToken)',
                '→ pricePerToken in USDT 6 decimals (e.g. $1.025 = 1_025_000)',
                '→ returns listingId',
              ],
            },
            {
              title: 'Secondary Market — Buy',
              route: '/market',
              color: 'var(--gold-primary)',
              dim: 'rgba(212,175,55,0.04)',
              border: 'rgba(212,175,55,0.2)',
              steps: [
                'POST /api/iexec-buy → TEE task for listing\'s tokenAmount',
                'Frontend polls until: { handle, handleProof }',
                'USDT.approve(secondaryMarket, listingTokenAmount × pricePerToken)',
                'SecondaryMarket.executeBuy(listingId, handle, handleProof)',
                '→ confidentialTransferFrom (encrypted) via Nox.fromExternal()',
              ],
            },
            {
              title: 'Direct Transfer',
              route: '/dashboard → Transfer tab',
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
              steps: [
                'PropertyToken.grantOperator(recipientAddress, expiry)',
                '→ expiry = block.timestamp + 7 days (recommended)',
                '→ recipient can now call transferFrom on your behalf',
              ],
            },
            {
              title: 'Governance',
              route: '/dashboard → Governance tab',
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
              steps: [
                'ConfidentialGovernance.createProposal(propertyId, proposalType, description)',
                '→ caller must be a verified PropertyToken holder',
                'ConfidentialGovernance.castVote(proposalId, option)',
                '→ option: 0 = For · 1 = Against · 2 = Abstain',
                '→ 1 address = 1 vote (balance-blind)',
                'ConfidentialGovernance.finalizeProposal(proposalId)  // after deadline, any caller',
              ],
            },
          ].map(flow => (
            <div key={flow.title} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${flow.border}` }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ background: flow.dim, borderBottom: `1px solid ${flow.border}` }}>
                <span className="font-display text-sm" style={{ color: flow.color }}>{flow.title}</span>
                <code className="text-[10px] font-data" style={{ color: 'var(--text-ghost)' }}>{flow.route}</code>
              </div>
              <div className="px-5 py-4">
                {flow.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                    <span className="font-data text-[10px] shrink-0 mt-0.5" style={{ color: 'var(--text-ghost)' }}>{i + 1}.</span>
                    <code className="font-data text-[11px] leading-relaxed break-all" style={{ color: step.startsWith('→') ? 'var(--text-ghost)' : 'var(--text-secondary)' }}>{step}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage guide */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Dashboard Guide
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div className="grid grid-cols-[120px_1fr] px-5 py-2.5 text-[10px] font-body uppercase tracking-widest" style={{ background: 'var(--bg-elevated)', color: 'var(--text-ghost)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>Tab</span><span>What you can do</span>
          </div>
          {[
            ['Portfolio', 'See all your property token holdings per contract. Holdings are private on-chain — amounts shown from local state only.'],
            ['Transfer', 'Send tokens to any wallet: call grantOperator(recipient, expiry) → recipient can then pull your tokens via the SDK.'],
            ['Market', 'Create new secondary market listings (grantOperator + createListing) or cancel active listings you own.'],
            ['Governance', 'Create proposals for properties you hold. Vote For / Against / Abstain. 1 address = 1 vote regardless of balance.'],
            ['Rewards', 'View pending rent distributions and past distribution history for your holdings.'],
          ].map(([tab, desc], i, arr) => (
            <div
              key={tab}
              className="grid grid-cols-[120px_1fr] items-start px-5 py-4 text-xs font-body"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <span className="font-data font-semibold" style={{ color: 'var(--gold-primary)' }}>{tab}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Deploy contracts */}
      <section className="mb-14">
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Deploy Smart Contracts (Optional)
        </h2>
        <p className="text-sm font-body leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          Only needed if deploying your own instance. Official contracts are already live on Arbitrum Sepolia.
        </p>
        <div className="rounded-xl p-4 mb-4 font-data text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}>
          <pre className="overflow-x-auto leading-relaxed">{`# Compile all contracts
npx hardhat compile

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia

# Verify on Arbiscan
npx hardhat verify --network arbitrumSepolia <ADDRESS> [constructor args]`}</pre>
        </div>
        <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
          Deployment addresses are saved to <code className="font-data" style={{ color: 'var(--gold-primary)' }}>deployments.json</code>. All ABIs in <code className="font-data" style={{ color: 'var(--gold-primary)' }}>artifacts/</code> and <code className="font-data" style={{ color: 'var(--gold-primary)' }}>app/lib/contracts.ts</code>.
        </p>
      </section>

      {/* Testnet resources */}
      <section>
        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Testnet Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Arbitrum Sepolia ETH (Gas)',
              steps: [
                '1. Get Sepolia ETH: cloud.google.com/application/web3/faucet',
                '2. Bridge to Arbitrum Sepolia: portal.arbitrum.io/bridge',
                '3. Select "Arbitrum Sepolia" as destination',
              ],
              color: 'var(--gold-primary)',
              dim: 'rgba(212,175,55,0.06)',
              border: 'rgba(212,175,55,0.2)',
            },
            {
              title: 'Testnet RLC (iExec TEE tasks)',
              steps: [
                '1. Get testnet RLC: faucet.iex.ec (Bellecour network)',
                '2. 0.1 RLC consumed per TEE task (buy flow)',
                '3. Store in PRIVATE_KEY wallet (server-side signer)',
              ],
              color: 'var(--nox-green)',
              dim: 'rgba(0,229,160,0.04)',
              border: 'rgba(0,229,160,0.2)',
            },
            {
              title: 'USDT + CEST (App tokens)',
              steps: [
                '1. Connect wallet → visit /faucet',
                '2. Click "Claim 1,000 USDT" → confirm tx',
                '3. Click "Claim 2,400 CEST" → confirm tx',
              ],
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
            },
            {
              title: 'iExec Explorer',
              steps: [
                'iApp: explorer.iex.ec/bellecour/app/0xB11bC7…',
                'Requester: explorer.iex.ec/bellecour/address/0x834De7…',
                '4/5 tasks COMPLETED on April 30, 2026',
              ],
              color: 'var(--text-secondary)',
              dim: 'rgba(255,255,255,0.02)',
              border: 'var(--border-visible)',
            },
          ].map(r => (
            <div key={r.title} className="rounded-xl p-5" style={{ background: r.dim, border: `1px solid ${r.border}` }}>
              <p className="font-display text-sm mb-3" style={{ color: r.color }}>{r.title}</p>
              <ul className="space-y-1.5">
                {r.steps.map(s => (
                  <li key={s} className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
