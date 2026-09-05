'use client'

import { GlobalSearch } from '@/components/search/global-search'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { LanguageToggle } from '@/components/language-toggle'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileMenuButton } from '@/components/layout/mobile-menu-button'

interface ClientHeaderProps {
  userName: string | null | undefined
}

export function ClientHeader({ userName }: ClientHeaderProps) {
  return (
    <header className="h-16 border-b bg-background px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
      <MobileMenuButton />

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>

      {/* Notification Bell */}
      <div className="flex items-center gap-1 md:gap-2">
        <ThemeToggle />
        <LanguageToggle />
        <NotificationCenter />
      </div>
    </header>
  )
}
