'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ClipboardList, Wrench, FileCheck, Users, BarChart3, Banknote, Bell, Shield, Smartphone, CheckCircle, ArrowRight } from 'lucide-react'
import { ServiceSchema } from '@/components/seo/service-schema'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from '@/components/marketing/reveal'

export function FeaturesContent() {
  const { t } = useTranslation()

  const icons = [ClipboardList, Wrench, FileCheck, Users, BarChart3, Banknote, Bell, Shield, Smartphone]
  const images = [
    '/images/marketing/feature-work-orders.jpg',
    '/images/marketing/feature-equipment.jpg',
    '/images/marketing/feature-certificates.jpg',
    '/images/marketing/feature-client-portal.jpg',
    '/images/marketing/feature-reports.jpg',
    '/images/marketing/feature-billing.jpg',
    '/images/marketing/feature-notifications.jpg',
    '/images/marketing/feature-security.jpg',
    '/images/marketing/feature-mobile.jpg',
  ]

  const features = t.features.list.map((feature, index) => ({
    icon: icons[index],
    title: feature.title,
    description: feature.description,
    image: images[index],
    benefits: feature.benefits,
  }))

  return (
    <div className="py-16 md:py-24">
      <ServiceSchema />
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-20">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {t.pages.features.title}
          </h1>
          <p className="text-xl text-stone-500 mb-8">
            {t.pages.features.subtitle}
          </p>
          <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" asChild>
            <Link href="/contact">
              {t.pages.features.ctaButton}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="space-y-20">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0

            return (
              <Reveal
                key={index}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-amber-700" />
                    </div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">{feature.title}</h2>
                  </div>
                  <p className="text-lg text-stone-500 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-stone-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className="relative rounded-2xl overflow-hidden h-64 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-24">
        <Reveal className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl p-12 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t.pages.features.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-amber-50">
            {t.pages.features.ctaSubtitle}
          </p>
          <Button size="lg" className="bg-white text-amber-700 hover:bg-stone-100" asChild>
            <Link href="/contact">
              {t.cta.button}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </Reveal>
      </section>
    </div>
  )
}
