'use client'

import { GlobalSearch } from '@/components/search/global-search'

interface DashboardHeaderProps {
  userName: string | null | undefined
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>
    </header>
  )
}
