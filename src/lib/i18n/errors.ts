import { systemMessages, type SystemMessageKey } from './system-messages'
import type { Locale } from './translations'

export function browserLocale(): Locale {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar'
}

export function errorMessage(status: number, locale: Locale = browserLocale()): string {
  const key: SystemMessageKey = status === 0 ? 'networkError'
    : status === 401 ? 'unauthorized' : status === 403 ? 'forbidden'
    : status === 404 ? 'notFound' : status === 409 ? 'conflict'
    : status === 429 ? 'rateLimit' : status >= 500 ? 'serverError' : 'invalid'
  return systemMessages[locale][key]
}
