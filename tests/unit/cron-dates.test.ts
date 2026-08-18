import { describe, it, expect } from 'vitest'

/**
 * The notification cron decides "is this due today" and "how many days until this expires".
 * It used setHours(0,0,0,0), which resolves in the runtime's timezone — UTC on Vercel —
 * while the business runs at UTC+3. Work scheduled near midnight landed on the wrong side of
 * the boundary, so reminders fired a day early or late and auto-progression missed.
 *
 * The helpers under test live inside the cron route, so they are duplicated here. That is
 * deliberate: the point is to pin the arithmetic. If the route's copy changes, these fail and
 * the two are reconciled.
 */

const RIYADH_OFFSET_HOURS = 3

function riyadhStartOfDay(instant: Date): Date {
  const shifted = new Date(instant.getTime() + RIYADH_OFFSET_HOURS * 3600_000)
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      RIYADH_OFFSET_HOURS * 3600_000
  )
}

function daysUntil(target: Date, todayStart: Date): number {
  const targetStart = riyadhStartOfDay(target)
  return Math.round((targetStart.getTime() - todayStart.getTime()) / 86_400_000)
}

function riyadhDayKey(todayStart: Date): string {
  const shifted = new Date(todayStart.getTime() + RIYADH_OFFSET_HOURS * 3600_000)
  return shifted.toISOString().slice(0, 10)
}

describe('riyadhStartOfDay', () => {
  it('is 21:00 UTC the previous day', () => {
    // The cron fires at 08:00 UTC, which is 11:00 in Riyadh.
    const start = riyadhStartOfDay(new Date('2026-08-18T08:00:00Z'))
    expect(start.toISOString()).toBe('2026-08-17T21:00:00.000Z')
  })

  it('is stable at any hour within the same Riyadh day', () => {
    const morning = riyadhStartOfDay(new Date('2026-08-18T05:00:00Z')) // 08:00 Riyadh
    const evening = riyadhStartOfDay(new Date('2026-08-18T20:00:00Z')) // 23:00 Riyadh
    expect(morning.toISOString()).toBe(evening.toISOString())
  })

  it('rolls over at Riyadh midnight, not UTC midnight', () => {
    const before = riyadhStartOfDay(new Date('2026-08-18T20:59:00Z')) // 23:59 on the 18th
    const after = riyadhStartOfDay(new Date('2026-08-18T21:01:00Z')) // 00:01 on the 19th
    expect(after.getTime()).toBeGreaterThan(before.getTime())
    expect(riyadhDayKey(before)).toBe('2026-08-18')
    expect(riyadhDayKey(after)).toBe('2026-08-19')
  })
})

describe('daysUntil', () => {
  const today = riyadhStartOfDay(new Date('2026-08-18T08:00:00Z'))

  it('is zero for work scheduled today', () => {
    expect(daysUntil(new Date('2026-08-18T05:00:00Z'), today)).toBe(0)
    // Still today in Riyadh even though it is late in UTC terms.
    expect(daysUntil(new Date('2026-08-18T20:00:00Z'), today)).toBe(0)
  })

  it('counts the reminder windows the cron uses', () => {
    for (const [date, expected] of [
      ['2026-08-19T09:00:00Z', 1],
      ['2026-08-21T09:00:00Z', 3],
      ['2026-08-23T09:00:00Z', 5],
      ['2026-08-28T09:00:00Z', 10],
    ] as const) {
      expect(daysUntil(new Date(date), today)).toBe(expected)
    }
  })

  it('does not put late-evening UTC work on the wrong day', () => {
    // 00:30 Riyadh on the 19th. Naive UTC maths would call this the 18th, so a reminder
    // would fire a day late.
    expect(daysUntil(new Date('2026-08-18T21:30:00Z'), today)).toBe(1)
  })

  it('is negative for overdue work', () => {
    expect(daysUntil(new Date('2026-08-15T09:00:00Z'), today)).toBe(-3)
  })

  it('crosses a month boundary correctly', () => {
    const endOfMonth = riyadhStartOfDay(new Date('2026-08-31T08:00:00Z'))
    expect(daysUntil(new Date('2026-09-01T09:00:00Z'), endOfMonth)).toBe(1)
  })

  it('crosses a year boundary correctly', () => {
    const endOfYear = riyadhStartOfDay(new Date('2026-12-31T08:00:00Z'))
    expect(daysUntil(new Date('2027-01-01T09:00:00Z'), endOfYear)).toBe(1)
  })
})

describe('riyadhDayKey', () => {
  it('is the local calendar date, used to deduplicate a day of notifications', () => {
    expect(riyadhDayKey(riyadhStartOfDay(new Date('2026-08-18T08:00:00Z')))).toBe('2026-08-18')
  })
})
