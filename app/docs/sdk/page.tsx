const ENV_VARS = [
  { key: 'NEXT_PUBLIC_CHAIN_ID',        value: '421614',      desc: 'Arbitrum Sepolia chain ID' },
  { key: 'NEXT_PUBLIC_RPC_URL',         value: 'https://sepolia-rollup.arbitrum.io/rpc', desc: 'Public Arbitrum Sepolia RPC' },
  { key: 'NEXT_PUBLIC_USDT_ADDRESS',    value: '0x9a822B9A...',  desc: 'Mock USDT contract' },
  { key: 'NEXT_PUBLIC_REGISTRY',        value: '0xCdBCA38E...', desc: 'PropertyRegistry — lists properties and tracks holders' },
  { key: 'NEXT_PUBLIC_SECONDARY_MARKET',value: '0x77836405...', desc: 'SecondaryMarket — P2P order book' },
  { key: 'NEXT_PUBLIC_RENT_DISTRIBUTOR',value: '0x80E0e5f6...', desc: 'RentDistributor — monthly USDT to holders' },
  { key: 'NEXT_PUBLIC_CEST_TOKEN',      value: '0xC6c08db8...', desc: 'CEST ERC20Votes governance token' },
]

const CODE_SECTIONS = [
  {
    id: 'setup',
    title: '1. Install & Setup',
    color: 'var(--gold-primary)',
    dim: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.2)',
    lang: 'bash',
    desc: 'Install Wagmi v2, Viem, and the iExec Nox handle SDK.',
    code: `# Core dependencies
npm install wagmi viem @tanstack/react-query

# iExec Nox handle client (ERC-7984 encryption)
npm install @iexec-nox/handle`,
  },
  {
    id: 'handle-client',
    title: '2. Create Nox Handle Client',
    color: 'var(--nox-green)',
    dim: 'rgba(0,229,160,0.04)',
    border: 'rgba(0,229,160,0.2)',
    lang: 'typescript',
    desc: 'Initialise the iExec Nox handle client using the connected wallet\'s viem WalletClient. This client communicates with the Intel TDX TEE gateway to encrypt inputs.',
    code: `import { createViemHandleClient } from '@iexec-nox/handle'
import { useWalletClient } from 'wagmi'

function useNoxHandleClient() {
  const { data: walletClient } = useWalletClient()

  if (!walletClient) return null

  // createViemHandleClient wraps the wallet for TEE communication
  return createViemHandleClient(walletClient)
}`,
  },
  {
    id: 'encrypt',
    title: '3. Encrypt a Token Amount',
    color: 'var(--nox-green)',
    dim: 'rgba(0,229,160,0.04)',
    border: 'rgba(0,229,160,0.2)',
    lang: 'typescript',
    desc: 'Call encryptInput with the token amount, type, and the contract address that will receive the encrypted handle. Returns { handle, handleProof } — both needed for on-chain calls.',
    code: `import { createViemHandleClient } from '@iexec-nox/handle'

const handleClient = createViemHandleClient(walletClient)

// Encrypt 100 tokens for PEARL-DXB-001
const { handle, handleProof } = await handleClient.encryptInput(
  100,                         // tokenAmount (number or bigint)
  'uint256',                   // Solidity type
  '0x853D51fB...'              // PropertyToken contract address (the consumer)
)

// handle      → bytes32  (encrypted representation of "100")
// handleProof → bytes    (TEE attestation proof)
// Both are required as args to purchaseTokens()`,
  },
  {
    id: 'buy',
    title: '4. Buy Flow — purchaseTokens',
    color: 'var(--nox-green)',
    dim: 'rgba(0,229,160,0.04)',
    border: 'rgba(0,229,160,0.2)',
    lang: 'typescript',
    desc: 'Full 3-step buy flow: encrypt token amount with Nox TEE, approve USDT spending, then call purchaseTokens. The contract stores the balance as encrypted euint256.',
    code: `import { createViemHandleClient }  from '@iexec-nox/handle'
import { useWriteContract, usePublicClient } from 'wagmi'
import { ADDRESSES, ERC20_ABI, PROPERTY_TOKEN_ABI } from '@/app/lib/contracts'

// Step 1 — Encrypt amount via Intel TDX TEE
const handleClient = createViemHandleClient(walletClient)
const { handle, handleProof } = await handleClient.encryptInput(
  tokenAmount,        // e.g. 100 (integer token count)
  'uint256',
  propertyTokenAddress
)

// Step 2 — Approve USDT (6 decimals)
const approveTx = await writeContractAsync({
  address: ADDRESSES.usdt,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [propertyTokenAddress, BigInt(tokenAmount) * 1_000_000n],
})
await publicClient.waitForTransactionReceipt({ hash: approveTx })

// Step 3 — Purchase (encrypted balance stored on-chain)
const purchaseTx = await writeContractAsync({
  address: propertyTokenAddress,
  abi: PROPERTY_TOKEN_ABI,
  functionName: 'purchaseTokens',
  args: [handle, handleProof, BigInt(tokenAmount)],
})
await publicClient.waitForTransactionReceipt({ hash: purchaseTx })`,
  },
  {
    id: 'sell-list',
    title: '5. Sell Flow — grantOperator + createListing',
    color: 'var(--gold-primary)',
    dim: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.2)',
    lang: 'typescript',
    desc: 'Sellers first grant SecondaryMarket as an operator (with an expiry), then create a public listing. Token amounts are public in the listing but balances remain encrypted.',
    code: `import { ADDRESSES, PROPERTY_TOKEN_ABI, SECONDARY_MARKET_ABI } from '@/app/lib/contracts'

// Step 1 — Grant SecondaryMarket as operator (7-day expiry)
const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600)
const grantTx = await writeContractAsync({
  address: propertyTokenAddress,
  abi: PROPERTY_TOKEN_ABI,
  functionName: 'grantOperator',
  args: [ADDRESSES.secondaryMarket, expiry],
})
await publicClient.waitForTransactionReceipt({ hash: grantTx })

// Step 2 — Create listing
// pricePerToken in USDT 6 decimals: $1.025 = 1_025_000
const pricePerTokenUsdt = BigInt(Math.round(parseFloat(sellPrice) * 1_000_000))
const listTx = await writeContractAsync({
  address: ADDRESSES.secondaryMarket,
  abi: SECONDARY_MARKET_ABI,
  functionName: 'createListing',
  args: [
    propertyTokenAddress,    // address tokenContract
    BigInt(propertyId),      // uint256 propertyId
    BigInt(tokenAmount),     // uint256 tokenAmount
    pricePerTokenUsdt,       // uint256 pricePerToken (USDT 6 dec)
  ],
})
await publicClient.waitForTransactionReceipt({ hash: listTx })
// Returns listingId (uint256) — store it to cancel or reference`,
  },
  {
    id: 'buy-secondary',
    title: '6. Buy Secondary — executeBuy',
    color: 'var(--gold-primary)',
    dim: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.2)',
    lang: 'typescript',
    desc: 'To buy an existing listing: approve USDT for the total cost, then call executeBuy. The SecondaryMarket calls confidentialTransferFrom internally — amounts move encrypted.',
    code: `import { ADDRESSES, ERC20_ABI, SECONDARY_MARKET_ABI } from '@/app/lib/contracts'

// totalCost = tokenAmount × pricePerToken (both already uint256)
const totalUsdt = listing.tokenAmount * listing.pricePerToken  // BigInt math

// Step 1 — Approve USDT to SecondaryMarket
const approveTx = await writeContractAsync({
  address: ADDRESSES.usdt,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [ADDRESSES.secondaryMarket, totalUsdt],
})
await publicClient.waitForTransactionReceipt({ hash: approveTx })

// Step 2 — Execute buy (0.5% fee deducted)
const buyTx = await writeContractAsync({
  address: ADDRESSES.secondaryMarket,
  abi: SECONDARY_MARKET_ABI,
  functionName: 'executeBuy',
  args: [BigInt(listingId)],
})
await publicClient.waitForTransactionReceipt({ hash: buyTx })`,
  },
  {
    id: 'read-listing',
    title: '7. Read a Listing',
    color: 'var(--text-secondary)',
    dim: 'rgba(255,255,255,0.02)',
    border: 'var(--border-visible)',
    lang: 'typescript',
    desc: 'Use useReadContract or publicClient.readContract to read a listing struct. All fields are public — only encrypted token amounts in PropertyToken are hidden.',
    code: `import { useReadContract } from 'wagmi'
import { ADDRESSES, SECONDARY_MARKET_ABI } from '@/app/lib/contracts'

const { data: listing } = useReadContract({
  address: ADDRESSES.secondaryMarket,
  abi: SECONDARY_MARKET_ABI,
  functionName: 'listings',
  args: [BigInt(listingId)],
})

// listing → {
//   listingId:    bigint,
//   seller:       address,
//   tokenContract:address,
//   propertyId:   bigint,
//   tokenAmount:  bigint,
//   pricePerToken:bigint,   // USDT 6 decimals
//   listedAt:     bigint,   // unix timestamp
//   active:       boolean,
// }

// Display price: Number(listing.pricePerToken) / 1_000_000`,
  },
]

const ABI_TABLES = [
  {
    name: 'PROPERTY_TOKEN_ABI',
    color: 'var(--nox-green)',
    rows: [
      { fn: 'purchaseTokens', sig: '(bytes32 handle, bytes handleProof, uint256 clearAmount)', returns: 'void',    access: 'public',   note: 'Core buy — Nox TEE required' },
      { fn: 'grantOperator',  sig: '(address operator, uint256 expiry)',                        returns: 'void',    access: 'holder',   note: 'Grant SecondaryMarket as operator' },
      { fn: 'pricePerToken',  sig: '()',                                                         returns: 'uint256', access: 'view',     note: 'USDT 6 dec — all 5 = 1_000_000' },
      { fn: 'propertyId',     sig: '()',                                                         returns: 'uint256', access: 'view',     note: 'ID in PropertyRegistry (1–5)' },
    ],
  },
  {
    name: 'SECONDARY_MARKET_ABI',
    color: 'var(--gold-primary)',
    rows: [
      { fn: 'createListing', sig: '(address tokenContract, uint256 propertyId, uint256 tokenAmount, uint256 pricePerToken)', returns: 'uint256 listingId', access: 'public', note: 'grantOperator first' },
      { fn: 'executeBuy',    sig: '(uint256 listingId)',                                                                       returns: 'void',             access: 'public', note: 'approve USDT first' },
      { fn: 'cancelListing', sig: '(uint256 listingId)',                                                                       returns: 'void',             access: 'seller', note: 'Any time while active' },
      { fn: 'listings',      sig: '(uint256)',                                                                                 returns: 'Listing',          access: 'view',   note: 'Full listing struct' },
    ],
  },
  {
    name: 'ERC20_ABI (USDT / CEST)',
    color: 'var(--text-secondary)',
    rows: [
      { fn: 'approve',   sig: '(address spender, uint256 amount)', returns: 'bool',    access: 'nonpayable', note: 'Required before buy/executeBuy' },
      { fn: 'allowance', sig: '(address owner, address spender)',   returns: 'uint256', access: 'view',       note: 'Check before tx to avoid unnecessary approval' },
      { fn: 'balanceOf', sig: '(address account)',                  returns: 'uint256', access: 'view',       note: 'USDT: 6 dec. CEST: 18 dec.' },
      { fn: 'transfer',  sig: '(address to, uint256 amount)',       returns: 'bool',    access: 'nonpayable', note: 'Direct transfer (no approval needed)' },
    ],
  },
]

export default function SDKPage() {
  return (
    <div>
      <p className="text-xs font-body uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--nox-green)' }}>
        Docs / SDK & Integration
      </p>
      <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
        SDK & Integration
      </h1>
      <p className="text-base font-body leading-relaxed mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        Step-by-step code for integrating with ChainEstate contracts using Wagmi v2, Viem, and the iExec Nox
        handle SDK. All flows are implemented in the frontend — see{' '}
        <code className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>app/properties/[id]/page.tsx</code>{' '}
        and{' '}
        <code className="font-data text-sm" style={{ color: 'var(--gold-primary)' }}>app/market/page.tsx</code>{' '}
        for production usage.
      </p>

      {/* Environment Variables */}
      <section className="mb-12">
        <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
          Contract Addresses
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
          <div className="px-5 py-2 text-[10px] font-body uppercase tracking-widest grid grid-cols-[1fr_1.2fr_1.5fr]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-ghost)' }}>
            <span>Name</span><span>Address (Arb Sepolia)</span><span>Role</span>
          </div>
          {[
            ['USDT (Mock)',          '0x9a822B9A50D090CfcCa1e6474efCd653112d8501', 'ERC-20 stablecoin — 6 decimals'],
            ['PropertyRegistry',    '0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e', 'Factory + holder registry'],
            ['SecondaryMarket',     '0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa', 'P2P order book'],
            ['RentDistributor',     '0x80E0e5f6488FA2726c042a204344281974f72609', 'Monthly USDT distribution'],
            ['CESTToken',           '0xC6c08db835636Cf40530dDf90Bf3Bb15bc78190D', 'ERC20Votes governance token'],
            ['PEARL-DXB-001',       '0x853D51fBD5E288BF189FE0126d59f855c821a641', 'PropertyToken (example)'],
          ].map(([name, addr, role], i) => (
            <div
              key={name}
              className="px-5 py-3 grid grid-cols-[1fr_1.2fr_1.5fr] text-xs font-body"
              style={{ borderTop: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
            >
              <span className="font-data" style={{ color: 'var(--gold-primary)' }}>{name}</span>
              <span className="font-data text-[10px]" style={{ color: 'var(--text-ghost)' }}>
                {addr.slice(0, 10)}…{addr.slice(-6)}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{role}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-body" style={{ color: 'var(--text-ghost)' }}>
          Import from <code className="font-data" style={{ color: 'var(--gold-primary)' }}>app/lib/contracts.ts</code> — ADDRESSES, ERC20_ABI, PROPERTY_TOKEN_ABI, SECONDARY_MARKET_ABI.
        </p>
      </section>

      {/* Code sections */}
      <section className="mb-12">
        <h2 className="font-display text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Code Reference
        </h2>

        <div className="space-y-6">
          {CODE_SECTIONS.map(section => (
            <div
              key={section.id}
              id={section.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${section.border}` }}
            >
              {/* Header */}
              <div className="px-5 py-3 flex items-center gap-3" style={{ background: section.dim, borderBottom: `1px solid ${section.border}` }}>
                <h3 className="font-display text-sm" style={{ color: section.color }}>{section.title}</h3>
                <span className="text-[10px] font-data px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-ghost)', border: '1px solid var(--border-subtle)' }}>
                  {section.lang}
                </span>
              </div>

              <div className="px-5 pt-4 pb-2">
                <p className="text-sm font-body leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {section.desc}
                </p>
              </div>

              {/* Code block */}
              <div className="mx-5 mb-5 rounded-lg overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-[10px] font-data" style={{ color: 'var(--text-ghost)' }}>{section.lang}</span>
                  <div className="flex gap-1.5">
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                      <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <pre className="px-4 py-4 text-[12px] font-data leading-relaxed overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
                  <code>{section.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABI Reference */}
      <section className="mb-12">
        <h2 className="font-display text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
          ABI Reference
        </h2>

        <div className="space-y-6">
          {ABI_TABLES.map(table => (
            <div key={table.name} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-visible)' }}>
              <div className="px-5 py-3" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                <code className="font-data text-sm" style={{ color: table.color }}>{table.name}</code>
              </div>
              <div className="px-5 py-2 text-[10px] font-body uppercase tracking-widest grid grid-cols-[100px_1fr_80px_60px_1fr]" style={{ background: 'var(--bg-surface)', color: 'var(--text-ghost)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Function</span><span>Signature</span><span>Returns</span><span>Access</span><span>Note</span>
              </div>
              {table.rows.map((row, i) => (
                <div
                  key={row.fn}
                  className="px-5 py-3 grid grid-cols-[100px_1fr_80px_60px_1fr] text-xs font-body gap-2 items-start"
                  style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)' }}
                >
                  <code className="font-data text-[11px]" style={{ color: table.color }}>{row.fn}</code>
                  <code className="font-data text-[10px] leading-relaxed" style={{ color: 'var(--text-ghost)' }}>{row.sig}</code>
                  <code className="font-data text-[10px]" style={{ color: 'var(--text-secondary)' }}>{row.returns}</code>
                  <span className="text-[10px] px-1.5 py-0.5 rounded self-start" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-ghost)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>{row.access}</span>
                  <span style={{ color: 'var(--text-ghost)' }}>{row.note}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Key patterns */}
      <section>
        <h2 className="font-display text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Key Patterns & Gotchas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'USDT has 6 decimals',
              color: 'var(--gold-primary)',
              points: [
                '$1.00 = 1_000_000 (uint256)',
                '$1.025 = 1_025_000',
                'Always use BigInt: BigInt(Math.round(price * 1e6))',
                'CEST uses 18 decimals (standard ERC20)',
              ],
            },
            {
              title: 'BigInt TypeScript',
              color: 'var(--gold-primary)',
              points: [
                'tsconfig: "target": "ES2020" required',
                'Literal syntax: 1_000_000n is ES2020+',
                'Wagmi args[] must be bigint, not number',
                'BigInt(x) for runtime conversion',
              ],
            },
            {
              title: 'SSR / Hydration',
              color: 'var(--nox-green)',
              points: [
                'useAccount() returns undefined on server',
                'Use useClientAccount() hook for safe client-only reads',
                'All Web3 components must be "use client"',
                'Wrap in <WagmiProvider> + <QueryClientProvider>',
              ],
            },
            {
              title: 'Nox handle lifetime',
              color: 'var(--nox-green)',
              points: [
                'handle + handleProof are one-time use per tx',
                'Re-encrypt before each purchaseTokens call',
                'handleProof is TEE attestation — cannot be reused',
                'Encrypt must happen after wallet is connected',
              ],
            },
            {
              title: 'operator grant expiry',
              color: 'var(--text-secondary)',
              points: [
                'grantOperator expiry = unix timestamp (seconds)',
                '7-day: Date.now()/1000 + 7*24*3600',
                'If listing active past expiry, executeBuy reverts',
                'Cancel listing before expiry if not selling',
              ],
            },
            {
              title: 'ERC-7984 privacy rules',
              color: 'var(--text-secondary)',
              points: [
                'Transfers never revert on insufficient balance',
                'Events never emit token amounts',
                'balanceOf(address) returns euint256 — unreadable',
                'Only TEE Handle Gateway can decrypt (Intel TDX)',
              ],
            },
          ].map(card => (
            <div
              key={card.title}
              className="rounded-xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-visible)' }}
            >
              <p className="font-display text-xs mb-3" style={{ color: card.color }}>{card.title}</p>
              <ul className="space-y-1.5">
                {card.points.map(pt => (
                  <li key={pt} className="flex items-start gap-2 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                    <span style={{ color: card.color }}>·</span>{pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
