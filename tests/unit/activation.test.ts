import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), updateMany: vi.fn(), hash: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: mocks } }))
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: async () => null }))
vi.mock('bcryptjs', () => ({ default: { hash: mocks.hash } }))
import { POST } from '@/app/api/auth/verify-email/route'

const request = (body: object) => new Request('http://localhost/api/auth/verify-email', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
beforeEach(() => {
  vi.clearAllMocks()
  mocks.findFirst.mockResolvedValue({ id: 'recipient' })
  mocks.updateMany.mockResolvedValue({ count: 1 })
  mocks.hash.mockResolvedValue('hashed-credential')
})
describe('activation without credential email dependency', () => {
  it('does not consume the token before the recipient supplies a password', async () => {
    const response = await POST(request({ token: 'test-token' }))
    expect(await response.json()).toEqual({ requiresPassword: true })
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })
  it('rejects invalid credentials without changing the account', async () => {
    expect((await POST(request({ token: 'test-token', password: 'weak' }))).status).toBe(400)
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })
  it('consumes the still-valid token in the same update as the password and session version', async () => {
    expect((await POST(request({ token: 'test-token', password: 'ValidPassword9' }))).status).toBe(200)
    const change = mocks.updateMany.mock.calls[0][0]
    expect(change.where).toMatchObject({ id: 'recipient', emailVerificationToken: 'test-token' })
    expect(change.where.emailVerificationExpiry.gt).toBeInstanceOf(Date)
    expect(change.data).toMatchObject({ password: 'hashed-credential', emailVerificationToken: null, status: 'ACTIVE', sessionVersion: { increment: 1 } })
  })
  it('does not claim success if another request consumed the token first', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })
    expect((await POST(request({ token: 'test-token', password: 'ValidPassword9' }))).status).toBe(400)
  })
})
