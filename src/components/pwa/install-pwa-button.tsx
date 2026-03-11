'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function InstallPWAButton() {
  const { t } = useTranslation()
  
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      asChild
    >
      <Link href="/install">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t.common.installApp}</span>
        <span className="sm:hidden">{t.common.install}</span>
      </Link>
    </Button>
  )
}
