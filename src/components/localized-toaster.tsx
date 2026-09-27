'use client'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslation } from '@/lib/i18n/use-translation'

export function LocalizedToaster() {
  const { locale } = useTranslation()
  const { resolvedTheme } = useTheme()
  return <Toaster richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    dir={locale === 'ar' ? 'rtl' : 'ltr'} position={locale === 'ar' ? 'top-left' : 'top-right'} />
}
