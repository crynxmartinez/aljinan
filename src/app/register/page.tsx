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

export default function RegisterPage() {
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
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must include uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must include lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must include a number'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
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
        ● At least 8 characters
      </div>
      <div className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
        ● Include uppercase and lowercase
      </div>
      <div className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
        ● Include a number
      </div>
    </div>
  ) : null

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">Join 50+ contractors managing their business with ease</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your Company Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistration">Business Registration Number</Label>
              <Input
                id="businessRegistration"
                name="businessRegistration"
                value={formData.businessRegistration}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
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
                  placeholder="50 123 4567"
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Your Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              {passwordStrength}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
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
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
