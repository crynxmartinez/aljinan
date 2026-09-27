'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface ContractorProfile {
  id: string
  companyName: string | null
  companyPhone: string | null
  companyEmail: string | null
  companyAddress: string | null
  contactPersonName: string | null
  contactPersonPhone: string | null
  contactPersonEmail: string | null
  isVerified: boolean
  user: {
    email: string
    name: string | null
  }
}

interface CompanyProfileFormProps {
  contractor: ContractorProfile
}

export function CompanyProfileForm({ contractor }: CompanyProfileFormProps) {
  const { t } = useTranslation()
  const tf = t.dashboard.companyProfileForm
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    companyName: contractor.companyName || '',
    companyPhone: contractor.companyPhone || '',
    companyEmail: contractor.companyEmail || '',
    companyAddress: contractor.companyAddress || '',
    contactPersonName: contractor.contactPersonName || '',
    contactPersonPhone: contractor.contactPersonPhone || '',
    contactPersonEmail: contractor.contactPersonEmail || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contractor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || tf.errorUpdateFailed)
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : tf.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const completionItems = [
    { label: tf.companyNameLabel, completed: !!formData.companyName },
    { label: tf.companyPhoneLabel, completed: !!formData.companyPhone },
    { label: tf.companyEmailLabel, completed: !!formData.companyEmail },
    { label: tf.companyAddressLabel, completed: !!formData.companyAddress },
  ]

  const completedCount = completionItems.filter((item) => item.completed).length
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{tf.cardTitle}</CardTitle>
            <CardDescription>
              {tf.cardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  <LocalizedError message={error} />
                </div>
              )}

              {success && (
                <div className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {tf.updateSuccess}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName">{tf.companyNameLabel}</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder={tf.companyNamePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">{tf.companyPhoneLabel}</Label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  placeholder={tf.companyPhonePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">{tf.companyEmailLabel}</Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder={tf.companyEmailPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">{tf.companyAddressLabel}</Label>
                <Input
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  placeholder={tf.companyAddressPlaceholder}
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="text-sm font-semibold mb-4">{tf.contactPersonSectionTitle}</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">{tf.contactPersonNameLabel}</Label>
                    <Input
                      id="contactPersonName"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      placeholder={tf.contactPersonNamePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone">{tf.contactPersonPhoneLabel}</Label>
                    <Input
                      id="contactPersonPhone"
                      name="contactPersonPhone"
                      value={formData.contactPersonPhone}
                      onChange={handleChange}
                      placeholder={tf.contactPersonPhonePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPersonEmail">{tf.contactPersonEmailLabel}</Label>
                    <Input
                      id="contactPersonEmail"
                      name="contactPersonEmail"
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={handleChange}
                      placeholder={tf.contactPersonEmailPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="mt-6">
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {tf.saveChanges}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tf.profileCompletionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{completionPercentage}%</span>
                {contractor.isVerified && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="me-1 h-3 w-3" />
                    {tf.verified}
                  </Badge>
                )}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <ul className="space-y-2">
                {completionItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-4 w-4 ${item.completed ? 'text-green-600' : 'text-muted-foreground/30'
                        }`}
                    />
                    <span className={item.completed ? '' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tf.accountInfoTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">{tf.accountEmailLabel}</p>
              <p className="font-medium">{contractor.user.email}</p>
            </div>
            {contractor.user.name && (
              <div>
                <p className="text-sm text-muted-foreground">{tf.accountNameLabel}</p>
                <p className="font-medium">{contractor.user.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
