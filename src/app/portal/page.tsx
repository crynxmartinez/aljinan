import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Calendar, Banknote, Receipt, Building2, Phone, Mail,
  ChevronRight, Edit, Wrench, Eye, CheckCircle, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { BranchRequestForm } from './branch-request-form'
import { ActionCenterTable } from '@/components/dashboard/action-center-table'
import { getTranslations } from '@/lib/i18n/server'

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

async function getClientDashboardStats(userId: string) {
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
      pendingQuotes: 0,
      upcomingAppointments: 0,
      unpaidInvoices: 0,
      workOrdersForReview: 0,
      workOrdersInProgress: 0,
      workOrdersCompletedThisMonth: 0,
      overdueWorkOrders: 0,
    }
  }

  const today = new Date()
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(today.getDate() + 7)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    pendingQuotes,
    upcomingAppointments,
    unpaidInvoices,
    workOrdersForReview,
    workOrdersInProgress,
    workOrdersCompletedThisMonth,
    overdueWorkOrders
  ] = await Promise.all([
    // Pending quotes waiting for client approval
    prisma.quotation.count({
      where: {
        branchId: { in: branchIds },
        status: 'SENT'
      }
    }),

    // Upcoming appointments in next 7 days
    prisma.appointment.count({
      where: {
        branchId: { in: branchIds },
        date: {
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    }),

    // Unpaid invoices
    prisma.invoice.count({
      where: {
        branchId: { in: branchIds },
        status: { in: ['SENT', 'OVERDUE', 'PARTIAL'] }
      }
    }),

    // Work orders awaiting client review
    prisma.checklistItem.count({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        stage: 'FOR_REVIEW',
        deletedAt: null
      }
    }),

    // Work orders currently in progress
    prisma.checklistItem.count({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        stage: 'IN_PROGRESS',
        deletedAt: null
      }
    }),

    // Work orders completed this month
    prisma.checklistItem.count({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        stage: 'COMPLETED',
        updatedAt: { gte: firstDayOfMonth },
        deletedAt: null
      }
    }),

    // Overdue work orders
    prisma.checklistItem.count({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        scheduledDate: { lt: today },
        stage: { notIn: ['COMPLETED', 'ARCHIVED'] },
        deletedAt: null
      }
    })
  ])

  return {
    pendingQuotes,
    upcomingAppointments,
    unpaidInvoices,
    workOrdersForReview,
    workOrdersInProgress,
    workOrdersCompletedThisMonth,
    overdueWorkOrders,
  }
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

  const stats = await getClientDashboardStats(session.user.id)
  const t = await getTranslations()
  const tp = t.dashboard.portalPage

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.companyName}</h1>
            <p className="text-muted-foreground">
              {tp.managedBy} {client.contractor.companyName || tp.yourContractor}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Basic Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.branches}</p>
                <p className="text-3xl font-bold">{client.branches.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.pendingQuotes}</p>
                <p className="text-3xl font-bold">{stats.pendingQuotes}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.appointments}</p>
                <p className="text-3xl font-bold">{stats.upcomingAppointments}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.unpaid}</p>
                <p className="text-3xl font-bold">{stats.unpaidInvoices}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Banknote className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Order Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.awaitingMyReview}</p>
                <p className="text-3xl font-bold">{stats.workOrdersForReview}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.workInProgress}</p>
                <p className="text-3xl font-bold">{stats.workOrdersInProgress}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.completedThisMonth}</p>
                <p className="text-3xl font-bold">{stats.workOrdersCompletedThisMonth}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tp.overdueWork}</p>
                <p className="text-3xl font-bold">{stats.overdueWorkOrders}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Branches - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{tp.yourBranches}</CardTitle>
                <CardDescription>{tp.manageFacilityLocations}</CardDescription>
              </div>
              <BranchRequestForm />
            </CardHeader>
            <CardContent>
              {client.branches.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">{tp.noBranchesYet}</p>
                  <p className="text-sm text-muted-foreground">
                    {tp.requestNewBranch}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/portal/branches/${branch.slug || branch.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.name || branch.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.city}{branch.state ? `, ${branch.state}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!branch.isActive && (
                          <Badge variant="secondary">{tp.inactive}</Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Company Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{tp.companyProfile}</CardTitle>
              <Link href="/portal/settings">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {tp.viewManageCompanyInfo}
              </p>
              <Link href="/portal/settings">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-1" />
                  {tp.viewProfile}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Contractor Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tp.yourContractorCard}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{client.contractor.companyName || tp.notSpecified}</p>
                  <p className="text-xs text-muted-foreground">{tp.serviceProvider}</p>
                </div>
              </div>
              {client.contractor.companyEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.contractor.companyEmail}</span>
                </div>
              )}
              {client.contractor.companyPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.contractor.companyPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Center - Delayed Work Orders, Expiring Equipment */}
      <div>
        <ActionCenterTable userRole="CLIENT" />
      </div>
    </div>
  )
}
