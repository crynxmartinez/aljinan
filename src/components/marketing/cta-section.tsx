'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from './reveal'

export function CTASection() {
  const { t } = useTranslation()
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-amber-600 to-amber-700 text-white">
      <div className="container mx-auto px-4">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t.cta.title}
          </h2>
          <p className="text-lg md:text-xl mb-8 text-amber-50">
            {t.cta.subtitle}
          </p>

          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-stone-100 text-lg px-8 py-6 h-auto"
            asChild
          >
            <Link href="/contact">
              {t.cta.button}
              <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>

          <p className="text-sm text-amber-100 mt-6">
            {t.cta.disclaimer}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
