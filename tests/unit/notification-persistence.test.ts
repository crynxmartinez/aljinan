import { describe, expect, it, vi } from 'vitest'
const create = vi.hoisted(() => vi.fn().mockRejectedValue(new Error('storage unavailable')))
vi.mock('@/lib/prisma', () => ({ prisma: { notification: { create } } }))
vi.mock('@/lib/notification-links', () => ({ resolveNotificationLink: async (value: string) => value }))
import { notifyWorkOrderCompleted } from '@/lib/notification-service'

describe('notification failure propagation', () => {
  it('does not silently convert a failed required notification into success', async () => {
    await expect(notifyWorkOrderCompleted('recipient', 'work', 'work-id', 'branch')).rejects.toThrow('storage unavailable')
  })
})
