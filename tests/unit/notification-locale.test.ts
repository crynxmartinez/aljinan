import { describe, expect, it } from 'vitest'
import { localizeNotificationText, notificationTemplates } from '@/lib/i18n/notification-messages'

describe('notification language rendering', () => {
  it('renders every registered template in both directions', () => {
    for (const [ar, en] of notificationTemplates) {
      const fill = (text: string) => text.replace(/\{(\d+)\}/g, (_, index) => `customer-${index}`)
      expect(localizeNotificationText(fill(ar), 'en')).toBe(fill(en))
      expect(localizeNotificationText(fill(en), 'ar')).toBe(fill(ar))
    }
  })
  it('preserves user content and does not guess unknown historical content', () => {
    expect(localizeNotificationText('طلب جديد: عميل ABC', 'en')).toBe('New request: عميل ABC')
    expect(localizeNotificationText('Custom customer text', 'ar')).toBe('Custom customer text')
  })
})
