'use client'

import { HardHat, Building2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function Benefits() {
  const { t } = useTranslation()

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.benefits.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Contractors */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardHat className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold">{t.benefits.contractors.title}</h3>
            </div>
            <ul className="space-y-3">
              {t.benefits.contractors.list.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* For Clients */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold">{t.benefits.clients.title}</h3>
            </div>
            <ul className="space-y-3">
              {t.benefits.clients.list.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
