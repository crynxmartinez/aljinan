import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, Eye, Wrench, CheckCircle, AlertTriangle } from 'lucide-react'
import { NotificationsList } from './notifications-list'
import { prisma } from '@/lib/prisma'

async function getClientStats(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      branches: {
        where: { isActive: true }
      }
    }
  })

  const branchIds = client?.branches.map(b => b.id) || []

  if (branchIds.length === 0) {
    return {
      workOrdersForReview: 0,
      workOrdersInProgress: 0,
      workOrdersCompleted: 0,
    }
  }

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [workOrdersForReview, workOrdersInProgress, workOrdersCompleted] = await Promise.all([
    // Work orders awaiting client review
    prisma.checklistItem.count({
      where: {
        checklist: {
          project: {
            branchId: { in: branchIds }
          }
        },
        stage: 'FOR_REVIEW',
        deletedAt: null
      }
    }),

    // Work orders currently in progress
    prisma.checklistItem.count({
      where: {
        checklist: {
          project: {
            branchId: { in: branchIds }
          }
        },
        stage: 'IN_PROGRESS',
        deletedAt: null
      }
    }),

    // Work orders completed this month
    prisma.checklistItem.count({
      where: {
        checklist: {
          project: {
            branchId: { in: branchIds }
          }
        },
        stage: 'COMPLETED',
        updatedAt: { gte: firstDayOfMonth },
        deletedAt: null
      }
    })
  ])

  return {
    workOrdersForReview,
    workOrdersInProgress,
    workOrdersCompleted,
  }
}

export default async function ClientNotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/dashboard')
  }

  const stats = await getClientStats(session.user.id)

  const statCards = [
    { 
      label: 'Awaiting My Review', 
      value: stats.workOrdersForReview, 
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Work orders ready for your approval'
    },
    { 
      label: 'Work In Progress', 
      value: stats.workOrdersInProgress, 
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Currently being worked on'
    },
    { 
      label: 'Completed This Month', 
      value: stats.workOrdersCompleted, 
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Work orders finished'
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on work orders and contractor activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>View and manage all your notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationsList />
        </CardContent>
      </Card>
    </div>
  )
}
