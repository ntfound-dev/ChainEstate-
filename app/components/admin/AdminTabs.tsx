'use client'

export type AdminTab = 'properties' | 'rent' | 'registry' | 'analytics'

export const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: 'properties', label: 'Properties' },
  { id: 'rent', label: 'Rent Distribution' },
  { id: 'registry', label: 'Registry' },
  { id: 'analytics', label: 'Analytics' },
]

export function AdminTabs({
  tab,
  onTabChange,
}: {
  tab: AdminTab
  onTabChange: (tab: AdminTab) => void
}) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {ADMIN_TABS.map((tabItem) => (
        <button
          key={tabItem.id}
          onClick={() => onTabChange(tabItem.id)}
          className="rounded-full px-4 py-2 text-xs font-body uppercase tracking-widest transition-all"
          style={{
            background: tab === tabItem.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.02)',
            color: tab === tabItem.id ? '#080810' : 'var(--text-secondary)',
            border: `1px solid ${tab === tabItem.id ? 'var(--gold-primary)' : 'var(--border-visible)'}`,
          }}
        >
          {tabItem.label}
        </button>
      ))}
    </div>
  )
}
