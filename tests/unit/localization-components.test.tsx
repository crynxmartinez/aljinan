// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider, useTranslation } from '@/lib/i18n/use-translation'
import { TranslatedText } from '@/components/translated-text'
import { PasswordInput } from '@/components/ui/password-input'
import { LoadFailure } from '@/components/ui/load-failure'
import { localizeNotificationText } from '@/lib/i18n/notification-messages'

afterEach(cleanup)
function Fixture() {
  const { locale, setLocale } = useTranslation()
  return <>
    <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>switch</button>
    <TranslatedText path="copy.Create_Invoice" />
    <PasswordInput aria-label="password" defaultValue="Unsaved123" />
    <LoadFailure />
    <p>{localizeNotificationText('طلب جديد: Customer ABC', locale)}</p>
  </>
}

describe('rendered bilingual states', () => {
  it('switches labels, failures and saved notifications without losing input', () => {
    render(<TranslationProvider initialLocale="en"><Fixture /></TranslationProvider>)
    expect(screen.getByText('Create Invoice')).toBeTruthy()
    expect(screen.getByText('New request: Customer ABC')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Show password' }).tabIndex).toBe(0)
    fireEvent.click(screen.getByText('switch'))
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByText('إنشاء فاتورة')).toBeTruthy()
    expect(screen.getByText('طلب جديد: Customer ABC')).toBeTruthy()
    expect(screen.getByText('تعذر تحميل البيانات.')).toBeTruthy()
    expect((screen.getByLabelText('password') as HTMLInputElement).value).toBe('Unsaved123')
    expect(screen.queryByText('This could not be loaded.')).toBeNull()
    fireEvent.click(screen.getByText('switch'))
    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByText('Create Invoice')).toBeTruthy()
    expect(document.cookie).toContain('tasheel_locale=en')
  })
})
