import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), send: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: mocks } }))
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: async () => ({ ok: true }) }))
vi.mock('@/lib/i18n/server', () => ({ getLocale: async () => 'en' }))
vi.mock('@/lib/email', () => ({ sendVerificationEmail: mocks.send }))
import { POST } from '@/app/api/admin/users/[userId]/activate/route'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUnique.mockResolvedValue({ id: 'pending-user', status: 'PENDING', email: 'recipient@example.com', name: 'Recipient', role: 'CONTRACTOR', preferredLocale: 'ar' })
  mocks.update.mockResolvedValue({})
})
describe('admin setup invitation', () => {
  it('keeps the account pending and reports failed delivery', async () => {
    mocks.send.mockResolvedValue({ success: false })
    const response = await POST(new Request('http://localhost'), { params: Promise.resolve({ userId: 'pending-user' }) })
    expect(response.status).toBe(502)
    const change = mocks.update.mock.calls[0][0].data
    expect(change.password).toBeUndefined()
    expect(change.status).toBeUndefined()
    expect(change.emailVerificationToken).toBeTruthy()
  })
  it('sends setup without exposing a generated password', async () => {
    mocks.send.mockResolvedValue({ success: true })
    const response = await POST(new Request('http://localhost'), { params: Promise.resolve({ userId: 'pending-user' }) })
    expect(response.status).toBe(200)
    expect(mocks.send.mock.calls[0][4]).toBe('ar')
    expect(await response.json()).not.toHaveProperty('tempPassword')
  })
})
