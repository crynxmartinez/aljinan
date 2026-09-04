'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Target, Users, Zap, Shield, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from '@/components/marketing/reveal'

export function AboutContent() {
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
        <Reveal className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {t.pages.about.title}
          </h1>
          <p className="text-xl text-stone-500">
            {t.pages.about.subtitle}
          </p>
        </Reveal>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <Reveal className="space-y-6 order-2 md:order-1">
            <p className="text-lg text-stone-600 leading-relaxed">
              {t.pages.about.story[0]}
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              {t.pages.about.story[1]}
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              {t.pages.about.story[2]}
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              {t.pages.about.story[3]}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="order-1 md:order-2">
            <div className="relative rounded-2xl overflow-hidden h-72 md:h-96 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
              <Image
                src="/images/marketing/hero-industrial-safety.jpg"
                alt={t.pages.about.title}
                fill
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4">
        <Reveal className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">{t.pages.about.valuesTitle}</h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            {t.pages.about.valuesSubtitle}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <Reveal key={index} delay={(index % 2) * 0.1}>
                <div className="bg-white p-8 rounded-2xl border border-stone-100 hover:shadow-md transition-shadow h-full">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-heading">{value.title}</h3>
                  <p className="text-stone-500">{value.description}</p>
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
            {t.pages.about.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-amber-50">
            {t.pages.about.ctaSubtitle}
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
