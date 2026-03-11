'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    businessRegistration: '',
    phone: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) return t.auth.register.errors.passwordTooShort
    if (!/[A-Z]/.test(password)) return t.auth.register.errors.passwordNoUppercase
    if (!/[a-z]/.test(password)) return t.auth.register.errors.passwordNoLowercase
    if (!/[0-9]/.test(password)) return t.auth.register.errors.passwordNoNumber
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreeToTerms) {
      setError(t.auth.register.errors.termsRequired)
      return
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.register.errors.passwordMismatch)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      router.push('/login?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = formData.password.length > 0 ? (
    <div className="space-y-1 text-xs text-muted-foreground">
      <div className={formData.password.length >= 8 ? 'text-green-600' : ''}>
        ● {t.auth.register.passwordStrength.minLength}
      </div>
      <div className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
        ● {t.auth.register.passwordStrength.upperLower}
      </div>
      <div className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
        ● {t.auth.register.passwordStrength.number}
      </div>
    </div>
  ) : null

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t.auth.register.title}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.register.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t.auth.register.companyNameLabel}</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder={t.auth.register.companyNamePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistration">{t.auth.register.businessRegLabel}</Label>
              <Input
                id="businessRegistration"
                name="businessRegistration"
                value={formData.businessRegistration}
                onChange={handleChange}
                placeholder={t.auth.register.businessRegPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.auth.register.phoneLabel}</Label>
              <div className="flex gap-2">
                <Input
                  value="+966"
                  disabled
                  className="w-20"
                />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t.auth.register.phonePlaceholder}
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.register.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.auth.register.emailPlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.register.fullNameLabel}</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t.auth.register.fullNamePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.register.passwordLabel}</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t.auth.register.passwordPlaceholder}
                required
              />
              {passwordStrength}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.register.confirmPasswordLabel}</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t.auth.register.passwordPlaceholder}
                required
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t.auth.register.agreeToTerms}{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  {t.common.termsOfService}
                </Link>{' '}
                {t.auth.register.and}{' '}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  {t.common.privacyPolicy}
                </Link>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t.auth.register.creatingAccount : t.auth.register.createAccountButton}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t.auth.register.alreadyHaveAccount} </span>
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t.auth.register.signIn}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
