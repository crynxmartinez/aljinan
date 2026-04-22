'use client'

import { GlobalSearch } from '@/components/search/global-search'

interface AdminHeaderProps {
  userName: string | null | undefined
}

export function AdminHeader({ userName }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>
      
      {/* Admin Info */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {userName}
        </span>
      </div>
    </header>
  )
}
