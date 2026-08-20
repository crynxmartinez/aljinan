import type { Locale } from './translations'

const DATE_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  ar: 'ar-SA',
}

export function formatDate(
  date: string | Date | null | undefined,
  locale: Locale = 'ar',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(DATE_LOCALE[locale], options)
}

export function formatDateShort(date: string | Date | null | undefined, locale: Locale = 'ar'): string {
  return formatDate(date, locale, { month: 'short', day: 'numeric' })
}

export function formatDateLong(date: string | Date | null | undefined, locale: Locale = 'ar'): string {
  return formatDate(date, locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale: Locale = 'ar',
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(DATE_LOCALE[locale], options)
}

export function formatWeekday(date: string | Date | null | undefined, locale: Locale = 'ar'): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(DATE_LOCALE[locale], { weekday: 'long' })
}

export function formatMonthYear(date: Date, locale: Locale = 'ar'): string {
  return date.toLocaleDateString(DATE_LOCALE[locale], { month: 'long', year: 'numeric' })
}

export function formatWeekdayLong(date: Date, locale: Locale = 'ar'): string {
  return date.toLocaleDateString(DATE_LOCALE[locale], { weekday: 'long', month: 'long', day: 'numeric' })
}

export function getWeekdayNames(locale: Locale = 'ar'): string[] {
  const base = new Date(2024, 0, 7) // Sunday
  const names: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    names.push(d.toLocaleDateString(DATE_LOCALE[locale], { weekday: 'short' }))
  }
  return names
}

export function getMonthKey(date: Date, locale: Locale = 'ar'): string {
  return date.toLocaleDateString(DATE_LOCALE[locale], { month: 'short', year: '2-digit' })
}
