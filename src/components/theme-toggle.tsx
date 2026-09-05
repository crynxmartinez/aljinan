'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  // Avoids a hydration mismatch: the server can't know the viewer's stored/system
  // preference, so render nothing until the client has resolved it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" disabled />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t.common.switchToLightMode : t.common.switchToDarkMode}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
