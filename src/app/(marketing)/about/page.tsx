'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, Users, Zap, Shield, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export const metadata: Metadata = {
  title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
  description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC, electrical & building inspections. Learn our mission and values.',
  keywords: 'safety platform Saudi Arabia, contractor software KSA, inspection management Riyadh, compliance software Saudi contractors, building safety management, about tasheel',
  alternates: {
    canonical: 'https://tasheel.sa/about',
  },
  openGraph: {
    title: 'About Tasheel - Saudi Arabia\'s Leading Safety Management Platform',
    description: 'Tasheel simplifies safety management for contractors across Saudi Arabia. Trusted by 50+ contractors for fire safety, HVAC & electrical inspections.',
    url: 'https://tasheel.sa/about',
    siteName: 'Tasheel',
    images: [
      {
        url: 'https://tasheel.sa/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About Tasheel - Safety Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Tasheel - Saudi Arabia\'s Safety Platform',
    description: 'Simplifying safety management for contractors across Saudi Arabia. Learn our mission and values.',
    images: ['https://tasheel.sa/images/og-image.jpg'],
    creator: '@tasheel_sa',
    site: '@tasheel_sa',
  },
}

export default function AboutPage() {
  const { t } = useTranslation()
  
  const values = [
    {
      icon: Zap,
      title: t.pages.about.values[0].title,
      description: t.pages.about.values[0].description,
    },
    {
      icon: Shield,
      title: t.pages.about.values[1].title,
      description: t.pages.about.values[1].description,
    },
    {
      icon: Users,
      title: t.pages.about.values[2].title,
      description: t.pages.about.values[2].description,
    },
    {
      icon: Target,
      title: t.pages.about.values[3].title,
      description: t.pages.about.values[3].description,
    },
  ]

  return (
    <div className="py-16 md:py-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t.pages.about.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.pages.about.subtitle}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              {t.pages.about.story[0]}
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              {t.pages.about.story[1]}
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              {t.pages.about.story[2]}
            </p>
            <p className="text-lg text-muted-foreground">
              {t.pages.about.story[3]}
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.pages.about.valuesTitle}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.pages.about.valuesSubtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="bg-white p-8 rounded-lg border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">50+</div>
              <div className="text-sm md:text-base text-gray-300">{t.stats.list[2].label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">500+</div>
              <div className="text-sm md:text-base text-gray-300">{t.stats.list[0].label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">10K+</div>
              <div className="text-sm md:text-base text-gray-300">{t.stats.list[3].label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">99%</div>
              <div className="text-sm md:text-base text-gray-300">{t.stats.list[1].label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-24">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.pages.about.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-orange-50">
            {t.pages.about.ctaSubtitle}
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
