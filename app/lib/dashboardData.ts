// All 5 properties defined here. Dashboard filters to only show ones where
// the connected wallet is a verified holder via PropertyRegistry.getPropertyHolders().
// Token amounts / values are estimates — real balances are euint256 (encrypted on-chain).
export const DASHBOARD_HOLDINGS = [
  {
    propertyId: 'pearl-dxb-001',
    ticker: 'PEARL-DXB-001',
    name: 'Pearl Residences',
    location: 'Dubai, UAE',
    tokens: 5000,
    value: 5100,
    monthlyIncome: 28.9,
    since: 'Mar 2026',
    occupancy: 94,
    allocation: 50,
    nextDistribution: 'May 05',
    yield: 6.8,
  },
  {
    propertyId: 'shibuya-tyo-001',
    ticker: 'SHIBUYA-TYO-001',
    name: 'Shibuya Terrace',
    location: 'Tokyo, JP',
    tokens: 3000,
    value: 2940,
    monthlyIncome: 14.5,
    since: 'Feb 2026',
    occupancy: 91,
    allocation: 29,
    nextDistribution: 'May 07',
    yield: 5.9,
  },
  {
    propertyId: 'marina-sgp-001',
    ticker: 'MARINA-SGP-001',
    name: 'Marina Heights',
    location: 'Singapore',
    tokens: 2000,
    value: 2100,
    monthlyIncome: 12.6,
    since: 'Jan 2026',
    occupancy: 97,
    allocation: 21,
    nextDistribution: 'May 10',
    yield: 7.2,
  },
  {
    propertyId: 'canary-lon-001',
    ticker: 'CANARY-LON-001',
    name: 'Canary Wharf Executive',
    location: 'London, UK',
    tokens: 4000,
    value: 3960,
    monthlyIncome: 17.8,
    since: 'Apr 2026',
    occupancy: 88,
    allocation: 35,
    nextDistribution: 'May 08',
    yield: 5.4,
  },
  {
    propertyId: 'azure-bcn-001',
    ticker: 'AZURE-BCN-001',
    name: 'Azure Barcelona Suite',
    location: 'Barcelona, Spain',
    tokens: 1500,
    value: 1545,
    monthlyIncome: 10.4,
    since: 'Apr 2026',
    occupancy: 92,
    allocation: 15,
    nextDistribution: 'May 06',
    yield: 8.1,
  },
]

// 12-month rolling history ending Apr 2026 (current month). All USDT.
export const DASHBOARD_INCOME_SERIES = [
  { month: "Apr '25", amount: 22.4, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: "May '25", amount: 24.8, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: "Jun '25", amount: 23.9, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: "Jul '25", amount: 27.1, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: "Aug '25", amount: 26.6, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: "Sep '25", amount: 28.2, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: "Oct '25", amount: 29.5, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: "Nov '25", amount: 28.1, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: "Dec '25", amount: 31.2, encryptedLabel: '$•••', source: 'Holiday rebook yield' },
  { month: "Jan '26", amount: 29.4, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: "Feb '26", amount: 32.5, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: "Mar '26", amount: 30.8, encryptedLabel: '$•••', source: 'Pearl Residences' },
]

export const DASHBOARD_ACTIVITY = [
  {
    time: '2026/04/26 09:18',
    title: 'Rent distribution settled',
    detail: 'PEARL-DXB-001 · 347 investor wallets',
    status: 'success' as const,
  },
  {
    time: '2026/04/24 18:42',
    title: 'Decrypt session approved',
    detail: 'Portfolio view unlocked from trusted device',
    status: 'info' as const,
  },
  {
    time: '2026/04/22 13:05',
    title: 'Secondary market buy matched',
    detail: 'SHIBUYA-TYO-001 · confidential order fill',
    status: 'success' as const,
  },
  {
    time: '2026/04/20 11:12',
    title: 'Governance snapshot queued',
    detail: 'CEIP-04 enters review window',
    status: 'warning' as const,
  },
]

// onChainProposalId = real uint256 ID in ConfidentialGovernance.sol
// propertyId = real on-chain property ID (1-5)
export const DASHBOARD_PROPOSALS = [
  {
    id: 'CEIP-04',
    onChainProposalId: 1,
    propertyId: 1,
    title: 'Open Riyadh Villa tranche for Q2 onboarding',
    summary: 'Add a new Middle East residential asset with a 6.7% target yield and 400k token supply.',
    status: 'Active',
    support: 82,
    endsOn: 'May 02',
  },
  {
    id: 'CEIP-03',
    onChainProposalId: 2,
    propertyId: 2,
    title: 'Raise maintenance reserve threshold from 5% to 6%',
    summary: 'Increase reserve buffers for short-term rental assets with seasonally volatile occupancy.',
    status: 'Review',
    support: 61,
    endsOn: 'Apr 30',
  },
]

// Full addresses stored encrypted off-chain; display format is truncated for UI
export const DASHBOARD_TRANSFER_CONTACTS = [
  {
    label:   'Treasury cold wallet',
    address: '0x19A4c8F3Bde2E7a1C5D0e8FbA3917c60429e92f1',
    note:    'Internal treasury settlement',
  },
  {
    label:   'Family office vault',
    address: '0x72C3a5F0Dce1B9847Ab2F3Ec60D174A881220e4b',
    note:    'Whitelisted recipient',
  },
  {
    label:   'Secondary market escrow',
    address: '0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa',
    note:    'SecondaryMarket.sol — grants operator access for listing',
  },
]

export const DASHBOARD_WATCHLIST = [
  {
    ticker: 'CANARY-LON-001',
    location: 'London, UK',
    status: 'Watch',
    note: 'Funding window closes in 6 days',
  },
  {
    ticker: 'AZURE-BCN-001',
    location: 'Barcelona, Spain',
    status: 'Hot',
    note: 'Yield premium above portfolio average',
  },
  {
    ticker: 'PEARL-DXB-001',
    location: 'Dubai, UAE',
    status: 'Live',
    note: 'Most active secondary market spread',
  },
]
