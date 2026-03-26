'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        // Fetch session to determine role-based redirect
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        if (session?.user?.mustChangePassword) {
          router.push('/change-password')
        } else if (session?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t.auth.login.title}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.login.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.login.emailPlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.login.passwordLabel}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.login.passwordPlaceholder}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t.auth.login.rememberMe}
                </label>
              </div>
              <Link 
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t.auth.login.forgotPassword}
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t.auth.login.signingIn : t.auth.login.signInButton}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">{t.common.or}</span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Need an account? </span>
            <Link href="/contact" className="text-primary font-medium hover:underline">
              Contact our support team
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
