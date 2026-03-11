'use client'

import { UserPlus, Building, Rocket } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function HowItWorks() {
  const { t } = useTranslation()
  
  const icons = [UserPlus, Building, Rocket]

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.howItWorks.steps.map((step, index) => {
            const Icon = icons[index]
            return (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl z-10">
                  {index + 1}
                </div>

                {/* Card */}
                <div className="bg-white p-8 rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full pt-12">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow (desktop only) */}
                {index < t.howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-orange-300 text-3xl z-0">
                    →
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
