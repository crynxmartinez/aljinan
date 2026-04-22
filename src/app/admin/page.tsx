import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, MapPin, FileText, ClipboardList, Shield } from 'lucide-react'
import { AdminCharts } from '@/components/admin/admin-charts'
import { RecentActivity } from '@/components/admin/recent-activity'

async function getAdminStats() {
  try {
    const [
      contractorCount,
      clientCount,
      branchCount,
      requestCount,
      workOrderCount,
      adminCount,
    ] = await Promise.all([
      prisma.contractor.count().catch(() => 0),
      prisma.client.count().catch(() => 0),
      prisma.branch.count({ where: { isActive: true } }).catch(() => 0),
      prisma.request.count().catch(() => 0),
      prisma.checklistItem.count().catch(() => 0),
      prisma.adminUser.count().catch(() => 0),
    ])

    return {
      contractors: contractorCount,
      clients: clientCount,
      branches: branchCount,
      requests: requestCount,
      workOrders: workOrderCount,
      admins: adminCount,
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return {
      contractors: 0,
      clients: 0,
      branches: 0,
      requests: 0,
      workOrders: 0,
      admins: 0,
    }
  }
}

async function getRequestsByMonth() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const requests = await prisma.request.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const monthMap = new Map<string, number>()
    for (let i = 0; i < 6; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthMap.set(key, 0)
    }

    requests.forEach((r) => {
      const key = r.createdAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1)
      }
    })

    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }))
  } catch (error) {
    console.error('Error fetching requests by month:', error)
    return []
  }
}

async function getRequestsByStatus() {
  try {
    const statusGroups = await prisma.request.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statusLabels: Record<string, string> = {
      REQUESTED: 'Requested',
      QUOTED: 'Quoted',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
      FOR_REVIEW: 'For Review',
      PENDING_APPROVAL: 'Pending Approval',
      CLOSED: 'Closed',
    }

    return statusGroups.map((g) => ({
      status: statusLabels[g.status] || g.status,
      count: g._count.id,
    }))
  } catch (error) {
    console.error('Error fetching requests by status:', error)
    return []
  }
}

async function getRecentActivity() {
  try {
    const activities: {
      id: string
      type: 'contractor_registered' | 'client_added' | 'request_created' | 'request_completed'
      title: string
      description: string
      timestamp: string
      contractorName?: string
    }[] = []

    // Recent contractors
    const recentContractors = await prisma.contractor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true, createdAt: true } } },
    }).catch(() => [])

    recentContractors.forEach((c) => {
      activities.push({
        id: `c-${c.id}`,
        type: 'contractor_registered',
        title: c.companyName || c.user.name || 'New Contractor',
        description: c.user.email,
        timestamp: c.createdAt.toISOString(),
      })
    })

    // Recent requests
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          include: {
            client: {
              include: {
                contractor: { select: { companyName: true } },
              },
            },
          },
        },
      },
    }).catch(() => [])

    recentRequests.forEach((r) => {
      activities.push({
        id: `r-${r.id}`,
        type: r.status === 'COMPLETED' ? 'request_completed' : 'request_created',
        title: r.title,
        description: `Branch: ${r.branch.name}`,
        timestamp: r.createdAt.toISOString(),
        contractorName: r.branch.client.contractor.companyName || undefined,
      })
    })

    // Sort by timestamp desc and take top 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return activities.slice(0, 10)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const [stats, requestsByMonth, requestsByStatus, recentActivity] = await Promise.all([
    getAdminStats(),
    getRequestsByMonth(),
    getRequestsByStatus(),
    getRecentActivity(),
  ])

  const statCards = [
    {
      title: 'Total Contractors',
      value: stats.contractors,
      description: 'Registered contractors',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Clients',
      value: stats.clients,
      description: 'Across all contractors',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Branches',
      value: stats.branches,
      description: 'Active locations',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Requests',
      value: stats.requests,
      description: 'All service requests',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Work Orders',
      value: stats.workOrders,
      description: 'All work orders',
      icon: ClipboardList,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Admin Users',
      value: stats.admins,
      description: 'Platform administrators',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts requestsByMonth={requestsByMonth} requestsByStatus={requestsByStatus} />

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity} />
    </div>
  )
}
