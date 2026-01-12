import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, FileText, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

async function getClientDashboardData(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      contractor: {
        select: {
          companyName: true,
          companyPhone: true,
          companyEmail: true,
        }
      },
      branches: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return client
}

export default async function PortalDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const client = await getClientDashboardData(session.user.id)

  if (!client) {
    redirect('/login')
  }

  const stats = [
    {
      title: 'Your Branches',
      value: client.branches.length,
      description: 'Active locations',
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Open Requests',
      value: 0,
      description: 'Pending review',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Upcoming Appointments',
      value: 0,
      description: 'Next 7 days',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Payments',
      value: 0,
      description: 'Awaiting payment',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {client.companyName}</h1>
        <p className="text-muted-foreground mt-1">
          Your client portal with {client.contractor.companyName || 'your contractor'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

      {/* Branches List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Branches</h2>
        {client.branches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No branches yet</h3>
              <p className="text-muted-foreground text-center">
                Your contractor will add branches for your locations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {client.branches.map((branch) => (
              <Link key={branch.id} href={`/portal/branches/${branch.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{branch.address}</CardTitle>
                        {branch.city && (
                          <CardDescription>{branch.city}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Contractor Info */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Contractor</CardTitle>
            <CardDescription>Contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="text-muted-foreground">Company:</span> {client.contractor.companyName || 'Not specified'}</p>
            {client.contractor.companyEmail && (
              <p><span className="text-muted-foreground">Email:</span> {client.contractor.companyEmail}</p>
            )}
            {client.contractor.companyPhone && (
              <p><span className="text-muted-foreground">Phone:</span> {client.contractor.companyPhone}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
