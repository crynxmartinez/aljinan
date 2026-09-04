'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from '@/components/marketing/reveal'

export default function ContactPage() {
  const { t } = useTranslation()
  const tc = t.pages.contact
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
        <Reveal className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-6">{tc.title}</h1>
          <p className="text-xl text-stone-500">
            {tc.subtitle}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Reveal className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
            <h2 className="font-heading text-2xl font-bold mb-6">{tc.formTitle}</h2>

            {success && (
              <div className="flex items-start gap-3 bg-emerald-50 text-emerald-800 p-4 rounded-xl mb-6">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">{tc.successTitle}</p>
                  <p className="text-sm">{tc.successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{tc.nameLabel}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={tc.namePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{tc.emailLabel}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={tc.emailPlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{tc.phoneLabel}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={tc.phonePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{tc.companyLabel}</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={tc.companyPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{tc.messageLabel}</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={tc.messagePlaceholder}
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {loading ? tc.sending : tc.sendButton}
              </Button>
            </form>
          </Reveal>

          {/* Contact Information */}
          <div className="space-y-8">
            <Reveal delay={0.1}>
              <h2 className="font-heading text-2xl font-bold mb-6">{tc.infoTitle}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tc.emailTitle}</h3>
                    <p className="text-stone-500">{tc.emailGeneral}</p>
                    <p className="text-stone-500">{tc.emailSupport}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tc.phoneTitle}</h3>
                    <p className="text-stone-500">{t.footer.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tc.addressTitle}</h3>
                    <p className="text-stone-500">{tc.addressLine1}</p>
                    <p className="text-stone-500">{tc.addressLine2}</p>
                    <p className="text-stone-500">{tc.addressLine3}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tc.hoursTitle}</h3>
                    <p className="text-stone-500">{tc.hoursWeekdays}</p>
                    <p className="text-stone-500">{tc.hoursWeekend}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15} className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm h-56">
              <iframe
                title="Tasheel location — Al Olaya, Riyadh"
                src="https://www.google.com/maps?q=King+Fahd+Road+Al+Olaya+Riyadh+Saudi+Arabia&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>

            <Reveal delay={0.2} className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h3 className="font-heading font-semibold mb-2">{tc.whatHappensNextTitle}</h3>
              <p className="text-sm text-stone-500 mb-4">
                {tc.whatHappensNextText1}
              </p>
              <p className="text-sm text-stone-500">
                {tc.whatHappensNextText2}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
