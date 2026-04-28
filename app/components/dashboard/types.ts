export type ToastType = 'success' | 'warning' | 'info' | 'error'
export type DashboardTab = 'overview' | 'properties' | 'income' | 'transfer' | 'governance' | 'settings'

export interface PortfolioPropertyPreview {
  id: string
  image: string
}

export interface PortfolioHolding {
  propertyId: string
  ticker: string
  name: string
  location: string
  tokens: number
  value: number
  monthlyIncome: number
  since: string
  occupancy: number
  allocation: number
  nextDistribution: string
  yield: number
  property?: PortfolioPropertyPreview
}

export const DASHBOARD_NAV_ITEMS: { id: DashboardTab; icon: string; label: string }[] = [
  { id: 'overview', icon: '⬡', label: 'Overview' },
  { id: 'properties', icon: '🏠', label: 'My Properties' },
  { id: 'income', icon: '💰', label: 'Income History' },
  { id: 'transfer', icon: '🔁', label: 'Transfer Tokens' },
  { id: 'governance', icon: '🗳️', label: 'Governance' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]
