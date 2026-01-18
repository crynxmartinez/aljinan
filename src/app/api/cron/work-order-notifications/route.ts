import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Vercel Cron runs this daily at 8 AM UTC
// This endpoint:
// 1. Sends reminders for upcoming work orders (5 days, 3 days, 1 day, same day)
// 2. Auto-progresses SCHEDULED work orders to IN_PROGRESS on their scheduled date
// 3. Notifies clients on the scheduled date

export async function GET(request: Request) {
  try {
    // Verify cron secret for security (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow without secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const notifications: Array<{
      userId: string
      type: 'WORK_ORDER_REMINDER' | 'WORK_ORDER_STARTED' | 'CONTRACT_EXPIRING'
      title: string
      message: string
      link: string | null
      relatedId: string
      relatedType: string
    }> = []

    // Get all scheduled work orders with their project and branch info
    const workOrders = await prisma.checklistItem.findMany({
      where: {
        scheduledDate: { not: null },
        stage: { in: ['SCHEDULED', 'REQUESTED'] }
      },
      include: {
        checklist: {
          include: {
            project: {
              include: {
                branch: {
                  include: {
                    client: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Get contractor user IDs for notifications
    const contractors = await prisma.contractor.findMany({
      select: { userId: true, id: true }
    })
    const contractorUserIds = contractors.map(c => c.userId)

    for (const workOrder of workOrders) {
      if (!workOrder.scheduledDate) continue

      const scheduledDate = new Date(workOrder.scheduledDate)
      scheduledDate.setHours(0, 0, 0, 0)

      const diffTime = scheduledDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const project = workOrder.checklist.project
      const branch = project?.branch
      const client = branch?.client

      if (!project || !branch || !client) continue

      const link = `/dashboard/clients/${client.id}/branches/${branch.id}?tab=checklist`
      const clientLink = `/portal/branches/${branch.id}?tab=checklist`

      // Contractor notifications: 5 days, 3 days, 1 day, same day
      if ([5, 3, 1, 0].includes(diffDays)) {
        const dayText = diffDays === 0 ? 'today' : 
                        diffDays === 1 ? 'tomorrow' : 
                        `in ${diffDays} days`

        for (const contractorUserId of contractorUserIds) {
          notifications.push({
            userId: contractorUserId,
            type: 'WORK_ORDER_REMINDER',
            title: `Work Order ${dayText === 'today' ? 'Due Today' : 'Reminder'}`,
            message: `"${workOrder.description}" for ${client.companyName} is scheduled ${dayText}`,
            link,
            relatedId: workOrder.id,
            relatedType: 'ChecklistItem'
          })
        }
      }

      // Client notification: only on scheduled date
      if (diffDays === 0 && client.user) {
        notifications.push({
          userId: client.user.id,
          type: 'WORK_ORDER_STARTED',
          title: 'Work Order Starting Today',
          message: `"${workOrder.description}" is scheduled to begin today`,
          link: clientLink,
          relatedId: workOrder.id,
          relatedType: 'ChecklistItem'
        })
      }

      // Auto-progress to IN_PROGRESS on scheduled date
      if (diffDays === 0 && workOrder.stage === 'SCHEDULED') {
        await prisma.checklistItem.update({
          where: { id: workOrder.id },
          data: { stage: 'IN_PROGRESS' }
        })
      }
    }

    // Contract expiry notifications
    // Contractor: 10, 5, 3, 1 days before
    // Client: 1 day before
    const contracts = await prisma.contract.findMany({
      where: {
        status: 'SIGNED',
        endDate: { not: null }
      },
      include: {
        branch: {
          include: {
            client: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    for (const contract of contracts) {
      if (!contract.endDate) continue

      const endDate = new Date(contract.endDate)
      endDate.setHours(0, 0, 0, 0)

      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const client = contract.branch.client
      if (!client) continue

      const contractorLink = `/dashboard/clients/${client.id}/branches/${contract.branchId}?tab=contracts`
      const clientLink = `/portal/branches/${contract.branchId}?tab=contracts`

      // Contractor notifications: 10, 5, 3, 1 days before
      if ([10, 5, 3, 1].includes(diffDays)) {
        const dayText = diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`

        for (const contractorUserId of contractorUserIds) {
          notifications.push({
            userId: contractorUserId,
            type: 'CONTRACT_EXPIRING',
            title: 'Contract Expiring Soon',
            message: `Contract "${contract.title}" for ${client.companyName} expires ${dayText}`,
            link: contractorLink,
            relatedId: contract.id,
            relatedType: 'Contract'
          })
        }
      }

      // Client notification: 1 day before
      if (diffDays === 1 && client.user) {
        notifications.push({
          userId: client.user.id,
          type: 'CONTRACT_EXPIRING',
          title: 'Contract Expiring Tomorrow',
          message: `Your contract "${contract.title}" expires tomorrow`,
          link: clientLink,
          relatedId: contract.id,
          relatedType: 'Contract'
        })
      }
    }

    // Batch create notifications (avoid duplicates by checking existing)
    const createdNotifications = []
    for (const notif of notifications) {
      // Check if similar notification already exists today
      const existing = await prisma.notification.findFirst({
        where: {
          userId: notif.userId,
          relatedId: notif.relatedId,
          type: notif.type,
          createdAt: {
            gte: today
          }
        }
      })

      if (!existing) {
        const created = await prisma.notification.create({
          data: notif
        })
        createdNotifications.push(created)
      }
    }

    return NextResponse.json({
      success: true,
      processed: workOrders.length,
      notificationsCreated: createdNotifications.length,
      autoProgressedCount: workOrders.filter(wo => {
        if (!wo.scheduledDate) return false
        const sd = new Date(wo.scheduledDate)
        sd.setHours(0, 0, 0, 0)
        return sd.getTime() === today.getTime() && wo.stage === 'SCHEDULED'
      }).length
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process work order notifications' },
      { status: 500 }
    )
  }
}
