import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MapPin, FileText, Calendar, AlertCircle, DollarSign } from 'lucide-react'

async function getDashboardStats(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      clients: {
        where: {
          user: {
            status: { not: 'ARCHIVED' }
          }
        },
        include: {
          branches: {
            where: { isActive: true }
          }
        }
      }
    }
  })

  const totalClients = contractor?.clients.length || 0
  const totalBranches = contractor?.clients.reduce(
    (acc, client) => acc + client.branches.length,
    0
  ) || 0

  return {
    totalClients,
    totalBranches,
    pendingRequests: 0,
    pendingQuotes: 0,
    upcomingAppointments: 0,
    overduePayments: 0,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const stats = await getDashboardStats(session.user.id)

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      description: 'Active clients',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Branches',
      value: stats.totalBranches,
      description: 'Across all clients',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      description: 'Needs attention',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Pending Quotes',
      value: stats.pendingQuotes,
      description: 'Awaiting approval',
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      description: 'Next 7 days',
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Overdue Payments',
      value: stats.overduePayments,
      description: 'Requires follow-up',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session.user?.name || session.user?.email}
        </p>
      </div>

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

      {stats.totalClients === 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              You haven&apos;t added any clients yet. Start by creating your first client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/clients/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Users className="mr-2 h-4 w-4" />
              Add Your First Client
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
