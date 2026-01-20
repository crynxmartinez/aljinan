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
          {/* Only show Checklist when there's an active project */}
          {hasActiveProject && (
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist
            </TabsTrigger>
          )}
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
            {openRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {openRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
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
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="space-y-6">
              {/* Pending Proposals Alert */}
              {pendingProjects.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-amber-800">
                        {pendingProjects.length === 1 ? 'Project Proposal Awaiting Review' : `${pendingProjects.length} Project Proposals Awaiting Review`}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-amber-700">
                      Your contractor has submitted project proposals for your review.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer"
                        onClick={() => viewProjectProposal(project.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">{project.title}</span>
                            <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: ${(project.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          Review Proposal
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Active Projects */}
              {activeProjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle>Active Projects</CardTitle>
                    </div>
                    <CardDescription>Projects currently in progress</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedProjectId(project.id)
                          setActiveTab('calendar')
                        }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{project.title}</span>
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {project.startDate && `Started: ${new Date(project.startDate).toLocaleDateString()}`}
                            {project.endDate && ` · Ends: ${new Date(project.endDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Branch Details and Activity */}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for this branch</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('requests')}
                    >
                      <FileText className="h-4 w-4" />
                      View Requests & Proposals
                      {openRequestsCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">{openRequestsCount}</Badge>
                      )}
                    </Button>
                    {hasActiveProject && (
                      <>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2"
                          onClick={() => setActiveTab('calendar')}
                        >
                          <Calendar className="h-4 w-4" />
                          View Calendar
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2"
                          onClick={() => setActiveTab('invoices')}
                        >
                          <DollarSign className="h-4 w-4" />
                          View Invoices
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* No Projects State */}
              {projects.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground max-w-md">
                      Your contractor will create a project proposal for this branch. 
                      You&apos;ll be able to review and approve it here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Checklist Tab - Read-only Kanban view for client */}
          {hasActiveProject && (
            <TabsContent value="checklist" className="mt-0">
              <ChecklistKanban branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}

          {/* Proposals/Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            <ClientBranchRequests branchId={branchId} projectId={selectedProjectId} onDataChange={handleDataChange} />
          </TabsContent>

          {/* Calendar Tab - Only when active project */}
          {hasActiveProject && (
            <TabsContent value="calendar" className="mt-0">
              <CalendarView branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}

          {/* Billing Tab - Using unified BillingView */}
          {hasActiveProject && (
            <TabsContent value="billing" className="mt-0">
              <BillingView branchId={branchId} projectId={selectedProjectId} userRole="CLIENT" />
            </TabsContent>
          )}

          {/* Contracts Tab - Only when active project */}
          {hasActiveProject && (
            <TabsContent value="contracts" className="mt-0">
              <ClientBranchContracts branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}

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
