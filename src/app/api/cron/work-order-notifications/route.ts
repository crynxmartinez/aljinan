import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Daily notification job. Runs at 08:00 UTC (11:00 in Riyadh).
 *
 *   1. Reminds the owning contractor about work orders due in 5 / 3 / 1 / 0 days
 *   2. Tells the client when their work order starts today
 *   3. Auto-progresses SCHEDULED work orders to IN_PROGRESS on the day
 *   4. Warns about contracts expiring in 10 / 5 / 3 / 1 days
 *
 * Three things this used to get wrong:
 *
 *   Tenancy — it loaded every contractor in the system and sent every reminder to all of
 *   them, so each contractor received notifications naming other contractors' clients and
 *   work descriptions. Reminders now go only to the contractor who owns the branch.
 *
 *   Scale — it ran a findFirst plus a create per notification, sequentially. A few hundred
 *   work orders across a few tenants exceeded the function timeout and silently dropped
 *   the remainder. Deduplication is now a unique key and one createMany.
 *
 *   Dates — day boundaries were computed with setHours(0,0,0,0), which resolves in the
 *   runtime timezone (UTC on Vercel) while the business runs at UTC+3. Work scheduled near
 *   midnight landed on the wrong side of the boundary.
 */

const RIYADH_OFFSET_HOURS = 3

/** Midnight in Riyadh for the given instant, expressed as a UTC Date. */
function riyadhStartOfDay(instant: Date): Date {
  const shifted = new Date(instant.getTime() + RIYADH_OFFSET_HOURS * 3600_000)
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      RIYADH_OFFSET_HOURS * 3600_000
  )
}

/** Whole days from today to the target date, both taken as Riyadh calendar days. */
function daysUntil(target: Date, todayStart: Date): number {
  const targetStart = riyadhStartOfDay(target)
  return Math.round((targetStart.getTime() - todayStart.getTime()) / 86_400_000)
}

/** Riyadh calendar day as YYYY-MM-DD, used in the dedupe key. */
function riyadhDayKey(todayStart: Date): string {
  const shifted = new Date(todayStart.getTime() + RIYADH_OFFSET_HOURS * 3600_000)
  return shifted.toISOString().slice(0, 10)
}

type PendingNotification = {
  userId: string
  type: 'WORK_ORDER_REMINDER' | 'WORK_ORDER_STARTED' | 'CONTRACT_EXPIRING'
  title: string
  message: string
  link: string | null
  relatedId: string
  relatedType: string
  dedupeKey: string
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET

    // Refuse outright if the secret is not configured, rather than falling open.
    if (!expected || authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = riyadhStartOfDay(now)
    const dayKey = riyadhDayKey(todayStart)

    const notifications: PendingNotification[] = []
    const toProgress: string[] = []

    // ---- work orders -------------------------------------------------------
    const workOrders = await prisma.checklistItem.findMany({
      where: {
        deletedAt: null, // an archived work order must not be resurrected or announced
        scheduledDate: { not: null },
        stage: 'SCHEDULED',
      },
      select: {
        id: true,
        description: true,
        scheduledDate: true,
        checklist: {
          select: {
            branchId: true,
            branch: {
              select: {
                id: true,
                client: {
                  select: {
                    id: true,
                    companyName: true,
                    user: { select: { id: true } },
                    // The one contractor who should hear about this branch.
                    contractor: { select: { userId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    for (const workOrder of workOrders) {
      if (!workOrder.scheduledDate) continue

      const branch = workOrder.checklist?.branch
      const client = branch?.client
      if (!branch || !client) continue

      const diffDays = daysUntil(workOrder.scheduledDate, todayStart)

      const contractorLink = `/dashboard/clients/${client.id}/branches/${branch.id}?tab=checklist`
      const clientLink = `/portal/branches/${branch.id}?tab=checklist`

      if ([5, 3, 1, 0].includes(diffDays) && client.contractor?.userId) {
        const dayText =
          diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`

        notifications.push({
          userId: client.contractor.userId,
          type: 'WORK_ORDER_REMINDER',
          title: diffDays === 0 ? 'Work Order Due Today' : 'Work Order Reminder',
          message: `"${workOrder.description}" for ${client.companyName} is scheduled ${dayText}`,
          link: contractorLink,
          relatedId: workOrder.id,
          relatedType: 'ChecklistItem',
          dedupeKey: `${client.contractor.userId}:WORK_ORDER_REMINDER:${workOrder.id}:${dayKey}`,
        })
      }

      if (diffDays === 0 && client.user) {
        notifications.push({
          userId: client.user.id,
          type: 'WORK_ORDER_STARTED',
          title: 'Work Order Starting Today',
          message: `"${workOrder.description}" is scheduled to begin today`,
          link: clientLink,
          relatedId: workOrder.id,
          relatedType: 'ChecklistItem',
          dedupeKey: `${client.user.id}:WORK_ORDER_STARTED:${workOrder.id}:${dayKey}`,
        })
      }

      if (diffDays === 0) {
        toProgress.push(workOrder.id)
      }
    }

    // ---- contracts ---------------------------------------------------------
    const contracts = await prisma.contract.findMany({
      where: { status: 'SIGNED', endDate: { not: null } },
      select: {
        id: true,
        title: true,
        endDate: true,
        branchId: true,
        branch: {
          select: {
            client: {
              select: {
                id: true,
                companyName: true,
                user: { select: { id: true } },
                contractor: { select: { userId: true } },
              },
            },
          },
        },
      },
    })

    for (const contract of contracts) {
      if (!contract.endDate) continue

      const client = contract.branch?.client
      if (!client) continue

      const diffDays = daysUntil(contract.endDate, todayStart)

      const contractorLink = `/dashboard/clients/${client.id}/branches/${contract.branchId}?tab=contracts`
      const clientLink = `/portal/branches/${contract.branchId}?tab=contracts`

      if ([10, 5, 3, 1].includes(diffDays) && client.contractor?.userId) {
        const dayText = diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`

        notifications.push({
          userId: client.contractor.userId,
          type: 'CONTRACT_EXPIRING',
          title: 'Contract Expiring Soon',
          message: `Contract "${contract.title}" for ${client.companyName} expires ${dayText}`,
          link: contractorLink,
          relatedId: contract.id,
          relatedType: 'Contract',
          dedupeKey: `${client.contractor.userId}:CONTRACT_EXPIRING:${contract.id}:${dayKey}`,
        })
      }

      if (diffDays === 1 && client.user) {
        notifications.push({
          userId: client.user.id,
          type: 'CONTRACT_EXPIRING',
          title: 'Contract Expiring Tomorrow',
          message: `Your contract "${contract.title}" expires tomorrow`,
          link: clientLink,
          relatedId: contract.id,
          relatedType: 'Contract',
          dedupeKey: `${client.user.id}:CONTRACT_EXPIRING:${contract.id}:${dayKey}`,
        })
      }
    }

    // ---- write -------------------------------------------------------------
    // dedupeKey is unique, so a second run on the same day is a no-op rather than a
    // per-notification existence query.
    let notificationsCreated = 0
    if (notifications.length > 0) {
      const result = await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      })
      notificationsCreated = result.count
    }

    let autoProgressed = 0
    if (toProgress.length > 0) {
      const result = await prisma.checklistItem.updateMany({
        where: { id: { in: toProgress }, stage: 'SCHEDULED', deletedAt: null },
        data: { stage: 'IN_PROGRESS' },
      })
      autoProgressed = result.count
    }

    return NextResponse.json({
      success: true,
      riyadhDay: dayKey,
      workOrdersConsidered: workOrders.length,
      contractsConsidered: contracts.length,
      notificationsCreated,
      autoProgressed,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process work order notifications' },
      { status: 500 }
    )
  }
}
