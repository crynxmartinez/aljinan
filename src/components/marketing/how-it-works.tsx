'use client'

import { UserPlus, Building, Rocket } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from './reveal'

export function HowItWorks() {
  const { t } = useTranslation()

  const icons = [UserPlus, Building, Rocket]

  return (
    <section className="py-16 md:py-24 bg-stone-50">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.howItWorks.steps.map((step, index) => {
            const Icon = icons[index]
            return (
              <Reveal key={index} delay={index * 0.1} className="relative">
                {/* Step Number */}
                <div className="absolute -top-4 -start-4 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl z-10 shadow-md shadow-amber-900/10">
                  {index + 1}
                </div>

                {/* Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow h-full pt-12">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">{step.title}</h3>
                  <p className="text-stone-500">{step.description}</p>
                </div>

                {/* Arrow (desktop only) — flips to point the reading direction in RTL */}
                {index < t.howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -end-4 rtl:rotate-180 transform -translate-y-1/2 text-amber-200 text-3xl z-0">
                    →
                  </div>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
