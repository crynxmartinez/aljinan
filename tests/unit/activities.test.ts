import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ session: vi.fn(), access: vi.fn(), findMany: vi.fn(), create: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ verifyBranchAccess: mocks.access }))
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: async () => null }))
vi.mock('@/lib/prisma', () => ({ prisma: { activity: { findMany: mocks.findMany, create: mocks.create }, user: { findMany: async () => [] } } }))
import { GET, POST } from '@/app/api/branches/[branchId]/activities/route'
const context = { params: Promise.resolve({ branchId: 'branch-A' }) }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ user: { id: 'client-A', role: 'CLIENT' } })
  mocks.access.mockResolvedValue(true)
  mocks.findMany.mockResolvedValue([])
  mocks.create.mockResolvedValue({ id: 'comment' })
})
describe('branch comments', () => {
  it('rejects another branch before reading its comments', async () => {
    mocks.access.mockResolvedValue(false)
    expect((await GET(new Request('http://localhost/comments'), context)).status).toBe(403)
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
  it('paginates equal timestamps by ID and only returns shared comments', async () => {
    await GET(new Request('http://localhost/comments?before=2026-09-27T10:00:00Z&beforeId=abc'), context)
    const args = mocks.findMany.mock.calls[0][0]
    expect(args.where).toMatchObject({ branchId: 'branch-A', type: 'COMMENT' })
    expect(args.where.OR[1]).toEqual({ createdAt: new Date('2026-09-27T10:00:00Z'), id: { lt: 'abc' } })
    expect(args.take).toBe(100)
  })
  it('takes actor identity from the session, never from the body', async () => {
    const response = await POST(new Request('http://localhost/comments', { method: 'POST', body: JSON.stringify({ content: 'Shared comment', createdById: 'admin', createdByRole: 'ADMIN' }) }), context)
    expect(response.status).toBe(201)
    expect(mocks.create.mock.calls[0][0].data).toMatchObject({ createdById: 'client-A', createdByRole: 'CLIENT', branchId: 'branch-A' })
  })
  it('rejects empty comments without a write', async () => {
    expect((await POST(new Request('http://localhost/comments', { method: 'POST', body: JSON.stringify({ content: '  ' }) }), context)).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
