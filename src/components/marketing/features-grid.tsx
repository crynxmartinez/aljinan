'use client'

import { ClipboardList, Wrench, FileCheck, Users, BarChart3, Banknote } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from './reveal'

export function FeaturesGrid() {
  const { t } = useTranslation()

  const icons = [ClipboardList, Wrench, FileCheck, Users, BarChart3, Banknote]
  const images = [
    '/images/marketing/feature-work-orders.jpg',
    '/images/marketing/feature-equipment.jpg',
    '/images/marketing/feature-certificates.jpg',
    '/images/marketing/feature-client-portal.jpg',
    '/images/marketing/feature-reports.jpg',
    '/images/marketing/feature-billing.jpg',
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t.features.title}
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            {t.features.subtitle}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.features.list.slice(0, 6).map((feature, index) => {
            const Icon = icons[index]
            return (
              <Reveal key={index} delay={(index % 3) * 0.08}>
                <div className="group bg-white border border-stone-100 rounded-2xl hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 transition-all duration-300 overflow-hidden h-full">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={images[index]}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 start-4">
                      <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 font-heading">{feature.title}</h3>
                    <p className="text-stone-500">{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
