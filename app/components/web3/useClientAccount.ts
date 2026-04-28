'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

// Wagmi's isConnected is always false on the server but can be true on first
// client render — causing hydration mismatches whenever UI branches on it.
// This hook returns isConnected=false and address=undefined until after mount.
export function useClientAccount() {
  const account = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return { ...account, isConnected: false as const, address: undefined }
  return account
}
