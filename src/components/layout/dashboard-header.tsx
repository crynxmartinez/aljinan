'use client'

import { GlobalSearch } from '@/components/search/global-search'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardHeaderProps {
  userName: string | null | undefined
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>

      {/* Right Side: Notifications & User */}
      <div className="flex items-center gap-4">
        <NotificationCenter />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{userName || 'User'}</p>
            <p className="text-xs text-muted-foreground">Contractor</p>
          </div>
          <Avatar>
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
