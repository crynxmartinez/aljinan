import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('resend', () => ({ Resend: class { emails = { send: mocks.send } } }))
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
beforeEach(() => { vi.clearAllMocks(); mocks.send.mockResolvedValue({ data: { id: 'sent' }, error: null }) })
describe('email delivery and untrusted content', () => {
  it('escapes a customer name as text, not HTML', async () => {
    await sendVerificationEmail('test@example.com', '<a href="https://attacker.invalid">Name</a>', 'token', 'CLIENT', 'en')
    const html = mocks.send.mock.calls[0][0].html
    expect(html).not.toContain('<a href="https://attacker.invalid">')
    expect(html).toContain('&lt;a href=')
  })
  it('reports provider rejection even without a thrown exception', async () => {
    mocks.send.mockResolvedValue({ error: { message: 'Rejected' } })
    expect((await sendPasswordResetEmail('test@example.com', 'token', 'ar')).success).toBe(false)
  })
  it('uses the requested email language in subject, body and recovery link', async () => {
    await sendPasswordResetEmail('test@example.com', 'token', 'ar')
    const sent = mocks.send.mock.calls[0][0]
    expect(sent.html).toContain('dir="rtl"')
    expect(sent.html).toContain('locale=ar')
    expect(sent.subject).toMatch(/[\u0600-\u06ff]/)
  })
})
