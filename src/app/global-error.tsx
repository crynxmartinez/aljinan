'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <html lang="en">
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
            Something went wrong
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The page could not be loaded. Your data has not been changed. Try again, and if
            it keeps happening, contact support with the reference below.
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
              Reference: {error.digest}
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
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
