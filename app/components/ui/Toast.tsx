'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'warning' | 'info' | 'error'

interface Toast {
  id: string
  message: string
  sub?: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, sub?: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  warning: '⚠',
  info:    '⚡',
  error:   '✕',
}

const COLORS: Record<ToastType, string> = {
  success: 'var(--nox-green)',
  warning: 'var(--status-warning)',
  info:    'var(--gold-primary)',
  error:   'var(--status-error)',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, sub?: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, sub, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto relative rounded-lg p-4 min-w-[280px] max-w-[360px]"
              style={{
                background: 'var(--bg-elevated)',
                border: `1px solid ${COLORS[toast.type]}30`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold mt-0.5" style={{ color: COLORS[toast.type] }}>
                  [{ICONS[toast.type]}]
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                    {toast.message}
                  </p>
                  {toast.sub && (
                    <p className="text-xs font-body mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {toast.sub}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
