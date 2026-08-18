import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma, closeDb, signIn, apiFetch, tenants, adhocChecklist } from './helpers'

/**
 * The central compliance invariant: a certificate is only ever issued for equipment that
 * actually passed inspection.
 *
 * Until August 2026, completing a sticker-inspection work order wrote
 * `inspectionResult: 'PASS'` and `status: 'ACTIVE'` to every linked item unconditionally and
 * issued a certificate for each. A fire extinguisher a technician recorded as FAIL came out
 * marked passing, with its warning status cleared and a certificate valid for a year — the
 * document a client shows a Civil Defence inspector.
 *
 * A type-checker cannot see this. Only a test that drives a real inspection can.
 */

let cookies: string
let branchId: string
let contractorUserId: string

beforeAll(async () => {
  cookies = await signIn('contractor')
  const t = await tenants()
  branchId = t.branchId
  contractorUserId = t.contractorUserId
})

afterAll(closeDb)

type Outcome = 'PASS' | 'FAIL' | 'NEEDS_REPAIR' | 'PENDING'
type WorkOrderOutcome = 'PASSED' | 'FAILED' | 'ATTENTION_REQUIRED'

/**
 * Runs a sticker inspection over equipment with the given recorded outcomes and completes it
 * through the API, returning what the platform did. Certificates only generate once the
 * client has signed and a price is set, so the work order is created already past that gate.
 */
async function runInspection(equipmentOutcomes: Outcome[], workOrderOutcome: WorkOrderOutcome) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const equipment: Array<{ id: string }> = []
  for (const [i, outcome] of equipmentOutcomes.entries()) {
    equipment.push(
      await prisma.equipment.create({
        data: {
          branchId,
          equipmentNumber: `T-${stamp}-${i}`,
          equipmentType: 'FIRE_EXTINGUISHER',
          location: 'Test',
          inspectionResult: outcome,
          status: outcome === 'PASS' ? 'ACTIVE' : 'NEEDS_ATTENTION',
        },
      })
    )
  }

  const checklist = await adhocChecklist(branchId, contractorUserId)

  const workOrder = await prisma.checklistItem.create({
    data: {
      checklistId: checklist.id,
      description: `Test inspection ${stamp}`,
      stage: 'IN_PROGRESS',
      type: 'ADHOC',
      workOrderType: 'STICKER_INSPECTION',
      recurringType: 'ONCE',
      occurrenceIndex: 1,
      inspectionResult: workOrderOutcome,
      inspectionDate: new Date('2026-08-01T09:00:00Z'),
      clientSignature: 'data:image/png;base64,iVBORw0KGgo=',
      clientSignedAt: new Date(),
      price: 500,
    },
  })

  await prisma.equipment.updateMany({
    where: { id: { in: equipment.map(e => e.id) } },
    data: { workOrderId: workOrder.id },
  })

  const res = await apiFetch(`/api/branches/${branchId}/checklist-items`, {
    method: 'PATCH',
    cookies,
    json: {
      action: 'supervisor_sign',
      workOrderId: workOrder.id,
      signature: 'data:image/png;base64,iVBORw0KGgo=',
    },
  })

  const after = await prisma.equipment.findMany({
    where: { id: { in: equipment.map(e => e.id) } },
    select: {
      equipmentNumber: true, inspectionResult: true, status: true, certificateIssued: true,
    },
    orderBy: { equipmentNumber: 'asc' },
  })

  const certificates = await prisma.certificate.findMany({
    where: { workOrderId: workOrder.id },
    select: { equipmentId: true, issueDate: true, expiryDate: true },
  })

  const cleanup = async () => {
    await prisma.certificate.deleteMany({ where: { workOrderId: workOrder.id } })
    await prisma.equipment.deleteMany({ where: { id: { in: equipment.map(e => e.id) } } })
    await prisma.checklistItem.delete({ where: { id: workOrder.id } })
  }

  return { status: res.status, after, certificates, workOrderId: workOrder.id, cleanup }
}

describe('a certificate follows the recorded inspection outcome', () => {
  it('issues nothing for equipment recorded as FAIL', async () => {
    const r = await runInspection(['FAIL', 'FAIL'], 'FAILED')
    try {
      expect(r.status).toBe(200)
      expect(r.certificates).toHaveLength(0)
      expect(r.after.every(e => e.inspectionResult === 'FAIL')).toBe(true)
      expect(r.after.every(e => e.status === 'NEEDS_ATTENTION')).toBe(true)
      expect(r.after.every(e => e.certificateIssued === false)).toBe(true)
    } finally {
      await r.cleanup()
    }
  })

  it('issues nothing for equipment needing repair', async () => {
    const r = await runInspection(['NEEDS_REPAIR'], 'ATTENTION_REQUIRED')
    try {
      expect(r.certificates).toHaveLength(0)
      expect(r.after[0].status).toBe('NEEDS_ATTENTION')
    } finally {
      await r.cleanup()
    }
  })

  it('issues nothing for equipment never inspected', async () => {
    const r = await runInspection(['PENDING'], 'PASSED')
    try {
      expect(r.certificates).toHaveLength(0)
      expect(r.after[0].certificateIssued).toBe(false)
    } finally {
      await r.cleanup()
    }
  })

  it('still issues a certificate per item that passed', async () => {
    const r = await runInspection(['PASS', 'PASS'], 'PASSED')
    try {
      expect(r.certificates).toHaveLength(2)
      expect(r.after.every(e => e.certificateIssued === true)).toBe(true)
      expect(r.after.every(e => e.status === 'ACTIVE')).toBe(true)
    } finally {
      await r.cleanup()
    }
  })

  it('issues nothing at all when the inspection as a whole needs attention', async () => {
    // Even the item that passed gets nothing: the inspection did not demonstrate compliance.
    const r = await runInspection(['PASS', 'FAIL'], 'ATTENTION_REQUIRED')
    try {
      expect(r.certificates).toHaveLength(0)
      const failed = r.after.find(e => e.inspectionResult === 'FAIL')
      expect(failed?.status).toBe('NEEDS_ATTENTION')
    } finally {
      await r.cleanup()
    }
  })

  it('dates validity from the inspection, not from completion', async () => {
    const r = await runInspection(['PASS'], 'PASSED')
    try {
      expect(r.certificates).toHaveLength(1)
      const cert = r.certificates[0]
      // The work order was inspected on 1 August; completion is today.
      expect(cert.issueDate.toISOString().slice(0, 10)).toBe('2026-08-01')
      // A one-off recurrence is valid a year from inspection.
      expect(cert.expiryDate?.toISOString().slice(0, 10)).toBe('2027-08-01')
    } finally {
      await r.cleanup()
    }
  })
})

describe('duplicate protection', () => {
  it('refuses a second auto-generated certificate for the same item', async () => {
    const r = await runInspection(['PASS'], 'PASSED')
    try {
      const existing = await prisma.certificate.findFirstOrThrow({
        where: { workOrderId: r.workOrderId },
      })

      // What two concurrent completions would attempt.
      await expect(
        prisma.certificate.create({
          data: {
            branchId,
            workOrderId: r.workOrderId,
            equipmentId: existing.equipmentId,
            type: 'INSPECTION',
            title: 'Duplicate attempt',
            issueDate: new Date(),
            issuedBy: 'System (Auto-generated)',
          },
        })
      ).rejects.toThrow()
    } finally {
      await r.cleanup()
    }
  })

  it('still allows a manually issued certificate alongside', async () => {
    const r = await runInspection(['PASS'], 'PASSED')
    try {
      const manual = await prisma.certificate.create({
        data: {
          branchId,
          workOrderId: r.workOrderId,
          type: 'INSPECTION',
          title: 'Manually uploaded',
          issueDate: new Date(),
          issuedBy: 'Ahmed (contractor)',
        },
      })
      expect(manual.id).toBeTruthy()
      await prisma.certificate.delete({ where: { id: manual.id } })
    } finally {
      await r.cleanup()
    }
  })
})
