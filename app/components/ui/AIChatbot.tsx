'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ChatRole = 'assistant' | 'user'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

const QUICK_PROMPTS = [
  'How does iExec Nox keep balances private?',
  'What happens when I buy property tokens?',
  'How does monthly rent distribution work?',
]

export function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask me about ChainEstate, iExec Nox privacy flow, property tokens, or rent distribution. I answer with ChainGPT using project context.',
    },
  ])

  useEffect(() => {
    const storageKey = 'chainestate-chaingpt-session'
    const existing = window.localStorage.getItem(storageKey)
    const nextId = existing || window.crypto.randomUUID()
    if (!existing) window.localStorage.setItem(storageKey, nextId)
    setSessionId(nextId)
  }, [])

  const canSend = input.trim().length > 0 && !loading && sessionId

  const helperLabel = useMemo(() => {
    if (loading) return 'ChainGPT is thinking...'
    return 'Powered by ChainGPT + ChainEstate context'
  }, [loading])

  const submitQuestion = async (question: string) => {
    if (!question.trim() || !sessionId) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: question.trim(),
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          sdkUniqueId: sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Chatbot request failed.')
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: typeof data?.answer === 'string' ? data.answer : 'ChainGPT returned an empty answer.',
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content:
            error instanceof Error
              ? `Chatbot unavailable: ${error.message}`
              : 'Chatbot unavailable right now.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border"
            style={{
              borderColor: 'rgba(201,168,76,0.18)',
              background: 'rgba(8,8,16,0.96)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 28px 90px rgba(0,0,0,0.45)',
            }}
          >
            <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: 'var(--nox-green)' }}>
                    [ AI Copilot ]
                  </p>
                  <h2 className="mt-2 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                    ChainGPT Assistant
                  </h2>
                  <p className="mt-2 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {helperLabel}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2 text-[10px] font-body uppercase tracking-widest"
                  style={{ border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}
                  aria-label="Close chatbot"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[52vh] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                    message.role === 'user' ? 'ml-auto' : ''
                  }`}
                  style={{
                    background:
                      message.role === 'user'
                        ? 'rgba(201,168,76,0.12)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      message.role === 'user'
                        ? 'rgba(201,168,76,0.18)'
                        : 'rgba(255,255,255,0.08)'
                    }`,
                    color:
                      message.role === 'user'
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => submitQuestion(prompt)}
                    disabled={loading || !sessionId}
                    className="rounded-full px-3 py-1.5 text-[10px] font-body uppercase tracking-widest"
                    style={{
                      border: '1px solid var(--border-visible)',
                      color: 'var(--text-secondary)',
                      opacity: loading ? 0.55 : 1,
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about privacy, tokenization, or rent flow..."
                  rows={3}
                  className="terminal-input min-h-[92px] flex-1 rounded-2xl px-4 py-3 text-sm font-body"
                />
                <button
                  onClick={() => submitQuestion(input)}
                  disabled={!canSend}
                  className="rounded-2xl px-4 py-3 text-sm btn-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto flex items-center gap-3 rounded-full px-4 py-3"
        style={{
          background: 'rgba(201,168,76,0.14)',
          border: '1px solid rgba(201,168,76,0.22)',
          color: 'var(--text-primary)',
          boxShadow: '0 0 24px rgba(201,168,76,0.14)',
        }}
        aria-label={open ? 'Hide ChainGPT assistant' : 'Show ChainGPT assistant'}
      >
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm"
          style={{ background: 'rgba(0,229,160,0.12)', color: 'var(--nox-green)' }}
        >
          AI
        </span>
        <div className="text-left">
          <p className="text-[10px] font-body uppercase tracking-[0.28em]" style={{ color: 'var(--nox-green)' }}>
            ChainGPT
          </p>
          <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
            Ask the copilot
          </p>
        </div>
      </button>
    </div>
  )
}
