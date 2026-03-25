'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Clock, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.company,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      })

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Contact form error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.pages.contact.title}</h1>
          <p className="text-xl text-muted-foreground">
            {t.pages.contact.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg border shadow-sm">
            <h2 className="text-2xl font-bold mb-6">{t.pages.contact.formTitle}</h2>

            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                {t.pages.contact.successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t.pages.contact.nameLabel}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.pages.contact.namePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.pages.contact.emailLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.pages.contact.emailPlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.pages.contact.phoneLabel}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t.pages.contact.phonePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{t.pages.contact.companyLabel}</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={t.pages.contact.companyPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t.pages.contact.messageLabel}</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t.pages.contact.messagePlaceholder}
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t.pages.contact.sending : t.pages.contact.sendButton}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t.pages.contact.infoTitle}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.pages.contact.emailTitle}</h3>
                    <p className="text-muted-foreground">{t.pages.contact.emailGeneral}</p>
                    <p className="text-muted-foreground">{t.pages.contact.emailSupport}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.pages.contact.phoneTitle}</h3>
                    <p className="text-muted-foreground">{t.footer.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.pages.contact.addressTitle}</h3>
                    <p className="text-muted-foreground">{t.pages.contact.addressLine1}</p>
                    <p className="text-muted-foreground">{t.pages.contact.addressLine2}</p>
                    <p className="text-muted-foreground">{t.pages.contact.addressLine3}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.pages.contact.hoursTitle}</h3>
                    <p className="text-muted-foreground">{t.pages.contact.hoursWeekdays}</p>
                    <p className="text-muted-foreground">{t.pages.contact.hoursWeekend}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">{t.pages.contact.urgentTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.pages.contact.urgentText}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.pages.contact.responseTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
