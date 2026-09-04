'use client'

import { X, Check, HardHat, Building2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Reveal } from './reveal'

export function ProblemSolution() {
  const { t } = useTranslation()

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t.problemSolution.title}
            </h2>
          </Reveal>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Problems */}
            <Reveal className="flex-1 space-y-4 w-full">
              {t.problemSolution.problems.map((problem, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50/70 border border-red-100 rounded-xl">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-stone-700">{problem}</p>
                </div>
              ))}
            </Reveal>

            {/* Arrow */}
            <Reveal delay={0.1} className="flex-shrink-0">
              <div className="hidden md:block text-4xl text-amber-600 rtl:rotate-180">→</div>
              <div className="md:hidden text-3xl text-amber-600 rotate-90">→</div>
            </Reveal>

            {/* Solutions */}
            <Reveal delay={0.15} className="flex-1 space-y-4 w-full">
              <h3 className="text-xl font-semibold text-center md:text-start mb-6 font-heading">
                {t.problemSolution.solutionTitle}
              </h3>
              {t.problemSolution.solutions.map((solution, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-stone-700">{solution}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* Condensed benefits close-out */}
        <div className="max-w-5xl mx-auto mt-16 pt-16 border-t border-stone-100">
          <Reveal className="text-center mb-10">
            <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
              {t.benefits.title}
            </h3>
            <p className="text-stone-500 max-w-xl mx-auto">
              {t.benefits.subtitle}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            <Reveal delay={0.1} className="bg-stone-50 p-7 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <HardHat className="h-5 w-5 text-amber-700" />
                </div>
                <h4 className="text-lg font-semibold">{t.benefits.contractors.title}</h4>
              </div>
              <ul className="space-y-2.5">
                {t.benefits.contractors.list.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-stone-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.15} className="bg-stone-50 p-7 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-sky-700" />
                </div>
                <h4 className="text-lg font-semibold">{t.benefits.clients.title}</h4>
              </div>
              <ul className="space-y-2.5">
                {t.benefits.clients.list.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1 h-1 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-stone-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
