'use client'

import { useState } from 'react'
import { createPublicClient, http, encodeFunctionData } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
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


type Ethereum = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
declare global { interface Window { ethereum?: Ethereum } }

function extractMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const m = e.message ?? e.reason ?? e.error
    if (typeof m === 'string' && m) return m
  }
  if (typeof err === 'string' && err) return err
  return 'Transaction failed.'
}

async function getChainId(eth: Ethereum): Promise<number> {
  const chainId = await eth.request({ method: 'eth_chainId' })
  if (typeof chainId !== 'string') throw new Error('Unable to read chain ID from wallet.')
  return Number(chainId)
}

async function waitForReceipt(eth: Ethereum, hash: string): Promise<{ status: '0x1' | '0x0' }> {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const receipt = await eth.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as { status: '0x1' | '0x0' } | null
      if (receipt !== null) return receipt
    } catch { /* RPC hiccup — keep polling */ }
  }
  throw new Error('Transaction not confirmed after 2 minutes. Check Arbiscan.')
}

export default function MarketPage() {
  const { isConnected, address } = useAccount()
  const { showToast } = useToast()

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

    const eth = window.ethereum
    if (!eth) { showToast('No wallet', 'Install MetaMask to continue.', 'error'); return }
    if (!address) { showToast('Wallet not connected', 'Connect your wallet before trading.', 'error'); return }

    const chainId = await getChainId(eth)
    if (chainId !== 421614) {
      throw new Error('Switch MetaMask to Arbitrum Sepolia (chain ID 421614).')
    }

    // Use env-configured RPC for reads — MetaMask RPC can be stale/misconfigured
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ?? 'https://sepolia-rollup.arbitrum.io/rpc'
    const walletClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) })

    const property = PROPERTIES.find(p => p.ticker === selected.ticker)
    if (!property) {
      showToast('Property not found', 'This listing is not mapped to a deployed contract.', 'error')
      return
    }

    const tokenAmount = BigInt(Math.max(1, Math.trunc(Number(amount))))

    try {
      if (tradeType === 'buy') {
        // ── Secondary market BUY (iExec Nox TEE flow) ────────────────────
        // Architecture (strict iExec compliance):
        //   Step 1: Read on-chain listing to get exact tokenAmount + pricePerToken
        //   Step 2: Submit iExec task → iApp runs in Intel TDX TEE → Nox gateway
        //           seals tokenAmount as encrypted handle + proof
        //   Step 3: Approve USDT for the exact listing cost
        //   Step 4: executeBuy(listingId, handle, handleProof) — contract calls
        //           Nox.fromExternal to import the TEE-sealed handle; no raw
        //           tokenAmount ever touches the blockchain.
        if (!selected.listingId) {
          showToast('No listing ID', 'This listing does not have an on-chain ID yet.', 'error')
          return
        }

        // ── Step 1: Read actual listing data from the contract ────────────
        const listingRaw = await walletClient.readContract({
          address: ADDRESSES.secondaryMarket,
          abi: SECONDARY_MARKET_ABI,
          functionName: 'listings',
          args: [BigInt(selected.listingId)],
        }) as readonly [bigint, `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, boolean]
        // tuple: [listingId, seller, tokenContract, propertyId, tokenAmount, pricePerToken, listedAt, active]
        const [, , , , listingTokenAmount, listingPricePerToken, , listingActive] = listingRaw
        if (!listingActive) throw new Error('This listing is no longer active.')

        const totalUsdt = listingTokenAmount * listingPricePerToken

        // Pre-check USDT balance (soft — skip if RPC unavailable)
        try {
          const usdtBal = await walletClient.readContract({
            address: ADDRESSES.usdt,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }) as bigint
          if (usdtBal < totalUsdt) {
            const have = (Number(usdtBal) / 1_000_000).toFixed(2)
            const need = (Number(totalUsdt) / 1_000_000).toFixed(2)
            throw new Error(`Insufficient USDT. You have $${have} but need $${need}. Get testnet USDT from the faucet.`)
          }
        } catch (checkErr) {
          const msg = extractMsg(checkErr)
          if (msg.startsWith('Insufficient USDT')) throw checkErr
          // RPC read failed — proceed and let the on-chain tx handle it
        }

        // ── Step 2: iExec iApp (Intel TDX TEE) → Nox encrypted handle ────
        setTradeStep('encrypting')
        showToast(
          'iExec TEE encrypting',
          'Step 1/3 — submitting task to iExec network (TEE via Intel TDX)...',
          'info',
        )

        // Submit task — returns immediately with taskid
        const startRes = await fetch('/api/iexec-buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAmount: listingTokenAmount.toString(),
            contractAddress: ADDRESSES.secondaryMarket,
            buyerAddress: address,
          }),
        })
        if (!startRes.ok) {
          const errData = await startRes.json() as { error?: string }
          throw new Error(errData.error ?? 'iExec task submission failed')
        }
        const { taskid, dealid } = await startRes.json() as { taskid: string; dealid: string }

        // Poll until TEE computation completes (each request < 10s, Vercel-safe)
        let handle: `0x${string}` | undefined
        let handleProof: `0x${string}` | undefined
        for (let i = 0; i < 72; i++) {
          await new Promise(r => setTimeout(r, 5000))
          const pollRes = await fetch(`/api/iexec-poll?taskid=${taskid}&dealid=${dealid}`)
          if (!pollRes.ok) continue
          const poll = await pollRes.json() as { status: string; handle?: string; handleProof?: string; error?: string }
          if (poll.status === 'failed') throw new Error(poll.error ?? 'iExec task failed in TEE worker')
          if (poll.status === 'completed' && poll.handle && poll.handleProof) {
            handle = poll.handle as `0x${string}`
            handleProof = poll.handleProof as `0x${string}`
            break
          }
        }
        if (!handle || !handleProof) throw new Error('iExec task timed out after 6 minutes.')

        // ── Step 3: Approve USDT ──────────────────────────────────────────
        setTradeStep('approving')
        showToast('Approve USDT', 'Step 2/3 — confirm USDT approval in your wallet.', 'info')

        const approveData = encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [ADDRESSES.secondaryMarket, totalUsdt] })
        const approveTx = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: ADDRESSES.usdt, data: approveData, gas: '0x13880' }] }) as `0x${string}`
        const approveReceipt = await waitForReceipt(eth, approveTx)
        if (approveReceipt.status === '0x0') throw new Error('USDT approval reverted on-chain.')

        // ── Step 4: executeBuy with TEE-sealed handle ─────────────────────
        setTradeStep('executing')
        showToast('Execute buy', 'Step 3/3 — confirm purchase in your wallet.', 'info')

        const buyData = encodeFunctionData({
          abi: SECONDARY_MARKET_ABI,
          functionName: 'executeBuy',
          args: [BigInt(selected.listingId), handle, handleProof],
        })
        const buyTx = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: ADDRESSES.secondaryMarket, data: buyData, gas: '0x61A80' }] }) as `0x${string}`
        const buyReceipt = await waitForReceipt(eth, buyTx)
        if (buyReceipt.status === '0x0') throw new Error('Buy transaction reverted on-chain.')

        setTxHash(buyTx)
        setTradeStep('done')
        setTxOpen(true)
        showToast('Buy complete!', `${listingTokenAmount} ${selected.ticker} · 🔒 Encrypted via iExec TEE`, 'success')
        setAmount('')

      } else {
        // ── Secondary market SELL: grantOperator → createListing ─────────
        if (!sellPrice || parseFloat(sellPrice) <= 0) {
          showToast('Enter a price', 'Set your ask price per token in USDT.', 'warning')
          return
        }

        const pricePerTokenUsdt = BigInt(Math.round(parseFloat(sellPrice) * 1_000_000))
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600)

        setTradeStep('granting')
        showToast('Grant operator', 'Step 1/2 — allow the market to transfer your tokens.', 'info')

        const grantData = encodeFunctionData({ abi: PROPERTY_TOKEN_ABI, functionName: 'grantOperator', args: [ADDRESSES.secondaryMarket, expiry] })
        const grantTx = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: property.contractAddress, data: grantData, gas: '0x30D40' }] }) as `0x${string}`
        const grantReceipt = await waitForReceipt(eth, grantTx)
        if (grantReceipt.status === '0x0') throw new Error('Grant operator reverted on-chain.')

        setTradeStep('listing')
        showToast('Create listing', 'Step 2/2 — confirm listing creation in your wallet.', 'info')

        const listData = encodeFunctionData({ abi: SECONDARY_MARKET_ABI, functionName: 'createListing', args: [property.contractAddress as `0x${string}`, BigInt(property.tokenId), tokenAmount, pricePerTokenUsdt] })
        const listTx = await eth.request({ method: 'eth_sendTransaction', params: [{ from: address, to: ADDRESSES.secondaryMarket, data: listData, gas: '0x493E0' }] }) as `0x${string}`
        const listReceipt = await waitForReceipt(eth, listTx)
        if (listReceipt.status === '0x0') throw new Error('Create listing reverted on-chain.')

        setTxHash(listTx)
        setTradeStep('done')
        setTxOpen(true)
        showToast('Listed!', `${amount} ${property.ticker} @ $${sellPrice} USDT/token · Live on SecondaryMarket.sol`, 'success')
        setAmount('')
        setSellPrice('')
      }
    } catch (err) {
      setTradeStep('error')
      const msg = extractMsg(err)
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
