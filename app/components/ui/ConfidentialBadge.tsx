'use client'

interface ConfidentialBadgeProps {
  size?: 'sm' | 'md'
}

export function ConfidentialBadge({ size = 'md' }: ConfidentialBadgeProps) {
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} ${textSize} rounded font-body tracking-widest uppercase`}
      style={{
        background: 'var(--nox-green-dim)',
        color: 'var(--nox-green)',
        border: '1px solid rgba(0,229,160,0.3)',
        animation: 'noxPulse 2s ease-in-out infinite',
      }}
      aria-label="Confidential data"
    >
      <LockIcon size={size} />
      CONFIDENTIAL
    </span>
  )
}

function LockIcon({ size }: { size: 'sm' | 'md' }) {
  const s = size === 'sm' ? 8 : 10
  return (
    <svg width={s} height={s} viewBox="0 0 10 12" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
