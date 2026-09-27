import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ work: vi.fn(), certificate: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { checklistItem: { findMany: m.work }, certificate: { findMany: m.certificate } } }))
import { enrichNotificationContent } from '@/lib/notification-content'
import { generatedRecord } from '@/lib/i18n/generated-content'
import { renderNotificationText } from '@/lib/i18n/notification-messages'
beforeEach(() => { vi.clearAllMocks(); m.work.mockResolvedValue([]); m.certificate.mockResolvedValue([]) })
it('translates proven generated parameters in both locales with one batched record read', async () => {
  const record = generatedRecord({ id: 'work', description: 'Fire alarm - Monthly Visit 1' }, 'maintenanceVisit', { system: 'Fire alarm', frequency: 'MONTHLY', visit: '1' })
  m.work.mockResolvedValue([record])
  const source = { title: 'بدء أمر العمل', message: `بدأ العمل على "${record.description}"`, relatedType: 'WORK_ORDER', relatedId: 'work' }
  const [notice] = await enrichNotificationContent([{ ...source, content: null }, { ...source, content: null }])
  const ar = renderNotificationText(notice.message, notice.content, 'message', 'ar')
  expect(ar).toContain('Fire alarm')
  expect(ar).toContain('زيارة')
  expect(ar).not.toContain('Monthly Visit')
  expect(renderNotificationText(notice.message, notice.content, 'message', 'en')).toContain('Monthly Visit 1')
  expect(m.work).toHaveBeenCalledTimes(1)
})
it('does not translate customer edits or records without provenance', async () => {
  m.work.mockResolvedValue([{ id: 'work', description: 'Customer Monthly Visit 1', generatedContent: null }])
  const source = { title: 'بدء أمر العمل', message: 'بدأ العمل على "Customer Monthly Visit 1"', relatedType: 'WORK_ORDER', relatedId: 'work' }
  expect(await enrichNotificationContent([source])).toEqual([source])
})
it('makes no record reads for notices unrelated to generated content', async () => {
  await enrichNotificationContent([{ title: 'test', message: 'test', relatedType: 'REQUEST', relatedId: 'request' }])
  expect(m.work).not.toHaveBeenCalled(); expect(m.certificate).not.toHaveBeenCalled()
})
