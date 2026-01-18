'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientProjectFilter } from '@/components/modules/client-project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ClientBranchRequests } from './client-branch-requests'
import { ClientBranchInvoices } from './client-branch-invoices'
import { ClientBranchContracts } from './client-branch-contracts'
import { ClientBranchQuotations } from './client-branch-quotations'
import { CalendarView } from '@/components/modules/calendar-view'
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

  const fetchRequestsCount = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        const openCount = data.filter((r: { status: string }) => r.status === 'OPEN').length
        setOpenRequestsCount(openCount)
      }
    } catch (err) {
      console.error('Failed to fetch requests count:', err)
    }
  }

  useEffect(() => {
    fetchRequestsCount()
  }, [branchId])

  // Callback when child components change data
  const handleDataChange = () => {
    fetchRequestsCount()
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Project Filter and Activity Toggle */}
        <div className="flex items-center justify-between mb-4">
          <ClientProjectFilter
            branchId={branchId}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
            onProjectsLoaded={setProjects}
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
          {/* Only show these tabs when there's an active project */}
          {hasActiveProject && (
            <>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="quotations" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Quotations
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Contracts
              </TabsTrigger>
            </>
          )}
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
                            {project.workOrders?.length || 0} work orders · 
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

          {/* Quotations Tab - Only when active project */}
          {hasActiveProject && (
            <TabsContent value="quotations" className="mt-0">
              <ClientBranchQuotations branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}

          {/* Invoices Tab - Only when active project */}
          {hasActiveProject && (
            <TabsContent value="invoices" className="mt-0">
              <ClientBranchInvoices branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}

          {/* Contracts Tab - Only when active project */}
          {hasActiveProject && (
            <TabsContent value="contracts" className="mt-0">
              <ClientBranchContracts branchId={branchId} projectId={selectedProjectId} />
            </TabsContent>
          )}
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
