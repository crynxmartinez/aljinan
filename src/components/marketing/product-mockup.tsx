'use client'

import { CheckCircle2, Clock, FileCheck, TrendingUp } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

/**
 * A stylized, illustrative representation of the product's dashboard — not a literal
 * screenshot. Framed in browser chrome so it reads as "this is the app" at a glance, which
 * is the single biggest visual cue premium SaaS landing pages use that this site was
 * missing entirely (it previously showed zero product UI anywhere).
 */
export function ProductMockup({ className }: { className?: string }) {
  const { t } = useTranslation()
  const m = t.hero.mockup

  return (
    <div className={className}>
      {/* This whole frame is a fixed illustrative mockup, not live UI — kept in one
          consistent left-to-right orientation regardless of the page's own direction,
          the same way a captured product screenshot would be. */}
      <div className="rounded-xl border border-stone-200/80 bg-white shadow-[0_20px_70px_-15px_rgba(0,0,0,0.35)] overflow-hidden" dir="ltr">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <div className="ms-3 flex-1 rounded-md bg-white border border-stone-200 px-3 py-1 text-xs text-stone-400 text-start">
            app.tasheel.sa/dashboard
          </div>
        </div>

        {/* Illustrative dashboard body */}
        <div className="p-5 text-start">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                <FileCheck className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{m.statWorkOrders}</span>
              </div>
              <div className="text-lg font-bold text-stone-900">24</div>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{m.statCertificates}</span>
              </div>
              <div className="text-lg font-bold text-stone-900">96%</div>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center gap-1.5 text-sky-700 mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{m.statCompliance}</span>
              </div>
              <div className="text-lg font-bold text-stone-900">A+</div>
            </div>
          </div>

          <div className="rounded-lg border border-stone-100 overflow-hidden">
            <div className="flex items-center justify-between bg-stone-50 px-3 py-2 border-b border-stone-100">
              <span className="text-xs font-semibold text-stone-700">{m.tableTitle}</span>
              <Clock className="h-3.5 w-3.5 text-stone-400" />
            </div>
            {[
              { name: m.rowFireAlarm, status: m.statusScheduled, color: 'bg-sky-100 text-sky-700' },
              { name: m.rowHvac, status: m.statusInProgress, color: 'bg-amber-100 text-amber-700' },
              { name: m.rowElectrical, status: m.statusCompleted, color: 'bg-emerald-100 text-emerald-700' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-stone-50 last:border-0">
                <span className="text-sm text-stone-700">{row.name}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${row.color}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
