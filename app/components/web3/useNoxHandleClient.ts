'use client'

import { useEffect, useState } from 'react'
import { createViemHandleClient, type HandleClient } from '@iexec-nox/handle'
import type { WalletClient } from 'viem'
import { useConnectorClient } from 'wagmi'

type HandleStatus = 'idle' | 'initializing' | 'ready' | 'error'

export function useNoxHandleClient() {
  const { data: walletClient } = useConnectorClient()
  const [handleClient, setHandleClient] = useState<HandleClient | null>(null)
  const [status, setStatus] = useState<HandleStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!walletClient) {
      setHandleClient(null)
      setStatus('idle')
      setError(null)
      return
    }

    setStatus('initializing')
    setError(null)

    void (async () => {
      try {
        const client = await createViemHandleClient(walletClient as WalletClient)
        if (cancelled) return
        setHandleClient(client)
        setStatus('ready')
      } catch (clientError: unknown) {
        if (cancelled) return
        setHandleClient(null)
        setStatus('error')
        setError(clientError instanceof Error ? clientError.message : 'Failed to initialize Nox handle client.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [walletClient])

  return {
    handleClient,
    status,
    error,
  }
}
