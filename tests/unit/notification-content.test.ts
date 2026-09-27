import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
import * as service from '@/lib/notification-service'
import { notificationData, renderNotificationText } from '@/lib/i18n/notification-messages'
import writers from './notification-writers.json'
describe('durable notification templates', () => {
  for (const [name, count] of writers) it(`${name} persists translatable template data`, async () => {
    const create = vi.fn().mockImplementation(async ({ data }) => data)
    const db = { notification: { create }, branch: { findUnique: vi.fn().mockResolvedValue({ id: 'branch', slug: 'branch', client: { id: 'client', slug: 'client' } }) } }
    const fn = service[name as keyof typeof service] as (...args: unknown[]) => Promise<unknown>
    await fn(...Array.from({ length: Number(count) }, (_, i) => i === 2 && name === 'notifyPriceSet' ? 0 : 'customer-content'), db)
    const saved = create.mock.calls[0][0].data
    expect(saved.content.version).toBe(1)
    expect(renderNotificationText(saved.title, saved.content, 'title', 'en')).not.toMatch(/[\u0600-\u06ff]/)
    expect(renderNotificationText(saved.title, saved.content, 'title', 'ar')).toMatch(/[\u0600-\u06ff]/)
  })
  it('preserves parameters that contain template-like text', () => {
    const saved = notificationData({ title: 'New service request', message: 'New request: Customer {0}' })
    expect(renderNotificationText(saved.message, saved.content, 'message', 'ar')).toContain('Customer {0}')
  })
  it('refuses new unregistered system copy', () => {
    expect(() => notificationData({ title: 'Untranslated new feature', message: 'Unknown copy' })).toThrow('Unregistered notification template')
  })
})
