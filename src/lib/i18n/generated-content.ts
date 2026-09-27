import type { Locale } from './translations'
import { enumLabel } from './enum-labels'
type Kind = 'equipmentCertificate' | 'workOrderCertificate' | 'maintenanceVisit'
type GeneratedContent = { version: 1; kind: Kind; params: Record<string, string>; original: Record<string, string> }
export function generatedRecord<T extends object>(data: T, kind: Kind, params: Record<string, string>): T & { generatedContent: GeneratedContent } {
  const original: Record<string, string> = {}
  for (const field of ['title', 'description', 'notes', 'issuedBy']) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'string') original[field] = value
  }
  return { ...data, generatedContent: { version: 1, kind, params, original } }
}
/** Only proven system defaults are translated. Editing a field breaks its exact
 * original-value match, so customer-written or signed text remains verbatim. */
export function generatedField(record: object, field: string, locale: Locale): string {
  const data = record as Record<string, unknown>
  const value = typeof data[field] === 'string' ? data[field] as string : ''
  const meta = data.generatedContent as GeneratedContent | undefined
  if (!meta || meta.version !== 1 || !meta.original || meta.original[field] !== value || !meta.params) return value
  const p = meta.params, ar = locale === 'ar'
  if (field === 'issuedBy') return ar ? 'النظام (إنشاء تلقائي)' : 'System (Auto-generated)'
  if (meta.kind === 'equipmentCertificate') {
    if (field === 'title') return `${enumLabel(p.type, locale)} ${p.number} - ${ar ? 'شهادة فحص' : 'Inspection Certificate'}`
    if (field === 'description') return ar ? `شهادة فحص الملصقات للمعدة ${p.number}` : `Sticker inspection certificate for ${p.number}`
  }
  if (meta.kind === 'workOrderCertificate') {
    if (field === 'title') return `${enumLabel(p.type, locale)} - ${p.work}`
    if (field === 'description' && p.defaultDescription === 'true') return ar ? `شهادة للعمل المكتمل: ${p.work}` : `Certificate for completed work: ${p.work}`
  }
  if (meta.kind === 'maintenanceVisit') {
    if (field === 'description') return `${p.system} - ${enumLabel(p.frequency, locale)} ${ar ? 'زيارة' : 'Visit'} ${p.visit}`
    if (field === 'notes' && p.defaultNotes === 'true') return ar ? `صيانة مجدولة لـ ${p.system}` : `Scheduled maintenance for ${p.system}`
  }
  return value
}
