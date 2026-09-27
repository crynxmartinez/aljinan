import { generatedField } from '@/lib/i18n/generated-content'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from '@/lib/i18n/format-date'
import { enumLabel } from '@/lib/i18n/enum-labels'
import type { Locale } from '@/lib/i18n/translations'

export const exportLabels = {
 en: { number: 'Number', description: 'Description', title: 'Title', client: 'Client', branch: 'Branch', status: 'Status', type: 'Type', date: 'Scheduled date', price: 'Price (SAR)', priority: 'Priority', assigned: 'Assigned to', created: 'Created', due: 'Due date', completed: 'Completed', quoted: 'Quotation date', recurrence: 'Recurrence', workOrders: 'Work orders', requests: 'Requests', generated: 'Generated', total: 'Total' },
 ar: { number: 'الرقم', description: 'الوصف', title: 'العنوان', client: 'العميل', branch: 'الفرع', status: 'الحالة', type: 'النوع', date: 'تاريخ الجدولة', price: 'السعر (ر.س)', priority: 'الأولوية', assigned: 'مسند إلى', created: 'تاريخ الإنشاء', due: 'تاريخ الاستحقاق', completed: 'تاريخ الإكمال', quoted: 'تاريخ عرض السعر', recurrence: 'التكرار', workOrders: 'أوامر العمل', requests: 'الطلبات', generated: 'تاريخ الإنشاء', total: 'المجموع' },
} as const

type Row = Record<string, string | number>
export interface ExportableWorkOrder {
  id: string
  description: string
  stage: string
  workOrderType: string | null
  scheduledDate: string | null
  price: number | null
  clientName: string
  branchName: string
  workOrderNumber?: number | null
}

export interface ExportableRequest {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  dueDate: string | null
  completedAt: string | null
  requestNumber?: number | null
  workOrderType?: string | null
  quotedPrice?: number | null
  quotedDate?: string | null
  recurringType?: string
}

export interface ExportOptions {
  includeDetails: boolean
  includeClient: boolean
  includePricing: boolean
  includeDates: boolean
  includePhotos: boolean
}

export function workOrderRows(data: ExportableWorkOrder[], options: ExportOptions, locale: Locale): Row[] {
 const t = exportLabels[locale]
 return data.map(wo => ({
  [t.number]: wo.workOrderNumber == null ? '-' : `WO-${String(wo.workOrderNumber).padStart(4, '0')}`,
  [t.description]: generatedField(wo, 'description', locale),
  ...(options.includeClient ? { [t.client]: wo.clientName, [t.branch]: wo.branchName } : {}),
  [t.status]: enumLabel(wo.stage, locale), [t.type]: enumLabel(wo.workOrderType, locale),
  ...(options.includeDates ? { [t.date]: formatDate(wo.scheduledDate, locale) } : {}),
  ...(options.includePricing ? { [t.price]: wo.price ?? '' } : {}),
 }))
}

export function requestRows(data: ExportableRequest[], options: ExportOptions, locale: Locale): Row[] {
 const t = exportLabels[locale]
 return data.map(req => ({
  [t.number]: req.requestNumber == null ? '-' : `REQ-${String(req.requestNumber).padStart(4, '0')}`,
  [t.title]: req.title,
  ...(options.includeDetails ? { [t.description]: req.description ?? '', [t.type]: enumLabel(req.workOrderType, locale), [t.priority]: enumLabel(req.priority, locale), [t.assigned]: req.assignedTo ?? '' } : {}),
  [t.status]: enumLabel(req.status, locale),
  ...(options.includeDates ? { [t.created]: formatDate(req.createdAt, locale), [t.due]: formatDate(req.dueDate, locale), [t.completed]: formatDate(req.completedAt, locale), [t.quoted]: formatDate(req.quotedDate, locale) } : {}),
  ...(options.includePricing ? { [t.price]: req.quotedPrice ?? '' } : {}),
  ...(req.recurringType ? { [t.recurrence]: enumLabel(req.recurringType, locale) } : {}),
 }))
}

function saveSheet(rows: Row[], kind: 'workOrders' | 'requests', locale: Locale, csv = false) {
 const sheet = XLSX.utils.json_to_sheet(rows)
 sheet['!cols'] = Object.keys(rows[0] ?? {}).map(key => ({ wch: Math.min(60, Math.max(key.length, ...rows.map(row => String(row[key] ?? '').length)) + 2) }))
 const book = XLSX.utils.book_new()
 book.Workbook = { Views: [{ RTL: locale === 'ar' }] }
 XLSX.utils.book_append_sheet(book, sheet, exportLabels[locale][kind])
 const filename = `${kind}-${new Date().toISOString().slice(0, 10)}`
 if (csv) {
  const safeRows = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'string' && /^[=+@\-\t\r]/.test(value) ? `'${value}` : value])))
  saveAs(new Blob(['\uFEFF', XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(safeRows))], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
 } else {
  saveAs(new Blob([XLSX.write(book, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`)
 }
}

let fontData: Promise<string> | undefined
async function pdfFont(): Promise<string> {
 fontData ??= fetch('/fonts/Tajawal-Regular.ttf').then(async response => {
  if (!response.ok) throw new Error('PDF font unavailable')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
 }).catch(error => { fontData = undefined; throw error })
 return fontData
}

async function savePdf(rows: Row[], kind: 'workOrders' | 'requests', locale: Locale) {
 const t = exportLabels[locale]
 const doc = new jsPDF({ orientation: 'landscape' })
 doc.addFileToVFS('Tajawal-Regular.ttf', await pdfFont())
 doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal')
 doc.setFont('Tajawal')
 doc.setR2L(locale === 'ar')
 const width = doc.internal.pageSize.getWidth()
 doc.setFontSize(18)
 doc.text(t[kind], width / 2, 15, { align: 'center' })
 doc.setFontSize(10)
 doc.text(`${t.generated}: ${formatDate(new Date(), locale)} · ${t.total}: ${rows.length}`, width / 2, 23, { align: 'center' })
 const columns = Object.keys(rows[0] ?? {})
 if (locale === 'ar') columns.reverse()
 autoTable(doc, {
  startY: 30, head: [columns], body: rows.map(row => columns.map(key => typeof row[key] === 'number' && key === t.price ? formatCurrency(row[key] as number, locale) : String(row[key] ?? ''))),
  theme: 'grid', styles: { font: 'Tajawal', fontStyle: 'normal', fontSize: 9, halign: locale === 'ar' ? 'right' : 'left' },
  headStyles: { font: 'Tajawal', fontStyle: 'normal', fillColor: [180, 83, 9] },
 })
 doc.save(`${kind}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const exportWorkOrdersToExcel = (data: ExportableWorkOrder[], options: ExportOptions, locale: Locale) => saveSheet(workOrderRows(data, options, locale), 'workOrders', locale)
export const exportWorkOrdersToCsv = (data: ExportableWorkOrder[], options: ExportOptions, locale: Locale) => saveSheet(workOrderRows(data, options, locale), 'workOrders', locale, true)
export const exportWorkOrdersToPdf = (data: ExportableWorkOrder[], options: ExportOptions, locale: Locale) => savePdf(workOrderRows(data, options, locale), 'workOrders', locale)
export const exportRequestsToExcel = (data: ExportableRequest[], options: ExportOptions, locale: Locale) => saveSheet(requestRows(data, options, locale), 'requests', locale)
export const exportRequestsToCsv = (data: ExportableRequest[], options: ExportOptions, locale: Locale) => saveSheet(requestRows(data, options, locale), 'requests', locale, true)
export const exportRequestsToPdf = (data: ExportableRequest[], options: ExportOptions, locale: Locale) => savePdf(requestRows(data, options, locale), 'requests', locale)
