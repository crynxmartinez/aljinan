'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RequestsList } from '@/components/modules/requests-list'
import { QuotationsList } from '@/components/modules/quotations-list'
import { AppointmentsList } from '@/components/modules/appointments-list'
import { InvoicesList } from '@/components/modules/invoices-list'
import { ContractsList } from '@/components/modules/contracts-list'
import { ChecklistsList } from '@/components/modules/checklists-list'
import { ProjectFilter } from '@/components/modules/project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ProjectsTable } from '@/components/modules/projects-table'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  FileCheck,
  ClipboardList,
  MessageSquare,
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
    { id: 'checklists', label: 'Checklist', icon: ClipboardList },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'quotations', label: 'Quotations', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: DollarSign },
    { id: 'contracts', label: 'Contracts', icon: FileCheck },
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
          <BranchDashboard branch={branch} branchId={branchId} />
        </TabsContent>

        <TabsContent value="checklists" className="mt-0">
          <ChecklistsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <RequestsList branchId={branchId} userRole="CONTRACTOR" projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <AppointmentsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="quotations" className="mt-0">
          <QuotationsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-0">
          <InvoicesList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-0">
          <ContractsList branchId={branchId} projectId={selectedProjectId} />
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

function BranchDashboard({ branch, branchId }: { branch: Branch; branchId: string }) {
  const handleCreateProject = () => {
    // TODO: Open create project modal
    console.log('Create project clicked')
  }

  return (
    <div className="space-y-6">
      <ProjectsTable branchId={branchId} onCreateProject={handleCreateProject} />
    </div>
  )
}

