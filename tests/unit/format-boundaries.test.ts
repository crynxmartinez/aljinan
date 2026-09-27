import { describe, expect, it } from 'vitest'
import { businessDayStart, businessDayEndExclusive, shiftCalendarMonth } from '@/lib/i18n/date-boundaries'
import { errorMessage } from '@/lib/i18n/errors'

describe('business date boundaries', () => {
  it('includes the entire selected Saudi business day', () => {
    const time = new Date('2026-09-27T22:00:00+03:00')
    expect(time >= businessDayStart('2026-09-27')).toBe(true)
    expect(time < businessDayEndExclusive('2026-09-27')).toBe(true)
    expect(businessDayEndExclusive('2026-09-27').toISOString()).toBe('2026-09-27T21:00:00.000Z')
  })
  it('does not skip February on the 31st', () => {
    expect(shiftCalendarMonth(new Date(2026, 0, 31), 1).getMonth()).toBe(1)
    expect(shiftCalendarMonth(new Date(2024, 2, 31), -1).getDate()).toBe(1)
  })
  it('localizes errors without exposing arbitrary server details', () => {
    expect(errorMessage(403, 'en')).toContain('permission')
    expect(errorMessage(403, 'ar')).toContain('صلاحية')
    expect(errorMessage(500, 'en')).not.toContain('Nothing was changed')
  })
})
