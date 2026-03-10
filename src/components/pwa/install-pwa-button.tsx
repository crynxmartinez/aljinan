'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function InstallPWAButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      asChild
    >
      <Link href="/install">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </Link>
    </Button>
  )
}
