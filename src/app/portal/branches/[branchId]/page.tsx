import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  ClipboardList,
} from 'lucide-react'

async function getBranch(branchId: string, userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      branches: {
        where: { id: branchId }
      }
    }
  })

  if (!client || client.branches.length === 0) return null

  return {
    client: {
      id: client.id,
      companyName: client.companyName,
    },
    branch: client.branches[0],
  }
}

export default async function ClientBranchPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { branchId } = await params
  const data = await getBranch(branchId, session.user.id)

  if (!data) {
    notFound()
  }

  const { branch } = data

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/portal"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{branch.address}</h1>
          {branch.city && (
            <p className="text-muted-foreground">{branch.city}{branch.state ? `, ${branch.state}` : ''}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Quotes
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Branch Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{branch.address}</p>
                  </div>
                  {branch.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-medium">{branch.city}{branch.state ? `, ${branch.state}` : ''}</p>
                    </div>
                  )}
                  {branch.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{branch.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates for this branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Requests</h3>
                <p className="text-muted-foreground text-center">
                  Service requests for this branch will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="mt-0">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quotes</h3>
                <p className="text-muted-foreground text-center">
                  Quotations awaiting your approval will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-0">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Appointments</h3>
                <p className="text-muted-foreground text-center">
                  Scheduled visits and inspections will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Payments</h3>
                <p className="text-muted-foreground text-center">
                  Invoices and payment history will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reports</h3>
                <p className="text-muted-foreground text-center">
                  Inspection reports and checklists will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
