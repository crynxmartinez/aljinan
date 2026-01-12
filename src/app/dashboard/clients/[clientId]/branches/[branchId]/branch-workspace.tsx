'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequestsList } from '@/components/modules/requests-list'
import { QuotationsList } from '@/components/modules/quotations-list'
import { AppointmentsList } from '@/components/modules/appointments-list'
import { InvoicesList } from '@/components/modules/invoices-list'
import { ContractsList } from '@/components/modules/contracts-list'
import { ChecklistsList } from '@/components/modules/checklists-list'
import { ProjectFilter } from '@/components/modules/project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  FileCheck,
  ClipboardList,
  MessageSquare,
  Plus,
} from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
}

interface BranchWorkspaceProps {
  clientId: string
  branchId: string
  branch: Branch
}

export function BranchWorkspace({ clientId, branchId, branch }: BranchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)

  const modules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'quotations', label: 'Quotations', icon: Receipt },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'contracts', label: 'Contracts', icon: FileCheck },
    { id: 'checklists', label: 'Checklists', icon: ClipboardList },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ]

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          {modules.map((module) => (
            <TabsTrigger
              key={module.id}
              value={module.id}
              className="flex items-center gap-2 data-[state=active]:bg-background"
            >
              <module.icon className="h-4 w-4" />
              {module.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
        <TabsContent value="dashboard" className="mt-0">
          <BranchDashboard branch={branch} />
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <RequestsList branchId={branchId} userRole="CONTRACTOR" projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="quotations" className="mt-0">
          <QuotationsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="appointments" className="mt-0">
          <AppointmentsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <InvoicesList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-0">
          <ContractsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="checklists" className="mt-0">
          <ChecklistsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <ModulePlaceholder
            title="Messages"
            description="Communication with client"
            icon={MessageSquare}
            actionLabel="New Message"
          />
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

function BranchDashboard({ branch }: { branch: Branch }) {
  const stats = [
    { label: 'Open Requests', value: 0 },
    { label: 'Pending Quotes', value: 0 },
    { label: 'Upcoming Appointments', value: 0 },
    { label: 'Unpaid Invoices', value: 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            {branch.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{branch.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actionLabel: string
}

function ModulePlaceholder({ title, description, icon: Icon, actionLabel }: ModulePlaceholderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {description}. This module will be available soon.
        </p>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
