'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

function ResetPasswordForm() {
  const { t } = useTranslation()
  const tr = t.pages.resetPassword
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError(tr.invalidLinkError)
    }
  }, [token, tr.invalidLinkError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(tr.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(tr.passwordMismatch)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{tr.invalidLinkTitle}</h1>
              <p className="text-muted-foreground mb-6">
                {tr.invalidLinkDesc}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">{tr.requestNewLink}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-lg shadow-sm border">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{tr.successTitle}</h1>
              <p className="text-muted-foreground mb-6">
                {tr.successDesc}
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{tr.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {tr.subtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{tr.newPasswordLabel}</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tr.newPasswordPlaceholder}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{tr.confirmPasswordLabel}</Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={tr.confirmPasswordPlaceholder}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {loading ? tr.resetting : tr.resetButton}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-muted-foreground hover:text-foreground">
                    {tr.backToLogin}
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
