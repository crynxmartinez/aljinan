import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCached } from '@/lib/cache'
import { getLocale, getTranslationsForLocale } from '@/lib/i18n/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR' && session.user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const locale = await getLocale()
    const t = getTranslationsForLocale(locale)
    const dateLocale = locale === 'en' ? 'en-US' : 'ar-SA-u-nu-latn'
    const profile = session.user.role === 'CONTRACTOR'
      ? await prisma.contractor.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      : await prisma.teamMember.findUnique({ where: { userId: session.user.id }, select: { contractorId: true } })
    if (!profile) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    const contractorId = 'contractorId' in profile ? profile.contractorId : profile.id
    const cacheKey = `analytics:v2:${session.user.id}:${locale}`

    const data = await getCached(cacheKey, async () => {
      const now = new Date()
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      // Build base where clause based on role
      const baseWhere = {
        checklist: {
          branch: {
            client: { contractorId, user: { status: { not: 'ARCHIVED' as const } } },
            ...(session.user.role === 'TEAM_MEMBER' ? {
              teamMemberAccess: { some: { teamMember: { userId: session.user.id } } },
            } : {}),
          },
        },
        deletedAt: null,
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
            updatedAt: { gte: firstDayLastMonth, lt: firstDayThisMonth }
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
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        revenueByMonthPromises.push(
          prisma.checklistItem.aggregate({
            where: {
              ...baseWhere,
              stage: 'COMPLETED',
              updatedAt: { gte: monthStart, lt: monthEnd }
            },
            _sum: { price: true }
          }).then(agg => ({
            month: monthStart.toLocaleDateString(dateLocale, { month: 'short' }),
            revenue: Number(agg._sum.price || 0)
          }))
        )
      }
      const revenueByMonth = await Promise.all(revenueByMonthPromises)

      // 4. Top clients by revenue (aggregated, not fetching all work orders)
      const topClientRevenue = await prisma.checklistItem.groupBy({
        by: ['checklistId'],
        where: {
          ...baseWhere,
          stage: 'COMPLETED',
          price: { not: null }
        },
        _sum: { price: true },
      })
      const checklists = await prisma.checklist.findMany({
        where: { id: { in: topClientRevenue.map(row => row.checklistId) } },
        select: { id: true, branch: { select: { client: { select: { id: true, companyName: true } } } } },
      })
      const clientsByChecklist = new Map(checklists.map(row => [row.id, row.branch.client]))

      const clientRevenue = new Map<string, { name: string; revenue: number }>()
      topClientRevenue.forEach(wo => {
        const client = clientsByChecklist.get(wo.checklistId)
        if (!client) return
        const current = clientRevenue.get(client.id) || { name: client.companyName, revenue: 0 }
        current.revenue += Number(wo._sum.price || 0)
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
            label: t.dashboard.analyticsPage.comparedToLastMonth
          },
          activeWorkOrders: { count: activeCount, label: t.dashboard.clientsPage.active },
          overdueWorkOrders: { count: overdueCount, label: t.dashboard.analyticsPage.overdue },
          completionRate: { rate: completionRate, label: t.dashboard.analyticsPage.completionRate }
        },
        charts: {
          revenueByMonth: {
            labels: revenueByMonth.map(m => m.month),
            values: revenueByMonth.map(m => m.revenue)
          },
          workOrdersByStatus: {
            labels: [
              t.dashboard.workOrdersPage.statusScheduled,
              t.dashboard.workOrdersPage.statusInProgress,
              t.dashboard.workOrdersPage.statusForReview,
              t.dashboard.workOrdersPage.statusCompleted
            ],
            values: [statusCounts.SCHEDULED, statusCounts.IN_PROGRESS, statusCounts.FOR_REVIEW, statusCounts.COMPLETED]
          },
          workOrdersByType: {
            labels: [
              t.dashboard.workOrdersPage.typeService,
              t.dashboard.workOrdersPage.typeInspection,
              t.dashboard.workOrdersPage.typeMaintenance,
              t.dashboard.workOrdersPage.typeInstallation
            ],
            values: [typeCounts.SERVICE, typeCounts.INSPECTION, typeCounts.MAINTENANCE, typeCounts.INSTALLATION]
          }
        },
        topClients
      }
    }, session.user.role === 'TEAM_MEMBER' ? 0 : 300)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
