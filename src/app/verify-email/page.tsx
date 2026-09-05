'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

function VerifyEmailContent() {
  const { t } = useTranslation()
  const tr = t.pages.verifyEmail
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

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

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.genericError)
    } finally {
      setVerifying(false)
    }
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
                {error}
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
                {tr.verifiedDesc}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-start">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      {tr.checkInboxTitle}
                    </p>
                    <p className="text-sm text-blue-700">
                      {tr.checkInboxDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {tr.onceReceivedNote}
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
