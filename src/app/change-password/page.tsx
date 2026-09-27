'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, Lock } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const tr = t.pages.changePassword
  const router = useRouter()
  const { data: session, update } = useSession()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError(tr.passwordTooShort)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(tr.passwordMismatch)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }

      // Update session to clear mustChangePassword flag
      await update()

      // Redirect to appropriate dashboard
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-lg shadow-sm border">
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
                <LocalizedError message={error} />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{tr.newPasswordLabel}</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tr.newPasswordPlaceholder}
                  required
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
              {loading ? tr.saving : tr.submitButton}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
