'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'
import { useMobileSidebar } from './mobile-sidebar-context'

export function MobileMenuButton() {
  const { setOpen } = useMobileSidebar()
  const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden shrink-0"
      onClick={() => setOpen(true)}
      aria-label={t.common.openMenu}
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}
