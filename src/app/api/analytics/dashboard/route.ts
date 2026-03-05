import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can access analytics
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get date ranges
    const now = new Date()
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Get all work orders
    const allWorkOrders = await prisma.checklistItem.findMany({
      include: {
        checklist: {
          include: {
            project: {
              include: {
                branch: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate total revenue this month (completed work orders)
    const thisMonthRevenue = allWorkOrders
      .filter(wo => {
        return wo.updatedAt >= firstDayThisMonth && wo.stage === 'COMPLETED' && wo.price
      })
      .reduce((sum, wo) => sum + (wo.price || 0), 0)

    // Calculate total revenue last month
    const lastMonthRevenue = allWorkOrders
      .filter(wo => {
        return wo.updatedAt >= firstDayLastMonth && wo.updatedAt <= lastDayLastMonth && wo.stage === 'COMPLETED' && wo.price
      })
      .reduce((sum, wo) => sum + (wo.price || 0), 0)

    // Calculate revenue change percentage
    const revenueChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    // Count active work orders (not completed or archived)
    const activeWorkOrders = allWorkOrders.filter(
      wo => wo.stage !== 'COMPLETED' && wo.stage !== 'ARCHIVED'
    ).length

    // Count overdue work orders
    const overdueWorkOrders = allWorkOrders.filter(wo => {
      if (!wo.scheduledDate || wo.stage === 'COMPLETED' || wo.stage === 'ARCHIVED') return false
      return new Date(wo.scheduledDate) < now
    }).length

    // Calculate completion rate
    const completedCount = allWorkOrders.filter(wo => wo.stage === 'COMPLETED').length
    const totalCount = allWorkOrders.length
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    // Get work orders by status
    const statusCounts = {
      SCHEDULED: allWorkOrders.filter(wo => wo.stage === 'SCHEDULED').length,
      IN_PROGRESS: allWorkOrders.filter(wo => wo.stage === 'IN_PROGRESS').length,
      FOR_REVIEW: allWorkOrders.filter(wo => wo.stage === 'FOR_REVIEW').length,
      COMPLETED: allWorkOrders.filter(wo => wo.stage === 'COMPLETED').length,
    }

    // Get work orders by type
    const typeCounts = {
      SERVICE: allWorkOrders.filter(wo => wo.workOrderType === 'SERVICE').length,
      INSPECTION: allWorkOrders.filter(wo => wo.workOrderType === 'INSPECTION').length,
      MAINTENANCE: allWorkOrders.filter(wo => wo.workOrderType === 'MAINTENANCE').length,
      INSTALLATION: allWorkOrders.filter(wo => wo.workOrderType === 'INSTALLATION').length,
    }

    // Get revenue by month for last 6 months
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthRevenue = allWorkOrders
        .filter(wo => {
          return wo.updatedAt >= monthStart && wo.updatedAt <= monthEnd && wo.stage === 'COMPLETED' && wo.price
        })
        .reduce((sum, wo) => sum + (wo.price || 0), 0)

      revenueByMonth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      })
    }

    // Get top clients by revenue
    const clientRevenue = new Map<string, { name: string; revenue: number }>()
    
    allWorkOrders.forEach(wo => {
      if (wo.price && wo.checklist?.project?.branch?.client) {
        const client = wo.checklist.project.branch.client
        const current = clientRevenue.get(client.id) || { name: client.companyName, revenue: 0 }
        current.revenue += wo.price
        clientRevenue.set(client.id, current)
      }
    })

    const topClients = Array.from(clientRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        revenue: {
          current: thisMonthRevenue,
          change: revenueChange,
          label: 'vs last month'
        },
        activeWorkOrders: {
          count: activeWorkOrders,
          label: 'active'
        },
        overdueWorkOrders: {
          count: overdueWorkOrders,
          label: 'overdue'
        },
        completionRate: {
          rate: completionRate,
          label: 'completion rate'
        }
      },
      charts: {
        revenueByMonth: {
          labels: revenueByMonth.map(m => m.month),
          values: revenueByMonth.map(m => m.revenue)
        },
        workOrdersByStatus: {
          labels: ['Scheduled', 'In Progress', 'For Review', 'Completed'],
          values: [
            statusCounts.SCHEDULED,
            statusCounts.IN_PROGRESS,
            statusCounts.FOR_REVIEW,
            statusCounts.COMPLETED
          ]
        },
        workOrdersByType: {
          labels: ['Service', 'Inspection', 'Maintenance', 'Installation'],
          values: [
            typeCounts.SERVICE,
            typeCounts.INSPECTION,
            typeCounts.MAINTENANCE,
            typeCounts.INSTALLATION
          ]
        }
      },
      topClients
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
