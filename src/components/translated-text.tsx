'use client'
import { useTranslation } from '@/lib/i18n/use-translation'
import type { translations } from '@/lib/i18n/translations'

type LeafPaths<T> = { [K in keyof T & string]: T[K] extends string ? K : T[K] extends object ? `${K}.${LeafPaths<T[K]>}` : never }[keyof T & string]
export type TranslationKey = LeafPaths<typeof translations.en>

/** A text-only client leaf also usable inside server-rendered pages. No extra DOM. */
export function TranslatedText({ path }: { path: TranslationKey }) {
  const { t } = useTranslation()
  let value: unknown = t
  for (const key of path.split('.')) value = (value as Record<string, unknown>)[key]
  if (typeof value !== 'string') throw new Error(`Invalid translation key: ${path}`)
  return <>{value}</>
}
