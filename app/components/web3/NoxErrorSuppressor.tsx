'use client'

import { useEffect } from 'react'

// iExec Nox SDK fires internal unhandled rejections when the domain hasn't
// been registered with the TEE gateway. We catch + log these cleanly so they
// don't appear as red "Uncaught (in promise)" noise in the console.
export function NoxErrorSuppressor() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? String(event.reason ?? '')
      if (msg.includes('has not been authorized yet') || msg.includes('iexec') || msg.includes('nox')) {
        event.preventDefault()
        console.warn('[iExec Nox] Domain not yet authorized with TEE gateway:', msg)
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return null
}
