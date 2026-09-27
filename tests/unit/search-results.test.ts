import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => {
  const models = Object.fromEntries(['client','branch','checklistItem','request','contract','invoice','equipment','certificate','teamMember','branchRequest','appointment','contractor','contactInquiry','quotation','adminUser'].map(key => [key, { findMany: vi.fn(), findUnique: vi.fn() }]))
  return { session: vi.fn(), models }
})
vi.mock('next-auth', () => ({ getServerSession: m.session }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: m.models }))
vi.mock('@/lib/cache', () => ({ CACHE_TAGS: { SEARCH: () => 'search' }, getCached: (_key: string, load: () => unknown) => load() }))
vi.mock('@/lib/i18n/server', () => ({ getLocale: () => 'ar' }))
import { GET } from '@/app/api/search/route'
beforeEach(() => {
  vi.clearAllMocks()
  for (const model of Object.values(m.models)) { model.findMany.mockResolvedValue([]); model.findUnique.mockResolvedValue(null) }
})
it('client quotation search excludes drafts and translates system statuses', async () => {
  m.session.mockResolvedValue({ user: { id: 'client-user', role: 'CLIENT' } })
  m.models.client.findUnique.mockResolvedValue({ id: 'client', branches: [{ id: 'branch' }] })
  m.models.quotation.findMany.mockResolvedValue([{ id: 'quote', title: 'Customer wording', status: 'SENT', branchId: 'branch', branch: { slug: 'branch-slug', client: { id: 'client', slug: 'client-slug' } } }])
  const response = await GET(new Request('http://localhost/api/search?q=Customer'))
  expect(response.status).toBe(200)
  expect(m.models.quotation.findMany.mock.calls[0][0].where).toMatchObject({ branchId: { in: ['branch'] }, status: { not: 'DRAFT' } })
  const { results } = await response.json()
  expect(results[0]).toMatchObject({ type: 'quotation', title: 'Customer wording', link: '/portal/branches/branch-slug?tab=billing' })
  expect(results[0].subtitle).not.toBe('SENT')
})
it('staff quotation search uses current branch assignments', async () => {
  m.session.mockResolvedValue({ user: { id: 'staff', role: 'TEAM_MEMBER' } })
  m.models.teamMember.findUnique.mockResolvedValue({ contractor: { id: 'owner' } })
  expect((await GET(new Request('http://localhost/api/search?q=Customer'))).status).toBe(200)
  expect(m.models.quotation.findMany.mock.calls[0][0].where.branch).toEqual({ client: { contractorId: 'owner' }, teamMemberAccess: { some: { teamMember: { userId: 'staff' } } } })
})
