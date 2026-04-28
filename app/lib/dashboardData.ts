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
]

export const DASHBOARD_INCOME_SERIES = [
  { month: 'Apr', amount: 22.4, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: 'May', amount: 24.8, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: 'Jun', amount: 23.9, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: 'Jul', amount: 27.1, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: 'Aug', amount: 26.6, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: 'Sep', amount: 28.2, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: 'Oct', amount: 29.5, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: 'Nov', amount: 28.1, encryptedLabel: '$•••', source: 'Pearl Residences' },
  { month: 'Dec', amount: 31.2, encryptedLabel: '$•••', source: 'Holiday rebook yield' },
  { month: 'Jan', amount: 29.4, encryptedLabel: '$•••', source: 'Shibuya Terrace' },
  { month: 'Feb', amount: 32.5, encryptedLabel: '$•••', source: 'Marina Heights' },
  { month: 'Mar', amount: 30.8, encryptedLabel: '$•••', source: 'Pearl Residences' },
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

export const DASHBOARD_PROPOSALS = [
  {
    id: 'CEIP-04',
    title: 'Open Riyadh Villa tranche for Q2 onboarding',
    summary: 'Add a new Middle East residential asset with a 6.7% target yield and 400k token supply.',
    status: 'Active',
    support: 82,
    endsOn: 'May 02',
  },
  {
    id: 'CEIP-03',
    title: 'Raise maintenance reserve threshold from 5% to 6%',
    summary: 'Increase reserve buffers for short-term rental assets with seasonally volatile occupancy.',
    status: 'Review',
    support: 61,
    endsOn: 'Apr 30',
  },
]

export const DASHBOARD_TRANSFER_CONTACTS = [
  {
    label: 'Treasury cold wallet',
    address: '0x19a4...92f1',
    note: 'Internal treasury settlement',
  },
  {
    label: 'Family office vault',
    address: '0x72c3...0e4b',
    note: 'Whitelisted recipient',
  },
  {
    label: 'Secondary market escrow',
    address: '0xb884...118d',
    note: 'Confidential OTC handoff',
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
