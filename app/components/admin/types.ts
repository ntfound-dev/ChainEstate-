export interface AdminPropertyView {
  id: string
  name: string
  location: string
  region: string
  totalTokens: number
  funded: number
  yield: number
  status: 'active' | 'sold_out'
}

export interface AdminSummary {
  active: number
  totalValue: number
  averageYield: number
}

export interface RegistryRow {
  wallet: string
  role: string
  scope: string
  status: string
}
