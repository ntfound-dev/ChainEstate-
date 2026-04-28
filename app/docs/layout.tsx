import type { ReactNode } from 'react'
import { DocsSidebar } from '../components/docs/DocsSidebar'

export const metadata = {
  title: 'Docs — ChainEstate',
  description: 'ChainEstate documentation: problem, solution, business model, roadmap, smart contracts, and SDK.',
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          <DocsSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
