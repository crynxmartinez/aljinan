import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Auto-Archive Cron Job
 * 
 * Runs daily at 00:01 (1 minute after midnight) on January 1st
 * Archives all COMPLETED work orders from previous years
 * 
 * Logic:
 * - Work order completed in 2024 → Auto-archived on Jan 1, 2025
 * - Work order completed in 2025 → Auto-archived on Jan 1, 2026
 * 
 * This endpoint should be called by Vercel Cron or similar scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentYear = now.getFullYear()

    // Get start of current year (Jan 1, 00:00:00)
    const startOfCurrentYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)

    // Find all COMPLETED work orders from previous years
    const workOrdersToArchive = await prisma.checklistItem.findMany({
      where: {
        stage: 'COMPLETED',
        completedAt: {
          lt: startOfCurrentYear // Completed before this year
        },
        deletedAt: null // Not already archived
      },
      include: {
        checklist: {
          include: {
            branch: {
              include: {
                client: {
                  include: {
                    user: true,
                    contractor: {
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

    console.log(`[Auto-Archive] Found ${workOrdersToArchive.length} work orders to archive`)

    let archivedCount = 0
    let notificationCount = 0
    let failedCount = 0

    // Archive each work order
    for (const workOrder of workOrdersToArchive) {
      try {
        const result = await prisma.$transaction(async prisma => {
        let notices = 0
        // Update work order to ARCHIVED
        const updated = await prisma.checklistItem.updateMany({
          where: { id: workOrder.id, stage: 'COMPLETED', deletedAt: null },
          data: {
            stage: 'ARCHIVED',
            deletedAt: now,
            deletedBy: null, // null = auto-archived
            deletedReason: 'AUTO' // Auto-archived by system
          }
        })

        if (!updated.count) return { archived: 0, notices: 0 }

        // Skip notifications if branch is null
        if (!workOrder.checklist.branch) {
          console.log(`[Auto-Archive] Skipping notifications for work order ${workOrder.id} - no branch`)
          return { archived: 1, notices: 0 }
        }

        // Create notification for client
        const clientUserId = workOrder.checklist.branch.client.user?.id
        if (clientUserId) {
          const completedYear = workOrder.completedAt
            ? new Date(workOrder.completedAt).getFullYear()
            : 'previous year'

          await prisma.notification.create({
            data: {
              userId: clientUserId,
              type: 'WORK_ORDER_COMPLETED',
              title: 'Work Order Auto-Archived',
              message: `"${workOrder.description}" was automatically archived (completed in ${completedYear})`,
              link: `/portal/branches/${workOrder.checklist.branchId}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })

          notices++
        }

        // Create notification for contractor
        const contractorUserId = workOrder.checklist.branch.client.contractor?.user?.id
        if (contractorUserId) {
          const completedYear = workOrder.completedAt
            ? new Date(workOrder.completedAt).getFullYear()
            : 'previous year'

          await prisma.notification.create({
            data: {
              userId: contractorUserId,
              type: 'WORK_ORDER_COMPLETED',
              title: 'Work Order Auto-Archived',
              message: `"${workOrder.description}" was automatically archived (completed in ${completedYear})`,
              link: `/dashboard/clients/${workOrder.checklist.branch.client.slug}/branches/${workOrder.checklist.branch.slug}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })

          notices++
        }

        return { archived: 1, notices }
        })
        archivedCount += result.archived
        notificationCount += result.notices
        console.log(`[Auto-Archive] Archived work order: ${workOrder.description} (ID: ${workOrder.id})`)
      } catch (error) {
        failedCount++
        console.error(`[Auto-Archive] Failed to archive work order ${workOrder.id}:`, error)
      }
    }

    console.log(`[Auto-Archive] Successfully archived ${archivedCount} work orders`)
    console.log(`[Auto-Archive] Created ${notificationCount} notifications`)

    return NextResponse.json({
      success: failedCount === 0,
      failedCount,
      archivedCount,
      notificationCount,
      message: `Auto-archived ${archivedCount} work orders from previous years`
    }, { status: failedCount ? 500 : 200 })
  } catch (error) {
    console.error('[Auto-Archive] Error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-archive work orders' },
      { status: 500 }
    )
  }
}
