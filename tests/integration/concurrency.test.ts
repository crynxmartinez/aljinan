import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma, closeDb, signIn, apiFetch, tenants, adhocChecklist } from './helpers'

/**
 * Every concurrency finding in this codebase came from the same shape: read to check whether
 * something exists, then write. Two requests arriving together both read "no" and both write.
 *
 * Each test here fires the same operation twice at once and asserts the invariant holds. They
 * are cheap and easy to forget to write, which is why they are grouped rather than scattered.
 */

let cookies: string
let branchId: string
let contractorUserId: string
let contractorId: string

beforeAll(async () => {
  cookies = await signIn('contractor')
  const t = await tenants()
  branchId = t.branchId
  contractorUserId = t.contractorUserId
  const contractor = await prisma.contractor.findUniqueOrThrow({
    where: { userId: contractorUserId },
    select: { id: true },
  })
  contractorId = contractor.id
})

afterAll(closeDb)

describe('completing a work order twice at once', () => {
  it('produces exactly one set of certificates', async () => {
    const stamp = `CC-${Date.now()}`
    const equipment = await prisma.equipment.create({
      data: {
        branchId,
        equipmentNumber: stamp,
        equipmentType: 'FIRE_EXTINGUISHER',
        location: 'Concurrency',
        inspectionResult: 'PASS',
        status: 'ACTIVE',
      },
    })

    const checklist = await adhocChecklist(branchId, contractorUserId)
    const workOrder = await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        description: `${stamp} concurrent completion`,
        stage: 'IN_PROGRESS',
        type: 'ADHOC',
        workOrderType: 'STICKER_INSPECTION',
        recurringType: 'ONCE',
        occurrenceIndex: 1,
        inspectionResult: 'PASSED',
        clientSignature: 'data:image/png;base64,iVBORw0KGgo=',
        clientSignedAt: new Date(),
        price: 500,
      },
    })
    await prisma.equipment.update({
      where: { id: equipment.id },
      data: { workOrderId: workOrder.id },
    })

    const sign = () =>
      apiFetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        cookies,
        json: {
          action: 'supervisor_sign',
          workOrderId: workOrder.id,
          signature: 'data:image/png;base64,iVBORw0KGgo=',
        },
      })

    // Both requests race the same findFirst-then-create.
    await Promise.allSettled([sign(), sign()])

    const certificates = await prisma.certificate.count({ where: { workOrderId: workOrder.id } })
    expect(certificates).toBe(1)

    await prisma.certificate.deleteMany({ where: { workOrderId: workOrder.id } })
    await prisma.equipment.delete({ where: { id: equipment.id } })
    await prisma.checklistItem.delete({ where: { id: workOrder.id } })
  })
})

describe('work order numbering', () => {
  it('never reuses a number across concurrent creates', async () => {
    const before = await prisma.contractor.findUniqueOrThrow({
      where: { id: contractorId },
      select: { nextWorkOrderNumber: true },
    })

    // The counter increment is atomic; this confirms twenty parallel claims all differ.
    const claims = await Promise.all(
      Array.from({ length: 20 }, () =>
        prisma.contractor.update({
          where: { id: contractorId },
          data: { nextWorkOrderNumber: { increment: 1 } },
          select: { nextWorkOrderNumber: true },
        })
      )
    )

    const numbers = claims.map(c => c.nextWorkOrderNumber)
    expect(new Set(numbers).size).toBe(numbers.length)

    // put the counter back
    await prisma.contractor.update({
      where: { id: contractorId },
      data: { nextWorkOrderNumber: before.nextWorkOrderNumber },
    })
  })
})

describe('client slugs', () => {
  it('are unique within a contractor', async () => {
    const stamp = `slug-${Date.now()}`
    const users = await Promise.all([
      prisma.user.create({
        data: { email: `${stamp}-a@test.local`, password: '', role: 'CLIENT', status: 'ACTIVE' },
      }),
      prisma.user.create({
        data: { email: `${stamp}-b@test.local`, password: '', role: 'CLIENT', status: 'ACTIVE' },
      }),
    ])

    const first = await prisma.client.create({
      data: {
        userId: users[0].id, contractorId, companyName: 'Same Name Co', slug: stamp,
      },
    })

    // The composite unique constraint is what makes this a database error rather than two
    // clients sharing a URL.
    await expect(
      prisma.client.create({
        data: {
          userId: users[1].id, contractorId, companyName: 'Same Name Co', slug: stamp,
        },
      })
    ).rejects.toThrow()

    await prisma.client.delete({ where: { id: first.id } })
    await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } })
  })

  it('may repeat across different contractors', async () => {
    // A global unique constraint made two tenants with a same-named client collide and 500.
    const stamp = `shared-${Date.now()}`
    const rivalContractor = await prisma.contractor.findFirstOrThrow({
      where: { user: { email: 'rival@tasheel.local' } },
      select: { id: true },
    })

    const users = await Promise.all([
      prisma.user.create({
        data: { email: `${stamp}-1@test.local`, password: '', role: 'CLIENT', status: 'ACTIVE' },
      }),
      prisma.user.create({
        data: { email: `${stamp}-2@test.local`, password: '', role: 'CLIENT', status: 'ACTIVE' },
      }),
    ])

    const a = await prisma.client.create({
      data: { userId: users[0].id, contractorId, companyName: 'Acme', slug: stamp },
    })
    const b = await prisma.client.create({
      data: {
        userId: users[1].id, contractorId: rivalContractor.id, companyName: 'Acme', slug: stamp,
      },
    })

    expect(a.slug).toBe(b.slug)

    await prisma.client.deleteMany({ where: { id: { in: [a.id, b.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } })
  })
})

describe('reference integrity', () => {
  it('refuses a notification addressed to a user that does not exist', async () => {
    // Notification.userId had no foreign key, so this inserted happily and was never seen —
    // which is exactly how the "work started immediately" notification went missing.
    await expect(
      prisma.notification.create({
        data: {
          userId: 'no-such-user',
          type: 'WORK_ORDER_REMINDER',
          title: 'x',
          message: 'x',
        },
      })
    ).rejects.toThrow()
  })

  it('refuses a certificate pointing at equipment that does not exist', async () => {
    await expect(
      prisma.certificate.create({
        data: {
          branchId,
          type: 'INSPECTION',
          title: 'x',
          issueDate: new Date(),
          issuedBy: 'x',
          equipmentId: 'no-such-equipment',
        },
      })
    ).rejects.toThrow()
  })
})
