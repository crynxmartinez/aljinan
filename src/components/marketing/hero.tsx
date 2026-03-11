'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function Hero() {
  const { t } = useTranslation()
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/marketing/hero-safety-inspector.jpg)' }}
      />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-block mb-6">
            <span className="text-orange-400 font-semibold text-sm md:text-base">
              {t.hero.tagline}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {t.hero.title}{' '}
            <span className="text-orange-400">{t.hero.titleHighlight}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span>{t.hero.easy}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span>{t.hero.fast}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span>{t.hero.compliant}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
              <Link href="/register">
                {t.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
              <Link href="/features">
                {t.hero.ctaSecondary}
              </Link>
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-gray-400">
            {t.hero.noCreditCard}
          </p>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
        </svg>
      </div>
    </section>
  )
}
