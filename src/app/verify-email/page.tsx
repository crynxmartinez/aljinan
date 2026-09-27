'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { validatePassword } from '@/lib/password-policy'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

function VerifyEmailContent() {
  const { t, locale, setLocale } = useTranslation()
  const tr = t.pages.verifyEmail
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const linkLocale = searchParams.get('locale')
  useEffect(() => {
    if ((linkLocale === 'en' || linkLocale === 'ar') && linkLocale !== locale) setLocale(linkLocale)
  }, [linkLocale, locale, setLocale])

  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError(tr.invalidLinkError)
      setVerifying(false)
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async (chosenPassword?: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...(chosenPassword !== undefined ? { password: chosenPassword } : {}) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(tr.genericError)
      }

      if (data.requiresPassword) setRequiresPassword(true)
      else { setRequiresPassword(false); setSuccess(true) }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.genericError)
    } finally {
      setVerifying(false)
    }
  }

  if (requiresPassword) {
    return <div className="min-h-screen grid place-items-center bg-muted p-4">
      <form className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8" onSubmit={(event) => {
        event.preventDefault()
        if (!validatePassword(password).isValid) { setError(t.system.invalid); return }
        setVerifying(true); setError(''); verifyEmail(password)
      }}>
        <h1 className="text-2xl font-semibold">{t.system.setupPassword}</h1>
        <p className="text-muted-foreground">{t.system.setupDescription}</p>
        <p className="text-sm text-muted-foreground">{t.system.passwordRequirements}</p>
        <Label htmlFor="setup-password">{t.system.password}</Label>
        <PasswordInput id="setup-password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required />
        {error && <p role="alert" className="text-destructive"><LocalizedError message={error} /></p>}
        <Button type="submit" disabled={verifying} className="w-full">{t.system.activate}</Button>
      </form>
    </div>
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border">
            <div className="text-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{tr.verifyingTitle}</h1>
              <p className="text-muted-foreground">
                {tr.verifyingDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{tr.failedTitle}</h1>
              <p className="text-muted-foreground mb-6">
                <LocalizedError message={error} />
              </p>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {tr.expiredNote}
                </p>
                <Link href="/contact">
                  <Button className="w-full">{tr.contactSupport}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{tr.verifiedTitle}</h1>
              <p className="text-muted-foreground mb-6">
                {t.system.setupComplete}
              </p>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t.system.setupComplete}
                </p>
                <Link href="/login">
                  <Button className="w-full">{tr.goToLogin}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
