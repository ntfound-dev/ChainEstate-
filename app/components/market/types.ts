export type TradeType = 'buy' | 'sell'
export type HandleStatus = 'idle' | 'initializing' | 'ready' | 'error'

export interface MarketListingView {
  ticker: string
  name: string
  lastPrice: number
  change24h: number
  changePositive: boolean
}
