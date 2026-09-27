/** Saudi business dates: date-only filter values are not browser-local timestamps. */
export function businessDayStart(value: string): Date {
  return new Date(`${value}T00:00:00+03:00`)
}

export function businessDayEndExclusive(value: string): Date {
  return new Date(businessDayStart(value).getTime() + 24 * 60 * 60 * 1000)
}

export function shiftCalendarMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}
