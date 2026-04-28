'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { MarketHeader } from '../components/market/MarketHeader'
import { MarketListingsPanel } from '../components/market/MarketListingsPanel'
import { MarketTradePanel } from '../components/market/MarketTradePanel'
import type { MarketListingView, TradeType } from '../components/market/types'
import { TransactionModal } from '../components/ui/TransactionModal'
import { useToast } from '../components/ui/Toast'
import { useNoxHandleClient } from '../components/web3/useNoxHandleClient'
import { MARKET_LISTINGS } from '../lib/marketData'
import { PROPERTIES } from '../lib/propertiesData'

export default function MarketPage() {
  const { isConnected } = useAccount()
  const { showToast } = useToast()
  const { handleClient, status: handleStatus, error: handleError } = useNoxHandleClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MarketListingView | null>(null)
  const [tradeType, setTradeType] = useState<TradeType>('buy')
  const [amount, setAmount] = useState('')
  const [txOpen, setTxOpen] = useState(false)
  const [mode, setMode] = useState<TradeType>('buy')

  const filtered = MARKET_LISTINGS.filter(
    (listing) =>
      listing.ticker.toLowerCase().includes(search.toLowerCase()) ||
      listing.name.toLowerCase().includes(search.toLowerCase()),
  )

  const total = amount && selected ? (parseFloat(amount) * selected.lastPrice).toFixed(2) : '0.00'

  const handleExecute = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    const selectedProperty = PROPERTIES.find((property) => property.ticker === selected?.ticker)
    if (!selectedProperty) {
      showToast('Property contract missing', 'This listing is not mapped to a confidential token contract yet.', 'error')
      return
    }

    if (!handleClient) {
      showToast(
        'Nox handle client not ready',
        handleStatus === 'initializing'
          ? 'Waiting for the iExec Nox SDK to initialize on Arbitrum Sepolia.'
          : handleError ?? 'Reconnect your wallet to prepare confidential trade inputs.',
        'warning',
      )
      return
    }

    try {
      const encryptedPayload = await handleClient.encryptInput(
        BigInt(Math.max(1, Math.trunc(Number(amount)))),
        'uint256',
        selectedProperty.contractAddress as `0x${string}`,
      )

      showToast(
        'Trade payload encrypted',
        `Handle ${encryptedPayload.handle.slice(0, 10)}... staged for ${selectedProperty.ticker}.`,
        'info',
      )
    } catch (error) {
      showToast(
        'Nox encryption failed',
        error instanceof Error ? error.message : 'Unable to encrypt the confidential trade amount.',
        'error',
      )
      return
    }

    setTxOpen(true)
    setTimeout(() => {
      setTxOpen(false)
      showToast(
        `${tradeType === 'buy' ? 'Buy' : 'Sell'} order executed!`,
        `${amount} ${selected?.ticker} · 🔒 Confidential`,
        'success',
      )
      setAmount('')
    }, 6500)
  }

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-8xl px-6">
        <MarketHeader mode={mode} onModeChange={setMode} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <MarketListingsPanel
            search={search}
            filtered={filtered}
            selectedTicker={selected?.ticker}
            mode={mode}
            onSearchChange={setSearch}
            onSelect={(listing, nextTradeType) => {
              setSelected(listing)
              setTradeType(nextTradeType)
            }}
          />

          <MarketTradePanel
            selected={selected}
            tradeType={tradeType}
            amount={amount}
            total={total}
            isConnected={isConnected}
            handleStatus={handleStatus}
            onTradeTypeChange={setTradeType}
            onAmountChange={setAmount}
            onExecute={handleExecute}
            onClear={() => setSelected(null)}
          />
        </div>
      </div>

      <TransactionModal
        isOpen={txOpen}
        onClose={() => setTxOpen(false)}
        txHash="0x7f3a1b2c4d5e6f7890abcdef1234567890abcd"
      />
    </div>
  )
}
