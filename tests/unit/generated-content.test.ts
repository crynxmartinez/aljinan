import { describe, expect, it } from 'vitest'
import { generatedField, generatedRecord } from '@/lib/i18n/generated-content'
describe('system generated content provenance', () => {
  it('translates new generated defaults without rewriting the record', () => {
    const record = generatedRecord({ title: 'Inspection Certificate', description: 'Original description' }, 'equipmentCertificate', { type: 'FIRE_EXTINGUISHER', number: 'FE-001' })
    expect(generatedField(record, 'title', 'ar')).toContain('شهادة فحص')
    expect(generatedField(record, 'title', 'en')).toContain('Inspection Certificate')
    expect(record.title).toBe('Inspection Certificate')
  })
  it('preserves customer edits and historical records without provenance', () => {
    const record = generatedRecord({ title: 'Original' }, 'equipmentCertificate', { type: 'FIRE_EXTINGUISHER', number: 'FE-001' })
    record.title = 'Customer authored title'
    expect(generatedField(record, 'title', 'ar')).toBe('Customer authored title')
    expect(generatedField({ title: 'Original' }, 'title', 'ar')).toBe('Original')
  })
  it('preserves a customer note in an otherwise generated work order', () => {
    const record = generatedRecord({ description: 'Visit', notes: 'Keep this customer note' }, 'maintenanceVisit', { system: 'Customer system', frequency: 'MONTHLY', visit: '1', defaultNotes: 'false' })
    expect(generatedField(record, 'description', 'ar')).toContain('زيارة 1')
    expect(generatedField(record, 'notes', 'ar')).toBe('Keep this customer note')
  })
})
