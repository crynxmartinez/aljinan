import { describe, expect, it } from 'vitest'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'

describe('isAuthorizedCronRequest', () => {
  it('rejects requests when the cron secret is unavailable', () => {
    const request = new Request('https://tasheel.test/api/cron/job', {
      headers: { authorization: 'Bearer undefined' },
    })

    expect(isAuthorizedCronRequest(request, undefined)).toBe(false)
  })

  it('rejects requests with a missing or incorrect bearer token', () => {
    const missingToken = new Request('https://tasheel.test/api/cron/job')
    const incorrectToken = new Request('https://tasheel.test/api/cron/job', {
      headers: { authorization: 'Bearer incorrect' },
    })

    expect(isAuthorizedCronRequest(missingToken, 'expected-secret')).toBe(false)
    expect(isAuthorizedCronRequest(incorrectToken, 'expected-secret')).toBe(false)
  })

  it('accepts only the configured bearer token', () => {
    const request = new Request('https://tasheel.test/api/cron/job', {
      headers: { authorization: 'Bearer expected-secret' },
    })

    expect(isAuthorizedCronRequest(request, 'expected-secret')).toBe(true)
  })
})
