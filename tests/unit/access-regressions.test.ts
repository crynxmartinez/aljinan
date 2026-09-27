import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const models = ['contractor', 'teamMember', 'client', 'branch', 'checklist', 'checklistItem', 'request', 'contract', 'quotation', 'invoice', 'equipment', 'certificate', 'branchRequest', 'appointment', 'adminUser', 'contactInquiry']
  const db = Object.fromEntries(models.map(name => [name, {
    findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn(),
  }]))
  return { db, session: vi.fn() }
})
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.db }))
vi.mock('@/lib/cache', () => ({ getCached: (_key: string, fn: () => unknown) => fn(), CACHE_TAGS: { SEARCH: () => 'search' } }))
vi.mock('@/lib/permissions', () => ({ verifyBranchAccess: async () => true }))
vi.mock('@/lib/notification-service', () => ({ notifyContractSigned: vi.fn(), notifyContractCompleted: vi.fn(), notifyQuotationSent: vi.fn(), notifyQuotationApproved: vi.fn(), notifyQuotationRejected: vi.fn() }))
vi.mock('@/lib/i18n/server', async () => {
  const { translations } = await import('@/lib/i18n/translations')
  return { getLocale: async () => 'en', getTranslationsForLocale: () => translations.en }
})
import { PATCH as updateCertificate, DELETE as deleteCertificate } from '@/app/api/branches/[branchId]/certificates/[certificateId]/route'
import { GET as analytics } from '@/app/api/analytics/dashboard/route'
import { GET as search } from '@/app/api/search/route'
import { GET as invoice } from '@/app/api/branches/[branchId]/invoices/[invoiceId]/route'
import { GET as contract } from '@/app/api/branches/[branchId]/contracts/[contractId]/route'
import { GET as quotation } from '@/app/api/branches/[branchId]/quotations/[quotationId]/route'

beforeEach(() => {
  vi.clearAllMocks()
  for (const model of Object.values(mocks.db)) {
    model.findUnique.mockResolvedValue(null)
    model.findMany.mockResolvedValue([])
    model.findFirst.mockResolvedValue(null)
    model.groupBy.mockResolvedValue([])
    model.aggregate.mockResolvedValue({ _sum: { price: 0 } })
    model.count.mockResolvedValue(0)
  }
  mocks.session.mockResolvedValue({ user: { id: 'owner-A', role: 'CONTRACTOR' } })
  mocks.db.contractor.findUnique.mockResolvedValue({ id: 'contractor-A' })
})

describe('analytics isolation and date boundaries', () => {
  it('scopes every work-order query to the authenticated contractor', async () => {
    const response = await analytics()
    expect(response.status).toBe(200)
    for (const method of ['aggregate', 'groupBy', 'count', 'findMany'] as const) {
      for (const [args] of mocks.db.checklistItem[method].mock.calls) {
        expect(args.where.checklist.branch.client.contractorId).toBe('contractor-A')
      }
    }
    expect(mocks.db.checklistItem.aggregate).toHaveBeenCalled()
  })
  it('fails closed if the contractor profile is missing', async () => {
    mocks.db.contractor.findUnique.mockResolvedValue(null)
    expect((await analytics()).status).toBe(403)
    expect(mocks.db.checklistItem.aggregate).not.toHaveBeenCalled()
  })
  it('uses exclusive next-month bounds', async () => {
    await analytics()
    const periods = mocks.db.checklistItem.aggregate.mock.calls.map(([args]) => args.where.updatedAt)
    expect(periods.some(period => 'lte' in period)).toBe(false)
    expect(periods.slice(1).every(period => period.lt instanceof Date)).toBe(true)
  })
})

describe('search authorization', () => {
  it('uses database branch assignments for every staff category', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'staff-A', role: 'TEAM_MEMBER', assignedBranchIds: ['stale-branch'] } })
    mocks.db.teamMember.findUnique.mockResolvedValue({ contractor: { id: 'contractor-A' } })
    await search(new Request('http://localhost/api/search?q=test'))
    const assignment = { some: { teamMember: { userId: 'staff-A' } } }
    expect(mocks.db.branch.findMany.mock.calls[0][0].where.teamMemberAccess).toEqual(assignment)
    expect(mocks.db.client.findMany.mock.calls[0][0].where.branches.some.teamMemberAccess).toEqual(assignment)
    expect(mocks.db.checklistItem.findMany.mock.calls[0][0].where.checklist.branch.teamMemberAccess).toEqual(assignment)
    for (const name of ['request', 'contract', 'invoice', 'equipment', 'certificate', 'appointment']) {
      expect(mocks.db[name].findMany.mock.calls[0][0].where.branch.teamMemberAccess).toEqual(assignment)
    }
    expect(mocks.db.branchRequest.findMany).not.toHaveBeenCalled()
  })
  it('hides client draft invoices and contracts from search', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'client-A', role: 'CLIENT' } })
    mocks.db.client.findUnique.mockResolvedValue({ id: 'client-A', branches: [{ id: 'branch-A' }] })
    await search(new Request('http://localhost/api/search?q=test'))
    for (const name of ['invoice', 'contract']) {
      expect(mocks.db[name].findMany.mock.calls[0][0].where.status).toEqual({ not: 'DRAFT' })
    }
  })
})

describe('direct draft reads', () => {
  it('applies client publication rules to all financial detail endpoints', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'client-A', role: 'CLIENT' } })
    const request = new Request('http://localhost/api/record')
    await invoice(request, { params: Promise.resolve({ branchId: 'b', invoiceId: 'i' }) })
    await contract(request, { params: Promise.resolve({ branchId: 'b', contractId: 'c' }) })
    await quotation(request, { params: Promise.resolve({ branchId: 'b', quotationId: 'q' }) })
    for (const name of ['invoice', 'contract', 'quotation']) {
      expect(mocks.db[name].findFirst.mock.calls[0][0].where.status).toEqual({ not: 'DRAFT' })
    }
  })
})



describe('certificate write identity', () => {
  it('binds update and delete to the authorized branch, not just the supplied certificate ID', async () => {
    const context = { params: Promise.resolve({ branchId: 'owned-branch', certificateId: 'rival-certificate' }) }
    mocks.db.certificate.update.mockResolvedValue({ id: 'certificate' })
    await updateCertificate(new Request('http://localhost/certificate', { method: 'PATCH', body: JSON.stringify({ title: 'changed' }) }), context)
    await deleteCertificate(new Request('http://localhost/certificate', { method: 'DELETE' }), context)
    expect(mocks.db.certificate.update.mock.calls[0][0].where).toEqual({ id: 'rival-certificate', branchId: 'owned-branch' })
    expect(mocks.db.certificate.delete.mock.calls[0][0].where).toEqual({ id: 'rival-certificate', branchId: 'owned-branch' })
  })
})
