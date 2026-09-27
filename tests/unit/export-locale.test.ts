import { describe, expect, it, vi } from 'vitest'
vi.mock('file-saver', () => ({ saveAs: vi.fn() }))
import { workOrderRows, requestRows, exportRequestsToExcel, exportRequestsToCsv, type ExportOptions } from '@/lib/export/export-utils'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { enumLabel, enumLabels, timeSlotLabel } from '@/lib/i18n/enum-labels'
import { readFileSync } from 'node:fs'

const options: ExportOptions = { includeDetails: true, includeClient: true, includePricing: true, includeDates: true, includePhotos: false }
describe('exported content', () => {
  it('translates predefined time slots and preserves custom appointment times', () => {
    expect(timeSlotLabel('Morning', 'ar')).toBe('صباحًا')
    expect(timeSlotLabel('ANY_TIME', 'en')).toBe('Any time')
    expect(timeSlotLabel('10:30 - customer preference', 'ar')).toBe('10:30 - customer preference')
  })
  it('writes an actual Arabic XLSX and escapes formula-leading CSV user content', async () => {
    const data = [{ id: 'r', title: '=1+1', description: null, priority: 'URGENT', status: 'QUOTED', assignedTo: null, createdAt: '2026-09-27', dueDate: null, completedAt: null, quotedPrice: 0 }]
    exportRequestsToExcel(data, options, 'ar')
    const [blob, name] = vi.mocked(saveAs).mock.calls.at(-1)!
    expect(name).toMatch(/\.xlsx$/)
    const workbook = XLSX.read(await (blob as Blob).arrayBuffer(), { type: 'array' })
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
    expect(rows[0]).toMatchObject({ العنوان: '=1+1', 'السعر (ر.س)': 0 })
    exportRequestsToCsv(data, options, 'en')
    const [csv] = vi.mocked(saveAs).mock.calls.at(-1)!
    expect(await (csv as Blob).text()).toContain("'=1+1")
  })
  it('uses selected-language headings/statuses while preserving user text and zero prices', () => {
    const data = [{ id: '1', description: 'Customer text وصف', stage: 'IN_PROGRESS', workOrderType: 'SERVICE', scheduledDate: null, price: 0, clientName: 'ABC', branchName: 'Riyadh' }]
    expect(workOrderRows(data, options, 'en')[0]).toMatchObject({ Description: 'Customer text وصف', Status: 'In progress', 'Price (SAR)': 0 })
    expect(workOrderRows(data, options, 'ar')[0]).toMatchObject({ الوصف: 'Customer text وصف', الحالة: 'قيد التنفيذ', 'السعر (ر.س)': 0 })
    expect(Object.keys(workOrderRows(data, options, 'ar')[0])).not.toContain('Status')
  })
  it('localizes request priorities and preserves a quoted price of zero', () => {
    const row = requestRows([{ id: 'r', title: 'User title', description: null, priority: 'URGENT', status: 'QUOTED', assignedTo: null, createdAt: '2026-09-27', dueDate: null, completedAt: null, quotedPrice: 0 }], options, 'ar')[0]
    expect(row['الأولوية']).toBe('عاجل')
    expect(row['السعر (ر.س)']).toBe(0)
  })
  it('covers all current display enums and fails safely for a new value', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8')
    for (const match of schema.matchAll(/enum (\w+) \{([\s\S]*?)\}/g)) {
      if (match[1] === 'NotificationType') continue
      for (const value of match[2].matchAll(/^\s+(\w+)\s*(?:\/\/.*)?$/gm)) {
        expect(enumLabels.ar).toHaveProperty(value[1])
        expect(enumLabels.en).toHaveProperty(value[1])
      }
    }
    expect(enumLabel('FUTURE_TYPE', 'ar')).toBe('غير معروف')
  })
})
