'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientProjectFilter } from '@/components/modules/client-project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ClientBranchRequests } from './client-branch-requests'
import { ClientBranchContracts } from './client-branch-contracts'
import { BillingView } from '@/components/modules/billing-view'
import { CalendarView } from '@/components/modules/calendar-view'
import { ChecklistKanban } from '@/components/modules/checklist-kanban'
import { CertificatesList } from '@/components/modules/certificates-list'
import { EquipmentList } from '@/components/modules/equipment-list'
import { ProjectsTable } from '@/components/modules/projects-table'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  Receipt,
  FileCheck,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Settings,
  Award,
  Tag,
} from 'lucide-react'
import { BranchProfileCard } from '@/components/branches/branch-profile-card'
import { Skeleton } from '@/components/ui/skeleton'

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

interface Project {
  id: string
  title: string
  status: string
  totalValue?: number
  startDate?: string
  endDate?: string
  workOrders?: Array<{
    id: string
    title: string
    price: number | null
  }>
}

export function ClientBranchWorkspace({ branchId, branch }: ClientBranchWorkspaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)
  const [openRequestsCount, setOpenRequestsCount] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Get the selected project or find pending projects
  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const pendingProjects = projects.filter(p => p.status === 'PENDING')
  const activeProjects = projects.filter(p => p.status === 'ACTIVE')
  const hasActiveProject = activeProjects.length > 0

  // Navigate to requests tab with a specific project selected
  const viewProjectProposal = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveTab('requests')
  }

  // Fetch projects directly in parent
  const fetchProjects = async (isInitialLoad = false) => {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)

        // Auto-select active project on initial load
        if (isInitialLoad && data.length > 0) {
          const activeProject = data.find((p: Project) => p.status === 'ACTIVE')
          if (activeProject) {
            setSelectedProjectId(activeProject.id)
          } else {
            // Fallback to pending project if no active
            const pendingProject = data.find((p: Project) => p.status === 'PENDING')
            if (pendingProject) {
              setSelectedProjectId(pendingProject.id)
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequestsCount = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        // Count only REQUESTED and QUOTED requests (pending action)
        const activeRequestStatuses = ['REQUESTED', 'QUOTED']
        const openCount = data.filter((r: { status: string }) =>
          activeRequestStatuses.includes(r.status)
        ).length
        setOpenRequestsCount(openCount)
      }
    } catch (err) {
      console.error('Failed to fetch requests count:', err)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchProjects(true) // Pass true for initial load to auto-select active project
    fetchRequestsCount()
  }, [branchId])

  // Refetch projects when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchProjects()
    }
  }, [refreshTrigger])

  // Callback when child components change data
  const handleDataChange = () => {
    fetchRequestsCount()
    setRefreshTrigger(prev => prev + 1) // Trigger project list refresh
  }

  // Skeleton UI while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Project Filter Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[280px]" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Projects Card Skeleton */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Branch Details Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Project Filter and Activity Toggle */}
        <div className="flex items-center justify-between mb-4">
          <ClientProjectFilter
            projects={projects}
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
          {/* Only show Kanban Board when there's an active project */}
          {hasActiveProject && (
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Kanban Board
            </TabsTrigger>
          )}
          {/* Only show these tabs when there's an active project */}
          {hasActiveProject && (
            <>
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
            </>
          )}
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
            <ProjectsTable branchId={branchId} />
          </TabsContent>

          {/* Kanban Board Tab - Read-only Kanban view for client */}
          {
            hasActiveProject && (
              <TabsContent value="checklist" className="mt-0">
                <ChecklistKanban branchId={branchId} projectId={selectedProjectId} userRole="CLIENT" />
              </TabsContent>
            )
          }

          {/* Proposals/Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            <ClientBranchRequests branchId={branchId} projectId={selectedProjectId} onDataChange={handleDataChange} />
          </TabsContent>

          {/* Calendar Tab - Only when active project */}
          {
            hasActiveProject && (
              <TabsContent value="calendar" className="mt-0">
                <CalendarView branchId={branchId} projectId={selectedProjectId} />
              </TabsContent>
            )
          }

          {/* Billing Tab - Using unified BillingView */}
          {
            hasActiveProject && (
              <TabsContent value="billing" className="mt-0">
                <BillingView branchId={branchId} projectId={selectedProjectId} userRole="CLIENT" />
              </TabsContent>
            )
          }

          {/* Contracts Tab - Only when active project */}
          {
            hasActiveProject && (
              <TabsContent value="contracts" className="mt-0">
                <ClientBranchContracts branchId={branchId} projectId={selectedProjectId} />
              </TabsContent>
            )
          }

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="mt-0">
            <EquipmentList branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="mt-0">
            <CertificatesList branchId={branchId} userRole="CLIENT" />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <BranchProfileCard
                  branch={branch}
                  activeProject={activeProjects.length > 0 ? {
                    title: activeProjects[0].title,
                    startDate: activeProjects[0].startDate || null,
                    endDate: activeProjects[0].endDate || null,
                  } : null}
                  canEdit={true}
                />
              </div>
            </div>
          </TabsContent>
        </div >
      </Tabs >

      {/* Activity Panel */}
      < ActivityPanel
        branchId={branchId}
        projectId={selectedProjectId}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)
        }
      />
    </>
  )
}
