import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ session: vi.fn(), update: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { update: mocks.update } } }))
import { PUT } from '@/app/api/preferences/route'
beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ user: { id: 'current-user' } }); mocks.update.mockResolvedValue({}) })
const request = (body: unknown) => new Request('http://localhost/api/preferences', { method: 'PUT', body: JSON.stringify(body) })
describe('recipient language preference', () => {
  it('updates only the signed-in account even if another ID is supplied', async () => {
    expect((await PUT(request({ locale: 'en', userId: 'other-user' }))).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'current-user' }, data: { preferredLocale: 'en' } })
  })
  it('refuses unsupported locales without writing', async () => {
    expect((await PUT(request({ locale: 'xx' }))).status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('requires authentication', async () => {
    mocks.session.mockResolvedValue(null)
    expect((await PUT(request({ locale: 'ar' }))).status).toBe(401)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
