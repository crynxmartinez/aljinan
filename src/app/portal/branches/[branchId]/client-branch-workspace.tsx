'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ClientBranchRequests } from './client-branch-requests'
import { ClientBranchContracts } from './client-branch-contracts'
import { BillingView } from '@/components/modules/billing-view'
import { CalendarView } from '@/components/modules/calendar-view'
import { ChecklistKanban } from '@/components/modules/checklist-kanban'
import { DocumentsList } from '@/components/modules/documents-list'
import { EquipmentList } from '@/components/modules/equipment-list'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  FileCheck,
  MessageSquare,
  ClipboardList,
  Settings,
  Award,
  Tag,
} from 'lucide-react'
import { BranchProfileCard } from '@/components/branches/branch-profile-card'

interface Branch {
  id: string
  clientId: string
  name: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  phone: string | null
  notes: string | null
  municipality: string | null
  buildingType: string | null
  floorCount: number | null
  areaSize: number | null
  cdCertificateNumber: string | null
  cdCertificateExpiry: string | null
  cdCertificateUrl: string | null
}

interface ClientBranchWorkspaceProps {
  branchId: string
  branch: Branch
}

export function ClientBranchWorkspace({ branchId, branch }: ClientBranchWorkspaceProps) {
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)
  const [openRequestsCount, setOpenRequestsCount] = useState(0)
  const [activeTab, setActiveTab] = useState('dashboard')

  const fetchRequestsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        const activeRequestStatuses = ['REQUESTED', 'QUOTED']
        const openCount = data.filter((r: { status: string }) =>
          activeRequestStatuses.includes(r.status)
        ).length
        setOpenRequestsCount(openCount)
      }
    } catch {
      // Silently fail
    }
  }, [branchId])

  useEffect(() => {
    fetchRequestsCount()
  }, [fetchRequestsCount])

  const handleDataChange = () => {
    fetchRequestsCount()
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Activity Toggle */}
        <div className="flex items-center justify-end mb-4">
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
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
            {openRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {openRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <p>Use the Contracts tab to view your work orders.</p>
            </div>
          </TabsContent>

          {/* Kanban Board Tab */}
          <TabsContent value="checklist" className="mt-0">
            <ChecklistKanban branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            <ClientBranchRequests branchId={branchId} onDataChange={handleDataChange} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-0">
            <CalendarView branchId={branchId} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-0">
            <BillingView branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-0">
            <ClientBranchContracts branchId={branchId} />
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="mt-0">
            <EquipmentList branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="certificates" className="mt-0">
            <DocumentsList branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <BranchProfileCard
                  branch={branch}
                  activeProject={null}
                  canEdit={true}
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Activity Panel */}
      <ActivityPanel
        branchId={branchId}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
      />
    </>
  )
}
