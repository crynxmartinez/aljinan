'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectFilter } from '@/components/modules/project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ClientBranchRequests } from './client-branch-requests'
import { ClientBranchQuotations } from './client-branch-quotations'
import { ClientBranchAppointments } from './client-branch-appointments'
import { ClientBranchInvoices } from './client-branch-invoices'
import { ClientBranchContracts } from './client-branch-contracts'
import { ClientBranchReports } from './client-branch-reports'
import {
  MapPin,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  ClipboardList,
  FileCheck,
  MessageSquare,
} from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  notes: string | null
}

interface ClientBranchWorkspaceProps {
  branchId: string
  branch: Branch
}

export function ClientBranchWorkspace({ branchId, branch }: ClientBranchWorkspaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)

  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
        {/* Project Filter and Activity Toggle */}
        <div className="flex items-center justify-between mb-4">
          <ProjectFilter
            branchId={branchId}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityPanelOpen(!activityPanelOpen)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Activity
          </Button>
        </div>

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
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Branch Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{branch.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{branch.address}</p>
                  </div>
                  {branch.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-medium">
                        {branch.city}{branch.state ? `, ${branch.state}` : ''}
                        {branch.zipCode ? ` ${branch.zipCode}` : ''}
                      </p>
                    </div>
                  )}
                  {branch.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{branch.phone}</p>
                    </div>
                  )}
                  {branch.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{branch.notes}</p>
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Activity will appear here once you have requests, quotes, or appointments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            <ClientBranchRequests branchId={branchId} />
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="mt-0">
            <ClientBranchQuotations branchId={branchId} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-0">
            <ClientBranchAppointments branchId={branchId} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-0">
            <ClientBranchInvoices branchId={branchId} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-0">
            <ClientBranchContracts branchId={branchId} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-0">
            <ClientBranchReports branchId={branchId} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Activity Panel */}
      <ActivityPanel
        branchId={branchId}
        projectId={selectedProjectId}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
      />
    </>
  )
}
