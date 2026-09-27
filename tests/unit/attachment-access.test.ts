import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  db: Object.fromEntries(['branch', 'contract', 'certificate', 'request', 'requestPhoto', 'inspectionPhoto', 'invoice', 'contractPayment', 'checklistItem'].map(name => [name, { findMany: vi.fn() }])),
  access: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.db }))
vi.mock('@/lib/permissions', () => ({ verifyBranchAccess: mocks.access }))
import { canReadAttachment } from '@/lib/file-access'
beforeEach(() => {
  vi.clearAllMocks()
  for (const model of Object.values(mocks.db)) model.findMany.mockResolvedValue([])
  mocks.access.mockResolvedValue(false)
})
describe('attachment sharing derives from the saved document', () => {
  it('denies an unattached upload even to someone with access to a branch', async () => {
    mocks.access.mockResolvedValue(true)
    expect(await canReadAttachment('upload', 'client', 'CLIENT')).toBe(false)
  })
  it('allows an older upload attached to a published document in an accessible branch', async () => {
    mocks.db.contract.findMany.mockResolvedValue([{ branchId: 'branch-A' }])
    mocks.access.mockResolvedValue(true)
    expect(await canReadAttachment('upload', 'client', 'CLIENT')).toBe(true)
    expect(mocks.db.contract.findMany.mock.calls[0][0].where.status).toEqual({ not: 'DRAFT' })
    expect(mocks.access).toHaveBeenCalledWith('branch-A', 'client', 'CLIENT')
  })
  it('denies a saved attachment from another tenant', async () => {
    mocks.db.requestPhoto.findMany.mockResolvedValue([{ request: { branchId: 'rival' } }])
    expect(await canReadAttachment('upload', 'client', 'CLIENT')).toBe(false)
  })
})
