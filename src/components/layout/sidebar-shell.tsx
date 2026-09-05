'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMobileSidebar } from './mobile-sidebar-context'

/**
 * Wraps a sidebar's markup so it renders once but behaves as a static column on
 * desktop and an off-canvas drawer on mobile. A single instance (rather than
 * separate desktop/mobile copies) matters here because sidebars run their own
 * polling effects (unread counts) that shouldn't run twice.
 */
export function SidebarShell({ children }: { children: ReactNode }) {
  const { open, setOpen } = useMobileSidebar()
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in-0"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 start-0 z-50 w-72 transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:translate-x-0!',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}
