'use client'

import { useState } from 'react'
import { useWriteContract, usePublicClient } from 'wagmi'
import { useClientAccount as useAccount } from '../components/web3/useClientAccount'
import { MarketHeader } from '../components/market/MarketHeader'
import { MarketListingsPanel } from '../components/market/MarketListingsPanel'
import { MarketTradePanel } from '../components/market/MarketTradePanel'
import type { MarketListingView, TradeStep, TradeType } from '../components/market/types'
import { TransactionModal } from '../components/ui/TransactionModal'
import { useToast } from '../components/ui/Toast'
import { MARKET_LISTINGS, CEST_LISTING } from '../lib/marketData'
import { PROPERTIES } from '../lib/propertiesData'
import { ADDRESSES, ERC20_ABI, PROPERTY_TOKEN_ABI, SECONDARY_MARKET_ABI } from '../lib/contracts'

export default function MarketPage() {
  const { isConnected } = useAccount()
  const { showToast } = useToast()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MarketListingView | null>(null)
  const [tradeType, setTradeType] = useState<TradeType>('buy')
  const [amount, setAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [tradeStep, setTradeStep] = useState<TradeStep>('idle')
  const [txOpen, setTxOpen] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [mode, setMode] = useState<TradeType>('buy')

  // CEST always at top; property tokens filterable by search
  const allListings = [CEST_LISTING, ...MARKET_LISTINGS]
  const filtered = allListings.filter(
    (listing) =>
      listing.ticker.toLowerCase().includes(search.toLowerCase()) ||
      listing.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Total cost: buy uses ask price, sell uses user-entered price
  const tradePrice = tradeType === 'buy'
    ? (selected?.ask ?? selected?.lastPrice ?? 0)
    : (parseFloat(sellPrice) || 0)
  const total = amount && selected ? (parseFloat(amount) * tradePrice).toFixed(2) : '0.00'

  const handleExecute = async () => {
    if (!amount || parseFloat(amount) <= 0 || !selected) return

    const property = PROPERTIES.find(p => p.ticker === selected.ticker)
    if (!property) {
      showToast('Property not found', 'This listing is not mapped to a deployed contract.', 'error')
      return
    }

    const tokenAmount = BigInt(Math.max(1, Math.trunc(Number(amount))))

    try {
      if (tradeType === 'buy') {
        // ── Secondary market BUY: approve USDT → executeBuy ──────────────
        if (!selected.listingId) {
          showToast('No listing ID', 'This listing does not have an on-chain ID yet.', 'error')
          return
        }

        // Price is in USDT 6 decimals: ask × 1_000_000, rounded
        const priceUsdt6 = BigInt(Math.round(tradePrice * 1_000_000))
        const totalUsdt = tokenAmount * priceUsdt6

        setTradeStep('approving')
        showToast('Approve USDT', 'Step 1/2 — approve USDT for the secondary market.', 'info')

        const approveTx = await writeContractAsync({
          address: ADDRESSES.usdt,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ADDRESSES.secondaryMarket, totalUsdt],
          gas: 80_000n,
        })
        await publicClient!.waitForTransactionReceipt({ hash: approveTx })

        setTradeStep('executing')
        showToast('Execute buy', 'Step 2/2 — confirm purchase in your wallet.', 'info')

        const buyTx = await writeContractAsync({
          address: ADDRESSES.secondaryMarket,
          abi: SECONDARY_MARKET_ABI,
          functionName: 'executeBuy',
          args: [BigInt(selected.listingId)],
          gas: 400_000n,
        })
        await publicClient!.waitForTransactionReceipt({ hash: buyTx })

        setTxHash(buyTx)
        setTradeStep('done')
        setTxOpen(true)
        showToast('Buy complete!', `${amount} ${selected.ticker} · 🔒 Confidential`, 'success')
        setAmount('')

      } else {
        // ── Secondary market SELL: grantOperator → createListing ─────────
        if (!sellPrice || parseFloat(sellPrice) <= 0) {
          showToast('Enter a price', 'Set your ask price per token in USDT.', 'warning')
          return
        }

        // Price must be in USDT 6 decimals: e.g. $1.025 → 1_025_000
        const pricePerTokenUsdt = BigInt(Math.round(parseFloat(sellPrice) * 1_000_000))
        // Operator expiry: 7 days from now
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600)

        setTradeStep('granting')
        showToast('Grant operator', 'Step 1/2 — allow the market to transfer your tokens.', 'info')

        const grantTx = await writeContractAsync({
          address: property.contractAddress as `0x${string}`,
          abi: PROPERTY_TOKEN_ABI,
          functionName: 'grantOperator',
          args: [ADDRESSES.secondaryMarket, expiry],
          gas: 200_000n,
        })
        await publicClient!.waitForTransactionReceipt({ hash: grantTx })

        setTradeStep('listing')
        showToast('Create listing', 'Step 2/2 — confirm listing creation in your wallet.', 'info')

        const listTx = await writeContractAsync({
          address: ADDRESSES.secondaryMarket,
          abi: SECONDARY_MARKET_ABI,
          functionName: 'createListing',
          args: [
            property.contractAddress as `0x${string}`,
            BigInt(property.tokenId),
            tokenAmount,
            pricePerTokenUsdt,
          ],
          gas: 300_000n,
        })
        await publicClient!.waitForTransactionReceipt({ hash: listTx })

        setTxHash(listTx)
        setTradeStep('done')
        setTxOpen(true)
        showToast(
          'Listed!',
          `${amount} ${property.ticker} @ $${sellPrice} USDT/token · Live on SecondaryMarket.sol`,
          'success'
        )
        setAmount('')
        setSellPrice('')
      }
    } catch (err) {
      setTradeStep('error')
      const msg = err instanceof Error ? err.message : 'Transaction failed.'
      showToast('Transaction failed', msg.length > 120 ? msg.slice(0, 120) + '…' : msg, 'error')
    } finally {
      setTimeout(() => setTradeStep('idle'), 3000)
    }
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
              setAmount('')
              setSellPrice('')
            }}
          />

          <MarketTradePanel
            selected={selected}
            tradeType={tradeType}
            amount={amount}
            sellPrice={sellPrice}
            total={total}
            isConnected={isConnected}
            handleStatus="ready"
            tradeStep={tradeStep}
            onTradeTypeChange={(t) => { setTradeType(t); setAmount(''); setSellPrice('') }}
            onAmountChange={setAmount}
            onSellPriceChange={setSellPrice}
            onExecute={handleExecute}
            onClear={() => { setSelected(null); setAmount(''); setSellPrice('') }}
          />
        </div>
      </div>

      <TransactionModal
        isOpen={txOpen}
        onClose={() => setTxOpen(false)}
        txHash={txHash ?? '0x0000000000000000000000000000000000000000000000000000000000000000'}
      />
    </div>
  )
}
