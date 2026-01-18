'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Send,
  MessageSquare,
} from 'lucide-react'

interface WorkOrder {
  id: string
  title: string
  description: string | null
  scheduledDate: string | null
  price: number | null
  status: string
}

interface Project {
  id: string
  title: string
  status: string
  totalValue: number
  startDate: string | null
  endDate: string | null
  workOrders: WorkOrder[]
}

interface Request {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdById: string
  createdByRole: string
  assignedTo: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  projectId?: string
  project?: Project
}

interface ClientBranchRequestsProps {
  branchId: string
  projectId?: string | null
  onDataChange?: () => void
}

export function ClientBranchRequests({ branchId, projectId, onDataChange }: ClientBranchRequestsProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState('')
  const [addWorkOrderOpen, setAddWorkOrderOpen] = useState(false)
  const [newWorkOrder, setNewWorkOrder] = useState({ name: '', description: '' })
  const [addingWorkOrder, setAddingWorkOrder] = useState(false)

  const [newRequest, setNewRequest] = useState<{
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  })
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        const filtered = projectId 
          ? data.filter((r: Request & { projectId?: string }) => r.projectId === projectId)
          : data
        setRequests(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  useEffect(() => {
    fetchRequests()
    fetchProjects()
  }, [branchId, projectId])

  // Handle project approval
  const handleApproveProject = async (projectId: string) => {
    setApproving(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve project')
      }
      setSelectedProject(null)
      setSelectedRequest(null)
      fetchRequests()
      fetchProjects()
      onDataChange?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setApproving(false)
    }
  }

  // Handle adding a work order (client can add without price)
  const handleAddWorkOrder = async () => {
    if (!selectedProject || !newWorkOrder.name.trim()) return
    setAddingWorkOrder(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkOrder.name,
          description: newWorkOrder.description || null,
          price: null, // Client cannot set price
          type: 'ADHOC',
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add work order')
      }
      setNewWorkOrder({ name: '', description: '' })
      setAddWorkOrderOpen(false)
      fetchProjects()
      // Refresh selected project
      const updatedProjects = await fetch(`/api/branches/${branchId}/projects`).then(r => r.json())
      const updated = updatedProjects.find((p: Project) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAddingWorkOrder(false)
    }
  }

  // Get project for a request
  const getProjectForRequest = (request: Request): Project | undefined => {
    if (request.projectId) {
      return projects.find(p => p.id === request.projectId)
    }
    return undefined
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create request')
      }

      setCreateDialogOpen(false)
      setNewRequest({ title: '', description: '', priority: 'MEDIUM' })
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const getPriorityBadge = (priority: Request['priority']) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700',
    }
    return <Badge className={styles[priority]}>{priority}</Badge>
  }

  const getStatusBadge = (status: Request['status']) => {
    const config = {
      OPEN: { style: 'bg-yellow-100 text-yellow-700', icon: Clock },
      IN_PROGRESS: { style: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      COMPLETED: { style: 'bg-green-100 text-green-700', icon: CheckCircle },
      CANCELLED: { style: 'bg-gray-100 text-gray-700', icon: XCircle },
    }
    const { style, icon: Icon } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Requests</CardTitle>
            <CardDescription>
              View and submit service requests for this branch
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Submit a service request to your contractor. They will review and respond to your request.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    const project = getProjectForRequest(request)
                    if (project && request.createdByRole === 'CONTRACTOR') {
                      setSelectedProject(project)
                    }
                    setSelectedRequest(request)
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{request.title}</h4>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                      {request.createdByRole === 'CLIENT' && (
                        <Badge variant="outline" className="text-xs">Submitted by you</Badge>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(request.createdAt).toLocaleDateString()}
                      {request.dueDate && (
                        <> · Due {new Date(request.dueDate).toLocaleDateString()}</>
                      )}
                      {request.completedAt && (
                        <> · Completed {new Date(request.completedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Service Request</DialogTitle>
            <DialogDescription>
              Submit a new service request to your contractor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">What do you need? *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Brief description of the service needed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Details</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Provide more details about your request"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setNewRequest({ ...newRequest, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - Not urgent</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Normal priority</SelectItem>
                    <SelectItem value="HIGH">High - Needs attention soon</SelectItem>
                    <SelectItem value="URGENT">Urgent - Immediate attention needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog - Simple requests */}
      <Dialog open={!!selectedRequest && !selectedProject} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              {selectedRequest?.createdByRole === 'CLIENT' ? 'Your service request' : 'Request from contractor'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(selectedRequest.priority)}
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              {selectedRequest.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedRequest.dueDate && (
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Proposal Dialog - With work orders */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => { if (!open) { setSelectedProject(null); setSelectedRequest(null); } }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Project proposal from your contractor - Review the work orders and pricing below
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {selectedProject && (() => {
            // Calculate total from work orders directly
            const calculatedTotal = selectedProject.workOrders?.reduce((sum, wo) => sum + (wo.price || 0), 0) || 0
            return (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={selectedProject.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                    {selectedProject.status === 'PENDING' ? 'Pending Review' : selectedProject.status}
                  </Badge>
                </div>
                {selectedProject.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium text-sm">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedProject.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium text-sm">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-bold text-lg text-primary">
                    ${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Work Orders Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Work Orders</h3>
                  {selectedProject.status === 'PENDING' && (
                    <Button variant="outline" size="sm" onClick={() => setAddWorkOrderOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Request Additional Work
                    </Button>
                  )}
                </div>
                
                {selectedProject.workOrders && selectedProject.workOrders.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Work Order</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Scheduled Date</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProject.workOrders.map((wo, index) => (
                          <TableRow key={wo.id || index}>
                            <TableCell className="font-medium">{wo.title}</TableCell>
                            <TableCell className="text-muted-foreground">{wo.description || '-'}</TableCell>
                            <TableCell>
                              {wo.scheduledDate ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(wo.scheduledDate).toLocaleDateString()}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {wo.price !== null ? (
                                <span className="font-medium">${wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              ) : (
                                <Badge variant="outline" className="text-xs">Pending Price</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Total Row */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        ${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No work orders defined yet
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Projects */}
              {selectedProject.status === 'PENDING' && (() => {
                const hasPendingPrices = selectedProject.workOrders?.some(wo => wo.price === null) || false
                return (
                  <div className="space-y-4 pt-4 border-t">
                    {hasPendingPrices ? (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <strong>Waiting for pricing.</strong> Some work orders are pending price from your contractor. 
                          You cannot accept the project until all work orders have been priced.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Ready to proceed?</strong> By accepting this project, a contract will be created and work can begin. 
                          You can also request additional work orders above - your contractor will add pricing for any new items.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => { setSelectedProject(null); setSelectedRequest(null); }}>
                        Review Later
                      </Button>
                      <Button 
                        onClick={() => handleApproveProject(selectedProject.id)}
                        disabled={approving || hasPendingPrices}
                        className={hasPendingPrices ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
                      >
                        {approving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Project
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })()}

              {/* Info for Active Projects */}
              {selectedProject.status === 'ACTIVE' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Project is active.</strong> Work is in progress. Check the Appointments tab for scheduled visits.
                  </p>
                </div>
              )}
            </div>
          )})()}
        </DialogContent>
      </Dialog>

      {/* Add Work Order Dialog */}
      <Dialog open={addWorkOrderOpen} onOpenChange={setAddWorkOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Work</DialogTitle>
            <DialogDescription>
              Add a work order request. Your contractor will review and add pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wo-name">Work Order Name *</Label>
              <Input
                id="wo-name"
                value={newWorkOrder.name}
                onChange={(e) => setNewWorkOrder({ ...newWorkOrder, name: e.target.value })}
                placeholder="e.g., Additional pest inspection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo-desc">Description</Label>
              <Textarea
                id="wo-desc"
                value={newWorkOrder.description}
                onChange={(e) => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })}
                placeholder="Describe what you need..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWorkOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorkOrder} disabled={addingWorkOrder || !newWorkOrder.name.trim()}>
              {addingWorkOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
