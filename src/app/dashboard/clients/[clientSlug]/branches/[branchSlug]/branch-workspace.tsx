'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RequestsList } from '@/components/modules/requests-list'
import { AppointmentsList } from '@/components/modules/appointments-list'
import { BillingView } from '@/components/modules/billing-view'
import { ContractsList } from '@/components/modules/contracts-list'
import { ChecklistsList } from '@/components/modules/checklists-list'
import { DocumentsList } from '@/components/modules/documents-list'
import { EquipmentList } from '@/components/modules/equipment-list'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  FileCheck,
  ClipboardList,
  MessageSquare,
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
  isActive: boolean
  municipality: string | null
  buildingType: string | null
  floorCount: number | null
  areaSize: number | null
  cdCertificateNumber: string | null
  cdCertificateExpiry: string | null
  cdCertificateUrl: string | null
}

interface BranchWorkspaceProps {
  clientId: string
  branchId: string
  branch: Branch
  userRole?: string
  teamMemberRole?: string
}

export function BranchWorkspace({ branchId, branch, userRole, teamMemberRole }: BranchWorkspaceProps) {
  const isTechnician = userRole === 'TEAM_MEMBER' && teamMemberRole === 'TECHNICIAN'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)

  const fetchCounts = useCallback(async () => {
    try {
      // Fetch requests count
      const requestsResponse = await fetch(`/api/branches/${branchId}/requests`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        const activeRequestStatuses = ['REQUESTED', 'QUOTED']
        const openRequests = requestsData.filter((r: { status: string }) =>
          activeRequestStatuses.includes(r.status)
        )
        setPendingRequestsCount(openRequests.length)
      }

      // Fetch checklist items for payment count
      const checklistResponse = await fetch(`/api/branches/${branchId}/checklist-items`)
      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json()
        const pendingPayments = checklistData.filter((item: { paymentStatus: string }) => item.paymentStatus === 'PENDING_VERIFICATION')
        setPendingPaymentsCount(pendingPayments.length)
      }
    } catch {
      // Silently fail
    }
  }, [branchId])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Filter modules based on role - technicians can only see dashboard, kanban, calendar, equipment
  const allModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Requests', icon: FileText, restrictedForTechnician: true },
    { id: 'checklists', label: 'Kanban Board', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: DollarSign, restrictedForTechnician: true },
    { id: 'contracts', label: 'Contracts', icon: FileCheck, restrictedForTechnician: true },
    { id: 'certificates', label: 'Documents', icon: Award, restrictedForTechnician: true },
    { id: 'settings', label: 'Settings', icon: Settings, restrictedForTechnician: true },
    { id: 'equipment', label: 'Equipment', icon: Tag },
  ]

  const modules = isTechnician
    ? allModules.filter(m => !m.restrictedForTechnician)
    : allModules

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
          {modules.map((module) => (
            <TabsTrigger
              key={module.id}
              value={module.id}
              className="flex items-center gap-2 data-[state=active]:bg-background"
            >
              <module.icon className="h-4 w-4" />
              {module.label}
              {module.id === 'requests' && pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingRequestsCount}
                </Badge>
              )}
              {module.id === 'billing' && pendingPaymentsCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-500 hover:bg-amber-500">
                  {pendingPaymentsCount}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <p>Use the Contracts tab to manage work orders for this branch.</p>
            </div>
          </TabsContent>

          <TabsContent value="checklists" className="mt-0">
            <ChecklistsList branchId={branchId} userRole="CONTRACTOR" />
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <RequestsList branchId={branchId} userRole="CONTRACTOR" />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <AppointmentsList branchId={branchId} />
          </TabsContent>

          <TabsContent value="equipment" className="mt-0">
            <EquipmentList branchId={branchId} userRole="CONTRACTOR" />
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            <BillingView branchId={branchId} userRole="CONTRACTOR" />
          </TabsContent>

          <TabsContent value="contracts" className="mt-0">
            <ContractsList branchId={branchId} />
          </TabsContent>

          <TabsContent value="certificates" className="mt-0">
            <DocumentsList branchId={branchId} userRole="CONTRACTOR" />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <BranchProfileCard
                  branch={{
                    ...branch,
                    cdCertificateExpiry: branch.cdCertificateExpiry ? new Date(branch.cdCertificateExpiry).toISOString() : null,
                  }}
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

