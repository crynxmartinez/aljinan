'use client'

import { useState } from 'react'
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
  const router = useRouter()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    autoRenew: false,
  })

  const handleCreateProject = () => {
    setCreateDialogOpen(true)
  }

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || null,
          priority: newProject.priority,
          startDate: newProject.startDate || null,
          endDate: newProject.endDate || null,
          autoRenew: newProject.autoRenew,
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
        priority: 'MEDIUM',
        startDate: '',
        endDate: '',
        autoRenew: false,
      })
      router.refresh()
      // Trigger a re-fetch of projects
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project for this branch. A request will be auto-generated for client review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProject}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
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
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newProject.priority}
                    onValueChange={(value) => setNewProject({ ...newProject, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-2 gap-4">
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

