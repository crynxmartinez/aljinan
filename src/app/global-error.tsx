'use client'

import { useEffect, useState } from 'react'
import { systemMessages } from '@/lib/i18n/system-messages'
import type { Locale } from '@/lib/i18n/translations'

/**
 * Last-resort boundary. Catches errors thrown in the root layout itself, where the normal
 * error.tsx boundaries cannot render because the layout they live inside has failed.
 *
 * It must render its own html and body tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState<Locale>('ar')
  const t = systemMessages[locale]
  useEffect(() => {
    const cookie = document.cookie.match(/(?:^|; )tasheel_locale=(en|ar)(?:;|$)/)?.[1]
    setLocale(cookie === 'en' ? 'en' : 'ar')
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div style={{ maxWidth: '32rem', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {t.loadFailed}
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {t.serverError}
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.8rem',
                color: '#64748b',
                marginBottom: '1.5rem',
              }}
            >
              <bdi>{error.digest}</bdi>
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.7rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  )
}
