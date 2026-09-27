import { afterAll, expect, it } from 'vitest'
import { prisma, closeDb, tenants, signIn, apiFetch } from './helpers'
afterAll(closeDb)
it('contractor cancellation notifies the client once and persists the cancellation actor', async () => {
  const { branchId, contractorUserId, clientUserId } = await tenants()
  const cookies = await signIn('contractor')
  const appointment = await prisma.appointment.create({ data: { branchId, title: 'Cancellation regression', date: new Date(), startTime: '10:00', createdById: contractorUserId } })
  try {
    const patch = () => apiFetch(`/api/branches/${branchId}/appointments/${appointment.id}`, { cookies, method: 'PATCH', json: { status: 'CANCELLED' } })
    expect((await patch()).status).toBe(200)
    expect((await patch()).status).toBe(200)
    const notices = await prisma.notification.findMany({ where: { relatedId: appointment.id } })
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({ userId: clientUserId, type: 'APPOINTMENT_CANCELLED' })
    expect(notices[0].content).toMatchObject({ version: 1 })
    expect(notices[0].link).toContain('/portal/branches/')
    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).cancelledById).toBe(contractorUserId)
  } finally {
    await prisma.notification.deleteMany({ where: { relatedId: appointment.id } })
    await prisma.appointment.delete({ where: { id: appointment.id } })
  }
})
