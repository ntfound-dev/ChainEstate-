export default function AdminDocs() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
          Documentation
        </p>
        <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
          Control Room
        </h1>
        <p className="text-base font-body leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          The Control Room (<code className="text-xs px-1.5 py-0.5 rounded font-data" style={{ background: 'var(--bg-surface)', color: 'var(--gold-primary)' }}>/admin</code>) is
          the platform operator dashboard. It provides an overview of listed properties, rent distribution tooling,
          investor registry, and analytics. Access it from the top navigation or by visiting <strong>/admin</strong> directly.
        </p>
      </div>

      {/* Access note */}
      <div
        className="rounded-xl p-5 mb-10"
        style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)' }}
      >
        <p className="text-xs font-body uppercase tracking-widest mb-2" style={{ color: 'var(--nox-green)' }}>
          Access
        </p>
        <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The admin panel is currently <strong style={{ color: 'var(--text-primary)' }}>publicly accessible</strong> for
          hackathon demo purposes — there is no on-chain auth gate in this version. In a production build
          the panel would be restricted to wallets holding an admin NFT or mapped to a whitelisted deployer address.
        </p>
      </div>

      {/* Tabs overview */}
      <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
        Tabs
      </h2>
      <div className="space-y-6 mb-12">

        {/* Properties tab */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-lg">🏠</span>
            <div>
              <p className="font-display text-sm" style={{ color: 'var(--gold-primary)' }}>Properties</p>
              <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>Live property roster and listing wizard</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Displays all properties currently in the platform with their status, total supply, amount funded, and
              a primary action button. The table mirrors the data from{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-data" style={{ background: 'var(--bg-surface)', color: 'var(--gold-primary)' }}>
                app/lib/propertiesData.ts
              </code>.
            </p>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              {[
                ['Column', 'Source'],
                ['Property', 'propertiesData name + city'],
                ['Status', 'status field (Active / Funding / Completed)'],
                ['Total Supply', 'totalSupply formatted as USDT'],
                ['Funded', 'Hardcoded 100% for all demo properties'],
                ['Action', '"View" button — links to /properties/[id]'],
              ].map(([col, src], i) => (
                <div
                  key={col}
                  className="grid grid-cols-2 px-4 py-2.5 text-xs font-body"
                  style={{
                    background: i === 0 ? 'var(--bg-surface)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none',
                    color: i === 0 ? 'var(--text-ghost)' : 'var(--text-secondary)',
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  <span style={{ color: i === 0 ? 'var(--text-ghost)' : 'var(--gold-primary)' }}>{col}</span>
                  <span>{src}</span>
                </div>
              ))}
            </div>
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-2"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              <span style={{ color: 'var(--gold-primary)' }}>✦</span>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Listing Wizard</strong> — clicking "Add Property" opens a
                5-step modal. Steps 1–4 collect metadata (name, location, description, token economics, document links).
                Step 5 shows a success screen. <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> the wizard
                does not call{' '}
                <code className="font-data" style={{ color: 'var(--nox-green)' }}>PropertyToken.deploy()</code> in this
                version — it is a UI prototype for the listing flow.
              </p>
            </div>
          </div>
        </div>

        {/* Rent Distribution tab */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-lg">💰</span>
            <div>
              <p className="font-display text-sm" style={{ color: 'var(--gold-primary)' }}>Rent Distribution</p>
              <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>USDT rent deposit and equal-share distribution</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              This panel is built around the{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-data" style={{ background: 'var(--bg-surface)', color: 'var(--nox-green)' }}>
                RentDistributor
              </code>{' '}
              contract. The workflow has two stages:
            </p>
            <ol className="space-y-3 pl-1">
              {[
                {
                  step: '1. Deposit Rent',
                  desc: 'Operator enters a USDT amount and clicks "Deposit Rent USDT". The UI shows a confirmation dialog. In this demo version the button has no on-chain handler attached — a production build would call RentDistributor.depositRent(propertyToken, amount).',
                  status: 'UI only',
                  color: 'var(--gold-primary)',
                },
                {
                  step: '2. Distribute Rent',
                  desc: 'After deposit, operator clicks "Distribute Rent". A simulated 6.5-second countdown runs (via setTimeout), then shows a success screen with a hardcoded transaction hash (0xabc...def). The real on-chain call would be RentDistributor.distributeRent(propertyToken).',
                  status: 'Simulated',
                  color: 'rgba(255,140,0,0.9)',
                },
              ].map(item => (
                <li key={item.step} className="flex gap-3">
                  <span
                    className="shrink-0 text-[10px] font-body uppercase tracking-widest mt-0.5 px-2 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.08)', color: item.color, border: `1px solid ${item.color}33`, height: 'fit-content' }}
                  >
                    {item.status}
                  </span>
                  <div>
                    <p className="text-sm font-body font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.step}</p>
                    <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}
            >
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--nox-green)' }}>On-chain contract:</strong>{' '}
                <code className="font-data">RentDistributor</code> is fully deployed and tested. It splits USDT equally
                across all token holders using{' '}
                <code className="font-data">distributeRent()</code>. 17 tests cover deposit, distribution, and edge
                cases. The admin UI front-end for this flow is a demo UI layer — the contract itself is production-ready.
              </p>
            </div>
          </div>
        </div>

        {/* Registry tab */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-lg">📋</span>
            <div>
              <p className="font-display text-sm" style={{ color: 'var(--gold-primary)' }}>Registry</p>
              <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>Investor wallet list and KYC status</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Shows a table of registered investor wallets with their KYC status, country, and token holdings.
              Operators can search and filter by status.
            </p>
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-2"
              style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)' }}
            >
              <span style={{ color: 'rgba(255,100,100,0.9)' }}>!</span>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Demo data:</strong> The three wallet rows shown (0x1Ab…3F4,
                0x5Cd…8G9, 0x2Ef…1H2) are hardcoded placeholders with fake KYC states and countries. In production
                this panel would query the{' '}
                <code className="font-data" style={{ color: 'var(--nox-green)' }}>InvestorRegistry</code>{' '}
                contract for real registered addresses and their approval status.
              </p>
            </div>
            <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-data" style={{ background: 'var(--bg-surface)', color: 'var(--nox-green)' }}>
                InvestorRegistry
              </code>{' '}
              contract is deployed on Arbitrum Sepolia. Functions:{' '}
              <code className="font-data">registerInvestor(wallet)</code>,{' '}
              <code className="font-data">approveInvestor(wallet)</code>,{' '}
              <code className="font-data">revokeInvestor(wallet)</code>,{' '}
              <code className="font-data">isApproved(wallet)</code>.
            </p>
          </div>
        </div>

        {/* Analytics tab */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-lg">📊</span>
            <div>
              <p className="font-display text-sm" style={{ color: 'var(--gold-primary)' }}>Analytics</p>
              <p className="text-xs font-body" style={{ color: 'var(--text-ghost)' }}>Platform-wide performance metrics</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Displays headline KPIs — total volume, active investors, properties funded, average transaction time.
            </p>
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-2"
              style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)' }}
            >
              <span style={{ color: 'rgba(255,100,100,0.9)' }}>!</span>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Static figures:</strong> The "347 wallets" and "31 sec avg"
                values are hardcoded for the demo. A production build would derive these from on-chain event logs —
                indexing{' '}
                <code className="font-data" style={{ color: 'var(--nox-green)' }}>TokensPurchased</code>,{' '}
                <code className="font-data">Transfer</code>, and{' '}
                <code className="font-data">RentDistributed</code> events.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live vs Demo summary */}
      <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
        Live vs Demo Summary
      </h2>
      <div className="rounded-xl overflow-hidden mb-12" style={{ border: '1px solid var(--border-visible)' }}>
        {[
          ['Feature', 'Status', 'Notes'],
          ['Property table',          'Live',      'Reads from propertiesData.ts — mirrors on-chain properties'],
          ['Listing Wizard UI',       'UI Demo',   'Collects inputs; no contract call on submit'],
          ['Deposit Rent button',     'UI Demo',   'No onClick handler; contract call not wired'],
          ['Distribute Rent flow',    'Simulated', 'setTimeout(6500) + hardcoded txHash'],
          ['RentDistributor contract','Live',       '17 tests, fully deployed, equal-share distribution'],
          ['Registry table',          'Demo data', '3 hardcoded wallets; InvestorRegistry contract deployed'],
          ['Analytics figures',       'Demo data', 'Hardcoded "347 wallets", "31 sec avg"'],
          ['Auth / access control',   'None',      'No wallet check; any user can visit /admin'],
        ].map(([feature, status, notes], i) => {
          const statusColor =
            status === 'Live' ? 'var(--nox-green)' :
            status === 'Simulated' ? 'rgba(255,140,0,0.9)' :
            'rgba(255,100,100,0.9)'
          const statusBg =
            status === 'Live' ? 'rgba(0,229,160,0.08)' :
            status === 'Simulated' ? 'rgba(255,140,0,0.08)' :
            'rgba(255,80,80,0.08)'
          return (
            <div
              key={feature}
              className="grid grid-cols-[1fr_120px_2fr] px-5 py-3 text-xs font-body"
              style={{
                background: i === 0 ? 'var(--bg-surface)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderBottom: i < 8 ? '1px solid var(--border-subtle)' : 'none',
                color: i === 0 ? 'var(--text-ghost)' : 'var(--text-secondary)',
                fontWeight: i === 0 ? 600 : 400,
                alignItems: 'center',
              }}
            >
              <span style={{ color: i === 0 ? 'var(--text-ghost)' : 'var(--text-primary)' }}>{feature}</span>
              {i === 0 ? (
                <span>{status}</span>
              ) : (
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-widest w-fit"
                  style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}33` }}
                >
                  {status}
                </span>
              )}
              <span>{notes}</span>
            </div>
          )
        })}
      </div>

      {/* Listing Wizard flow */}
      <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
        Listing Wizard — Step by Step
      </h2>
      <div className="space-y-3 mb-12">
        {[
          { step: 1, title: 'Basic Info',       desc: 'Property name, city, country, asset type (Residential / Commercial / Mixed). All fields required before advancing.' },
          { step: 2, title: 'Description',      desc: 'Long-form description of the property. Min 50 characters enforced.' },
          { step: 3, title: 'Token Economics',  desc: 'Total supply (USDT), price per token, target raise, expected annual yield %. Calculated fields shown live.' },
          { step: 4, title: 'Documents',        desc: 'IPFS CID fields for SPV Agreement, Valuation Report, and Lease Agreement. Links are validated on-page.' },
          { step: 5, title: 'Success Screen',   desc: 'Animated checkmark + "Property Listed Successfully!" message. No contract is called. Modal can be closed after this step.' },
        ].map(item => (
          <div
            key={item.step}
            className="flex gap-4 rounded-xl px-5 py-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
          >
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-data font-bold"
              style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-primary)', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              {item.step}
            </div>
            <div>
              <p className="text-sm font-body font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </p>
              <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Production roadmap */}
      <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
        Productionizing the Control Room
      </h2>
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
      >
        <ul className="space-y-3">
          {[
            { item: 'Auth gate', detail: 'Require deployer wallet or admin NFT to access /admin — redirect others to /.' },
            { item: 'Listing Wizard', detail: 'Wire step 5 to deploy a new PropertyToken contract via ethers/wagmi writeContract, store address in deployments.json.' },
            { item: 'Deposit Rent', detail: 'Add onClick that calls USDT.approve(RentDistributor, amount) then RentDistributor.depositRent(propertyToken, amount).' },
            { item: 'Distribute Rent', detail: 'Replace setTimeout mock with waitForTransactionReceipt on the real distributeRent() tx hash.' },
            { item: 'Registry', detail: 'Replace hardcoded rows with useContractRead calls to InvestorRegistry.getRegisteredInvestors().' },
            { item: 'Analytics', detail: 'Index TokensPurchased + Transfer events (via The Graph or viem getLogs) and aggregate for real KPIs.' },
          ].map(({ item, detail }) => (
            <li key={item} className="flex gap-3 text-sm font-body">
              <span style={{ color: 'var(--nox-green)', marginTop: 1 }}>→</span>
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>{item}:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
