'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ServiceSchema } from '@/components/seo/service-schema'
import { ClipboardList, Wrench, FileCheck, Users, BarChart3, DollarSign, Bell, Shield, Smartphone, CheckCircle, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export const metadata: Metadata = {
  title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
  description: 'Comprehensive safety management features for Saudi Arabia contractors: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing. Built for fire safety, HVAC & electrical inspections.',
  keywords: 'work order management Saudi Arabia, certificate compliance tracking, equipment inspection software, safety inspection reports, client portal KSA, automated billing contractors, fire safety management, HVAC inspection tracking',
  alternates: {
    canonical: 'https://tasheel.sa/features',
  },
  openGraph: {
    title: 'Safety Inspection Features - Work Orders, Certificates & Compliance | Tasheel',
    description: 'Comprehensive safety management features: automated work orders, certificate tracking, equipment inspection, client portal, digital reports & billing.',
    url: 'https://tasheel.sa/features',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tasheel Safety Management Features',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety Inspection Features | Tasheel',
    description: 'Automated work orders, certificate tracking, equipment inspection, client portal & more for Saudi Arabia contractors.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function FeaturesPage() {
  const { t } = useTranslation()
  
  const icons = [ClipboardList, Wrench, FileCheck, Users, BarChart3, DollarSign, Bell, Shield, Smartphone]
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
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t.pages.features.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t.pages.features.subtitle}
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              {t.pages.features.ctaButton}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="space-y-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0

            return (
              <div
                key={index}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">{feature.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="relative rounded-lg overflow-hidden h-64">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-24">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.pages.features.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-orange-50">
            {t.pages.features.ctaSubtitle}
          </p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100" asChild>
            <Link href="/register">
              {t.cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
