import { cookies } from 'next/headers'
import { translations, type Locale } from './translations'

const LOCALE_COOKIE = 'tasheel_locale'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const saved = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  if (saved && (saved === 'en' || saved === 'ar')) {
    return saved
  }
  return 'en'
}

export async function getTranslations() {
  const locale = await getLocale()
  return translations[locale]
}

export function getTranslationsForLocale(locale: Locale) {
  return translations[locale]
}
