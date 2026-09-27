'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMobileSidebar } from './mobile-sidebar-context'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useTranslation } from '@/lib/i18n/use-translation'

export function SidebarShell({ children }: { children: ReactNode }) {
  const { open, setOpen } = useMobileSidebar()
  const { t, locale } = useTranslation()
  const pathname = usePathname()
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => { setMobile(query.matches); if (!query.matches) setOpen(false) }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [setOpen])
  useEffect(() => { setOpen(false) }, [pathname, setOpen])

  if (!mobile) return <div className="hidden w-64 shrink-0 md:block">{children}</div>
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-64 p-0 gap-0" onCloseAutoFocus={event => {
      const trigger = document.querySelector<HTMLButtonElement>('[data-sidebar-trigger]')
      if (trigger) { event.preventDefault(); trigger.focus() }
    }}>
      <SheetHeader className="sr-only"><SheetTitle>{t.system.navigation}</SheetTitle><SheetDescription>{t.system.navigation}</SheetDescription></SheetHeader>
      {children}
    </SheetContent>
  </Sheet>
}
