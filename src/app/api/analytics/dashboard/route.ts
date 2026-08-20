import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCached } from '@/lib/cache'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR' && session.user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const cacheKey = `analytics:${session.user.id}`

    const data = await getCached(cacheKey, async () => {
      const now = new Date()
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      // Build base where clause based on role
      const isTeamMember = session.user.role === 'TEAM_MEMBER' && session.user.assignedBranchIds
      const branchIds = isTeamMember ? session.user.assignedBranchIds! : undefined

      const baseWhere = branchIds
        ? {
          checklist: {
            branchId: { in: branchIds },
            branch: { client: { user: { status: { not: 'ARCHIVED' as const } } } }
          },
          deletedAt: null
        }
        : {
          checklist: {
            branch: { client: { user: { status: { not: 'ARCHIVED' as const } } } }
          },
          deletedAt: null
        }

      // 1. Revenue aggregations (replaces fetching ALL work orders)
      const [thisMonthAgg, lastMonthAgg] = await Promise.all([
        prisma.checklistItem.aggregate({
          where: {
            ...baseWhere,
            stage: 'COMPLETED',
            updatedAt: { gte: firstDayThisMonth }
          },
          _sum: { price: true }
        }),
        prisma.checklistItem.aggregate({
          where: {
            ...baseWhere,
            stage: 'COMPLETED',
            updatedAt: { gte: firstDayLastMonth, lte: lastDayLastMonth }
          },
          _sum: { price: true }
        })
      ])

      const thisMonthRevenue = Number(thisMonthAgg._sum.price || 0)
      const lastMonthRevenue = Number(lastMonthAgg._sum.price || 0)
      const revenueChange = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0

      // 2. Counts via groupBy (single query instead of filtering in JS)
      const [statusGroups, typeGroups, activeCount, overdueCount, completedCount, totalCount] = await Promise.all([
        // Status counts
        prisma.checklistItem.groupBy({
          by: ['stage'],
          where: baseWhere,
          _count: { id: true }
        }),
        // Type counts
        prisma.checklistItem.groupBy({
          by: ['workOrderType'],
          where: baseWhere,
          _count: { id: true }
        }),
        // Active count
        prisma.checklistItem.count({
          where: { ...baseWhere, stage: { notIn: ['COMPLETED', 'ARCHIVED'] } }
        }),
        // Overdue count
        prisma.checklistItem.count({
          where: {
            ...baseWhere,
            scheduledDate: { lt: now },
            stage: { notIn: ['COMPLETED', 'ARCHIVED'] }
          }
        }),
        // Completed count
        prisma.checklistItem.count({
          where: { ...baseWhere, stage: 'COMPLETED' }
        }),
        // Total count
        prisma.checklistItem.count({ where: baseWhere })
      ])

      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

      // Build status counts map
      const statusMap = new Map(statusGroups.map(g => [g.stage, g._count.id]))
      const statusCounts = {
        SCHEDULED: statusMap.get('SCHEDULED') || 0,
        IN_PROGRESS: statusMap.get('IN_PROGRESS') || 0,
        FOR_REVIEW: statusMap.get('FOR_REVIEW') || 0,
        COMPLETED: statusMap.get('COMPLETED') || 0,
      }

      // Build type counts map
      const typeMap = new Map(typeGroups.map(g => [g.workOrderType, g._count.id]))
      const typeCounts = {
        SERVICE: typeMap.get('SERVICE') || 0,
        INSPECTION: typeMap.get('INSPECTION') || 0,
        MAINTENANCE: typeMap.get('MAINTENANCE') || 0,
        INSTALLATION: typeMap.get('INSTALLATION') || 0,
      }

      // 3. Revenue by month (6 queries but aggregated, not fetching rows)
      const revenueByMonthPromises = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        revenueByMonthPromises.push(
          prisma.checklistItem.aggregate({
            where: {
              ...baseWhere,
              stage: 'COMPLETED',
              updatedAt: { gte: monthStart, lte: monthEnd }
            },
            _sum: { price: true }
          }).then(agg => ({
            month: monthStart.toLocaleDateString('ar-SA', { month: 'short' }),
            revenue: Number(agg._sum.price || 0)
          }))
        )
      }
      const revenueByMonth = await Promise.all(revenueByMonthPromises)

      // 4. Top clients by revenue (aggregated, not fetching all work orders)
      const topClientRevenue = await prisma.checklistItem.findMany({
        where: {
          ...baseWhere,
          stage: 'COMPLETED',
          price: { not: null }
        },
        select: {
          price: true,
          checklist: {
            select: {
              branch: {
                select: {
                  client: {
                    select: { id: true, companyName: true }
                  }
                }
              }
            }
          }
        },
        take: 500 // Limit to recent completed work orders with prices
      })

      const clientRevenue = new Map<string, { name: string; revenue: number }>()
      topClientRevenue.forEach(wo => {
        const client = wo.checklist?.branch?.client
        if (!client) return
        const current = clientRevenue.get(client.id) || { name: client.companyName, revenue: 0 }
        current.revenue += Number(wo.price || 0)
        clientRevenue.set(client.id, current)
      })

      const topClients = Array.from(clientRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return {
        stats: {
          revenue: {
            current: thisMonthRevenue,
            change: revenueChange,
            label: 'مقارنة بالشهر الماضي'
          },
          activeWorkOrders: { count: activeCount, label: 'نشط' },
          overdueWorkOrders: { count: overdueCount, label: 'متأخر' },
          completionRate: { rate: completionRate, label: 'معدل الإكمال' }
        },
        charts: {
          revenueByMonth: {
            labels: revenueByMonth.map(m => m.month),
            values: revenueByMonth.map(m => m.revenue)
          },
          workOrdersByStatus: {
            labels: ['مجدول', 'قيد التنفيذ', 'للمراجعة', 'مكتمل'],
            values: [statusCounts.SCHEDULED, statusCounts.IN_PROGRESS, statusCounts.FOR_REVIEW, statusCounts.COMPLETED]
          },
          workOrdersByType: {
            labels: ['خدمة', 'تفتيش', 'صيانة', 'تركيب'],
            values: [typeCounts.SERVICE, typeCounts.INSPECTION, typeCounts.MAINTENANCE, typeCounts.INSTALLATION]
          }
        },
        topClients
      }
    }, 300) // Cache for 5 minutes

    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
