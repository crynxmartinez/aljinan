import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  FileText, 
  Receipt, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertCircle,
  MessageSquare,
  Users,
  MapPin,
  ClipboardList,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { NotificationsList } from './notifications-list'

interface ActivityItem {
  id: string
  type: 'request' | 'quotation' | 'appointment' | 'invoice' | 'client' | 'branch' | 'message'
  title: string
  description: string
  timestamp: Date
  status?: string
  link?: string
  clientName?: string
  branchAddress?: string
}

async function getRecentActivity(userId: string): Promise<ActivityItem[]> {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      clients: {
        include: {
          branches: {
            include: {
              requests: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                  branch: {
                    include: {
                      client: true
                    }
                  }
                }
              },
              quotations: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                  branch: {
                    include: {
                      client: true
                    }
                  }
                }
              },
              appointments: {
                orderBy: { createdAt: 'desc' },
                take: 5,
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
      }
    }
  })

  if (!contractor) return []

  const activities: ActivityItem[] = []

  contractor.clients.forEach(client => {
    client.branches.forEach(branch => {
      branch.requests.forEach(request => {
        activities.push({
          id: request.id,
          type: 'request',
          title: request.title,
          description: `New request from ${client.companyName}`,
          timestamp: request.createdAt,
          status: request.status,
          link: `/dashboard/clients/${client.id}/branches/${branch.id}?tab=requests`,
          clientName: client.companyName,
          branchAddress: branch.address
        })
      })

      branch.quotations.forEach(quotation => {
        activities.push({
          id: quotation.id,
          type: 'quotation',
          title: quotation.title,
          description: `Quotation for ${client.companyName}`,
          timestamp: quotation.createdAt,
          status: quotation.status,
          link: `/dashboard/clients/${client.id}/branches/${branch.id}?tab=quotations`,
          clientName: client.companyName,
          branchAddress: branch.address
        })
      })

      branch.appointments.forEach(appointment => {
        activities.push({
          id: appointment.id,
          type: 'appointment',
          title: appointment.title,
          description: `Appointment at ${branch.address}`,
          timestamp: appointment.createdAt,
          status: appointment.status,
          link: `/dashboard/clients/${client.id}/branches/${branch.id}?tab=appointments`,
          clientName: client.companyName,
          branchAddress: branch.address
        })
      })
    })
  })

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return activities.slice(0, 20)
}

async function getPendingCounts(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId }
  })

  if (!contractor) return { requests: 0, quotations: 0, appointments: 0 }

  const clients = await prisma.client.findMany({
    where: { contractorId: contractor.id },
    select: { id: true }
  })

  const clientIds = clients.map(c => c.id)

  const [requests, quotations, appointments] = await Promise.all([
    prisma.request.count({
      where: {
        branch: { clientId: { in: clientIds } },
        status: 'REQUESTED'
      }
    }),
    prisma.quotation.count({
      where: {
        branch: { clientId: { in: clientIds } },
        status: { in: ['DRAFT', 'SENT'] }
      }
    }),
    prisma.appointment.count({
      where: {
        branch: { clientId: { in: clientIds } },
        status: 'SCHEDULED',
        date: { gte: new Date() }
      }
    })
  ])

  return { requests, quotations, appointments }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'request':
      return <FileText className="h-4 w-4" />
    case 'quotation':
      return <Receipt className="h-4 w-4" />
    case 'appointment':
      return <Calendar className="h-4 w-4" />
    case 'invoice':
      return <Receipt className="h-4 w-4" />
    case 'client':
      return <Users className="h-4 w-4" />
    case 'branch':
      return <MapPin className="h-4 w-4" />
    case 'message':
      return <MessageSquare className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'OPEN':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Open</Badge>
    case 'IN_PROGRESS':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">In Progress</Badge>
    case 'COMPLETED':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
    case 'DRAFT':
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft</Badge>
    case 'SENT':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sent</Badge>
    case 'APPROVED':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
    case 'SCHEDULED':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Scheduled</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const [activities, counts] = await Promise.all([
    getRecentActivity(session.user.id),
    getPendingCounts(session.user.id)
  ])

  const stats = [
    { 
      label: 'Open Requests', 
      value: counts.requests, 
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Pending Quotations', 
      value: counts.quotations, 
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    { 
      label: 'Upcoming Appointments', 
      value: counts.appointments, 
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notifications & Activity</h1>
          <p className="text-muted-foreground">Stay updated on work orders and client activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsList />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from all clients and branches</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Activity from your clients will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <Link
                        key={activity.id}
                        href={activity.link || '#'}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{activity.title}</p>
                            {activity.status && getStatusBadge(activity.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          {activity.branchAddress && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.branchAddress}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
