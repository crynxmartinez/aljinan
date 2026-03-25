'use client'

import { GlobalSearch } from '@/components/search/global-search'
import { NotificationCenter } from '@/components/notifications/notification-center'

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
      
      {/* Notification Bell */}
      <div className="flex items-center gap-2">
        <NotificationCenter />
      </div>
    </header>
  )
}
