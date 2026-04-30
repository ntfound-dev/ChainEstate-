'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

type ChatRole = 'assistant' | 'user'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

const QUICK_PROMPTS = [
  'How does iExec Nox keep balances private?',
  'How does buying property tokens work?',
  'How is rent distributed privately?',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--nox-green)' }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

export function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ask me about ChainEstate — iExec Nox privacy, property tokens, rent distribution, or anything else. Powered by ChainGPT with full project context.',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragControls = useDragControls()

  useEffect(() => {
    const storageKey = 'chainestate-chaingpt-session'
    const existing = window.localStorage.getItem(storageKey)
    const nextId = existing || window.crypto.randomUUID()
    if (!existing) window.localStorage.setItem(storageKey, nextId)
    setSessionId(nextId)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const canSend = input.trim().length > 0 && !loading && !!sessionId

  const submitQuestion = async (question: string) => {
    if (!question.trim() || !sessionId) return

    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', content: question.trim() }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), sdkUniqueId: sessionId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Request failed.')
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: 'assistant', content: typeof data?.answer === 'string' ? data.answer : 'ChainGPT returned an empty response.' },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-error`, role: 'assistant', content: error instanceof Error ? `Error: ${error.message}` : 'Chatbot unavailable right now.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) submitQuestion(input)
    }
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      className="pointer-events-none fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-4"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="pointer-events-auto relative w-[min(440px,calc(100vw-2.5rem))] overflow-hidden rounded-3xl"
            style={{
              background: 'rgba(6,6,14,0.97)',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 32px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.14), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Animated top glow line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,160,0.6), rgba(201,168,76,0.6), transparent)' }}
            />

            {/* Drag handle bar */}
            <div
              className="mx-auto mt-2.5 h-1 w-10 rounded-full cursor-grab active:cursor-grabbing"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onPointerDown={(e) => dragControls.start(e)}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex items-center gap-3">
                {/* AI orb icon */}
                <div
                  className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,229,160,0.15), rgba(201,168,76,0.08))',
                    border: '1px solid rgba(0,229,160,0.25)',
                    color: 'var(--nox-green)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, rgba(0,229,160,0.18), transparent 60%)',
                    }}
                  />
                  AI
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-base font-display"
                      style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                    >
                      ChainGPT
                    </p>
                    {/* Live indicator */}
                    <span className="flex items-center gap-1">
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--nox-green)', boxShadow: '0 0 6px var(--nox-green)' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </span>
                  </div>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: loading ? 'var(--nox-green)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                  >
                    {loading ? 'Thinking...' : 'AI Copilot · ChainEstate'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)' }} />

            {/* Messages */}
            <div className="max-h-[48vh] min-h-[180px] overflow-y-auto px-4 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar dot */}
                    <div
                      className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                      style={
                        msg.role === 'user'
                          ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--gold-primary)', fontFamily: 'var(--font-body)' }
                          : { background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.18)', color: 'var(--nox-green)', fontFamily: 'var(--font-body)' }
                      }
                    >
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>

                    <div
                      className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? {
                              background: 'rgba(201,168,76,0.09)',
                              border: '1px solid rgba(201,168,76,0.16)',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-body)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-body)',
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5"
                  >
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                      style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.18)', color: 'var(--nox-green)', fontFamily: 'var(--font-body)' }}
                    >
                      AI
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.1), transparent)' }} />

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-0">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { if (!loading && sessionId) submitQuestion(prompt) }}
                  disabled={loading || !sessionId}
                  className="rounded-full px-3 py-1 text-[10px] transition-all"
                  style={{
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.04em',
                    opacity: loading ? 0.4 : 1,
                    background: 'rgba(201,168,76,0.04)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-end gap-2.5 px-4 pt-3 pb-4">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… (Enter to send)"
                rows={2}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-[13px] outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.55',
                  minHeight: '72px',
                  caretColor: 'var(--nox-green)',
                }}
              />
              <button
                onClick={() => submitQuestion(input)}
                disabled={!canSend}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-all disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  background: canSend
                    ? 'linear-gradient(135deg, var(--gold-primary), var(--gold-bright))'
                    : 'rgba(201,168,76,0.12)',
                  boxShadow: canSend ? '0 0 20px rgba(201,168,76,0.3)' : 'none',
                  color: '#0a0a12',
                }}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full pl-3 pr-4 py-2.5"
        style={{
          background: open
            ? 'rgba(201,168,76,0.1)'
            : 'linear-gradient(135deg, rgba(10,10,20,0.95), rgba(16,16,30,0.95))',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: open
            ? '0 0 0 1px rgba(201,168,76,0.35)'
            : '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(201,168,76,0.12)',
          backdropFilter: 'blur(16px)',
          color: 'var(--text-primary)',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={open ? 'Close AI Copilot' : 'Open AI Copilot'}
      >
        {/* Shimmer line */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,160,0.4), transparent)' }}
        />

        {/* Pulsing orb */}
        <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {!open && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(0,229,160,0.15)' }}
              animate={{ scale: [1, 1.55, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
          <span
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.18), rgba(201,168,76,0.1))',
              border: '1px solid rgba(0,229,160,0.3)',
              color: 'var(--nox-green)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.04em',
            }}
          >
            {open ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : 'AI'}
          </span>
        </span>

        {/* Labels */}
        <div className="text-left">
          <p
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: 'var(--nox-green)', fontFamily: 'var(--font-body)' }}
          >
            ChainGPT
          </p>
          <p className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            {open ? 'Close' : 'Ask the copilot'}
          </p>
        </div>
      </motion.button>
    </motion.div>
  )
}
