'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from './reveal'
import { ProductMockup } from './product-mockup'

export function Hero() {
  const { t } = useTranslation()
  return (
    <section className="relative bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.15]"
        style={{ backgroundImage: 'url(/images/marketing/hero-safety-inspector.jpg)' }}
      />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {/* Warm glow behind the mockup */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-amber-600/10 via-transparent to-transparent" />

      <div className="container mx-auto px-4 pt-20 md:pt-28 pb-28 md:pb-40 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-amber-400 font-medium text-sm mb-8">
              {t.hero.tagline}
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              {t.hero.title}{' '}
              <span className="text-amber-400">{t.hero.titleHighlight}</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-lg md:text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span>{t.hero.easy}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span>{t.hero.fast}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span>{t.hero.compliant}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-950/40" asChild>
                <Link href="/contact">
                  {t.hero.ctaPrimary}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/5 border-white/15 text-white hover:bg-white/10" asChild>
                <Link href="/features">
                  {t.hero.ctaSecondary}
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="text-sm text-stone-400">
              {t.hero.noCreditCard}
            </p>
          </Reveal>
        </div>

        {/* Product preview */}
        <Reveal delay={0.45} className="mt-16 md:mt-20 max-w-3xl mx-auto">
          <ProductMockup />
        </Reveal>
      </div>
    </section>
  )
}
