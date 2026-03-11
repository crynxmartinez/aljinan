'use client'

import { useTranslation } from '@/lib/i18n/use-translation'
import { ReactNode } from 'react'

interface TranslatedContentProps {
  children: (t: ReturnType<typeof useTranslation>['t']) => ReactNode
}

export function TranslatedContent({ children }: TranslatedContentProps) {
  const { t } = useTranslation()
  return <>{children(t)}</>
}
