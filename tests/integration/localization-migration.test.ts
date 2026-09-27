import { afterAll, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { prisma, closeDb, tenants } from './helpers'
import { generatedField } from '../../src/lib/i18n/generated-content'
afterAll(closeDb)
it('historical provenance migration is repeatable and preserves customer edits', async () => {
  const { branchId, contractorUserId } = await tenants()
  const rollback = new Error('rollback isolated migration fixture')
  const statements = readFileSync('prisma/migrations/20260927120000_recipient_locale/migration.sql', 'utf8').split(';').map(value => value.trim()).filter(Boolean)
  try {
    await prisma.$transaction(async db => {
      const equipment = await db.equipment.create({ data: { branchId, equipmentNumber: 'MIGRATION-TEST', equipmentType: 'FIRE_EXTINGUISHER', location: 'Test' } })
      const original = { branchId, type: 'INSPECTION' as const, title: 'FIRE EXTINGUISHER MIGRATION-TEST - Inspection Certificate', description: 'Sticker inspection certificate for MIGRATION-TEST', issuedBy: 'System (Auto-generated)', issueDate: new Date() }
      const generated = await db.certificate.create({ data: { ...original, equipmentId: equipment.id } })
      const edited = await db.certificate.create({ data: { ...original, title: 'Customer signed certificate شهادة العميل' } })
      const checklist = await db.checklist.create({ data: { branchId, title: 'Migration fixture', createdById: contractorUserId } })
      const work = await db.checklistItem.create({ data: { checklistId: checklist.id, description: 'Customer inspection', stage: 'COMPLETED' } })
      const workCertificate = await db.certificate.create({ data: { ...original, workOrderId: work.id, title: 'Inspection Certificate - Customer inspection', description: 'Customer findings that must stay unchanged' } })
      for (const sql of statements) await db.$executeRawUnsafe(sql)
      const first = await db.certificate.findUniqueOrThrow({ where: { id: generated.id } })
      expect(first.title).toBe(original.title)
      expect(first.generatedContent).toMatchObject({ kind: 'equipmentCertificate' })
      expect(generatedField(first, 'title', 'ar')).toContain('شهادة فحص')
      expect((await db.certificate.findUniqueOrThrow({ where: { id: edited.id } })).generatedContent).toBeNull()
      const inspected = await db.certificate.findUniqueOrThrow({ where: { id: workCertificate.id } })
      expect(generatedField(inspected, 'description', 'ar')).toBe(workCertificate.description)
      for (const sql of statements) await db.$executeRawUnsafe(sql)
      expect((await db.certificate.findUniqueOrThrow({ where: { id: generated.id } })).generatedContent).toEqual(first.generatedContent)
      throw rollback
    }, { timeout: 30000 })
  } catch (error) { if (error !== rollback) throw error }
})
