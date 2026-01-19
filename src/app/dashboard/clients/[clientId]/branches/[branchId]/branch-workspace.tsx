'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestsList } from '@/components/modules/requests-list'
import { AppointmentsList } from '@/components/modules/appointments-list'
import { BillingView } from '@/components/modules/billing-view'
import { ContractsList } from '@/components/modules/contracts-list'
import { ChecklistsList } from '@/components/modules/checklists-list'
import { ProjectFilter } from '@/components/modules/project-filter'
import { ActivityPanel } from '@/components/modules/activity-panel'
import { ProjectsTable } from '@/components/modules/projects-table'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  FileCheck,
  ClipboardList,
  MessageSquare,
  Plus,
  Trash2,
  Settings,
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

export function BranchWorkspace({ clientId, branchId, branch, userRole, teamMemberRole }: BranchWorkspaceProps) {
  const isTechnician = userRole === 'TEAM_MEMBER' && teamMemberRole === 'TECHNICIAN'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)

  // Fetch count of pending client requests (ADHOC work orders with REQUESTED stage)
  // and pending payment verifications
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch(`/api/branches/${branchId}/checklist-items`)
        if (response.ok) {
          const data = await response.json()
          // Count pending requests
          const pendingRequests = data.filter((item: { stage: string }) => item.stage === 'REQUESTED')
          setPendingRequestsCount(pendingRequests.length)
          // Count pending payment verifications
          const pendingPayments = data.filter((item: { paymentStatus: string }) => item.paymentStatus === 'PENDING_VERIFICATION')
          setPendingPaymentsCount(pendingPayments.length)
        }
      } catch (err) {
        console.error('Failed to fetch counts:', err)
      }
    }
    fetchCounts()
  }, [branchId])

  // Filter modules based on role - technicians can't see billing/contracts/settings
  const allModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checklists', label: 'Checklist', icon: ClipboardList },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: DollarSign, restrictedForTechnician: true },
    { id: 'contracts', label: 'Contracts', icon: FileCheck, restrictedForTechnician: true },
    { id: 'settings', label: 'Settings', icon: Settings, restrictedForTechnician: true },
  ]
  
  const modules = isTechnician 
    ? allModules.filter(m => !m.restrictedForTechnician)
    : allModules

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

        <TabsContent value="billing" className="mt-0">
          <BillingTab branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-0">
          <ContractsList branchId={branchId} projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="max-w-2xl">
            <BranchProfileCard 
              branch={{
                ...branch,
                cdCertificateExpiry: branch.cdCertificateExpiry ? new Date(branch.cdCertificateExpiry).toISOString() : null,
              }} 
              canEdit={true} 
            />
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

// Billing Tab - Using unified BillingView component
function BillingTab({ branchId, projectId }: { branchId: string; projectId: string | null }) {
  return (
    <BillingView branchId={branchId} projectId={projectId} userRole="CONTRACTOR" />
  )
}

interface WorkOrder {
  id: string
  name: string
  description: string
  scheduledDate: string
  price: string
  recurringType: 'ONCE' | 'MONTHLY' | 'QUARTERLY'
}

function BranchDashboard({ branch, branchId }: { branch: Branch; branchId: string }) {
  const router = useRouter()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    autoRenew: false,
  })
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    { id: crypto.randomUUID(), name: '', description: '', scheduledDate: '', price: '', recurringType: 'ONCE' }
  ])

  const handleCreateProject = () => {
    setCreateDialogOpen(true)
  }

  const addWorkOrder = () => {
    setWorkOrders([
      ...workOrders,
      { id: crypto.randomUUID(), name: '', description: '', scheduledDate: '', price: '', recurringType: 'ONCE' }
    ])
  }

  const removeWorkOrder = (id: string) => {
    if (workOrders.length > 1) {
      setWorkOrders(workOrders.filter(wo => wo.id !== id))
    }
  }

  const updateWorkOrder = (id: string, field: keyof WorkOrder, value: string) => {
    setWorkOrders(workOrders.map(wo => 
      wo.id === id ? { ...wo, [field]: value } : wo
    ))
  }

  const calculateTotal = () => {
    return workOrders.reduce((sum, wo) => {
      const price = parseFloat(wo.price) || 0
      return sum + price
    }, 0)
  }

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate at least one work order has a name
    const validWorkOrders = workOrders.filter(wo => wo.name.trim())
    if (validWorkOrders.length === 0) {
      setError('Please add at least one work order with a name')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/branches/${branchId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || null,
          startDate: newProject.startDate || null,
          endDate: newProject.endDate || null,
          autoRenew: newProject.autoRenew,
          workOrders: validWorkOrders.map(wo => ({
            name: wo.name,
            description: wo.description || null,
            scheduledDate: wo.scheduledDate || null,
            price: wo.price ? parseFloat(wo.price) : null,
            recurringType: wo.recurringType,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      setCreateDialogOpen(false)
      setNewProject({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        autoRenew: false,
      })
      setWorkOrders([
        { id: crypto.randomUUID(), name: '', description: '', scheduledDate: '', price: '', recurringType: 'ONCE' }
      ])
      router.refresh()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ProjectsTable branchId={branchId} onCreateProject={handleCreateProject} />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project with work orders. A request will be sent to the client for review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProject}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {/* Project Details */}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g., Annual Maintenance Contract 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project scope..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autoRenew">Auto-Renew</Label>
                  <Select
                    value={newProject.autoRenew ? 'yes' : 'no'}
                    onValueChange={(value) => setNewProject({ ...newProject, autoRenew: value === 'yes' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Work Orders Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Work Orders *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addWorkOrder}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Work Order
                  </Button>
                </div>
                <div className="space-y-3">
                  {workOrders.map((wo, index) => (
                    <div key={wo.id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        {workOrders.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeWorkOrder(wo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                          placeholder="Work order name *"
                          value={wo.name}
                          onChange={(e) => updateWorkOrder(wo.id, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Description"
                          value={wo.description}
                          onChange={(e) => updateWorkOrder(wo.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="date"
                          placeholder="Scheduled date"
                          value={wo.scheduledDate}
                          onChange={(e) => updateWorkOrder(wo.id, 'scheduledDate', e.target.value)}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={wo.price}
                          onChange={(e) => updateWorkOrder(wo.id, 'price', e.target.value)}
                        />
                        <Select
                          value={wo.recurringType}
                          onValueChange={(value) => updateWorkOrder(wo.id, 'recurringType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONCE">Once</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 p-3 bg-primary/5 rounded-lg border">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

