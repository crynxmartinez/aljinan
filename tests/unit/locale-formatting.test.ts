import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/i18n/format-date'
describe('business date and amount formatting', () => {
  it('keeps the Gregorian year in both languages', () => {
    for (const locale of ['en', 'ar'] as const) expect(formatDate('2026-09-27', locale)).toContain('2026')
  })
  it('uses the Riyadh business day for instants near midnight', () => {
    expect(formatDateTime('2026-09-26T22:30:00Z', 'en')).toContain('Sep 27, 2026')
  })
  it('does not change a date-only value into the previous day', () => {
    expect(formatDate('2026-01-01', 'en')).toBe('Jan 1, 2026')
  })
  it('preserves zero and rejects non-finite monetary values', () => {
    expect(formatCurrency(0, 'en')).toBe('SAR 0.00')
    expect(formatCurrency(NaN, 'en')).toBe('-')
  })
})
