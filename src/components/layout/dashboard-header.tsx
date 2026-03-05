'use client'

import { GlobalSearch } from '@/components/search/global-search'
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

      {/* Right Side: User Avatar */}
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
