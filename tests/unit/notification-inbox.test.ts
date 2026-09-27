import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: async () => ({ user: { id: 'recipient' } }) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { notification: mocks } }))
vi.mock('@/lib/notification-links', () => ({ resolveNotificationLink: async (link: string) => link }))
import { GET as inbox } from '@/app/api/notifications/route'
import { GET as popup } from '@/app/api/notifications/popup/route'

beforeEach(() => vi.clearAllMocks())
describe('notification inbox correctness', () => {
  it('counts older unread messages outside the visible batch', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'recent', isRead: false, link: null }])
    mocks.count.mockResolvedValue(72)
    expect((await (await inbox()).json()).unreadCount).toBe(72)
    expect(mocks.count).toHaveBeenCalledWith({ where: { userId: 'recipient', isRead: false } })
  })
  it('chooses high priority ahead of medium instead of alphabetic order', async () => {
    mocks.findFirst.mockImplementation(({ where }) => Promise.resolve({ id: where.priority, link: null }))
    expect((await (await popup()).json()).notification.id).toBe('high')
  })
})
