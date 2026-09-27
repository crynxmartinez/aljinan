'use client'

import { useTranslation } from '@/lib/i18n/use-translation'
import { localizeError } from '@/lib/i18n/error-text'

/** Error state may outlive a language switch. Resolve display text at render time. */
export function LocalizedError({ message }: { message: string | null | undefined }) {
  const { locale } = useTranslation()
  return localizeError(message ?? '', locale)
}
