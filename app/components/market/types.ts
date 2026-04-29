export type TradeType = 'buy' | 'sell'
export type HandleStatus = 'idle' | 'initializing' | 'ready' | 'error'
export type TradeStep = 'idle' | 'encrypting' | 'approving' | 'executing' | 'granting' | 'listing' | 'done' | 'error'

export interface MarketListingView {
  listingId?: number
  ticker: string
  name: string
  location?: string
  lastPrice: number
  change24h: number
  changePositive: boolean
  volume24h?: number
  high24h?: number
  low24h?: number
  ask?: number
  bid?: number
  marketCap?: number
  yield?: number
  isDex?: boolean
}
