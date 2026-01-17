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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Plus,
  Loader2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Pencil,
  Save,
} from 'lucide-react'

interface WorkOrder {
  id: string
  title: string
  description: string | null
  scheduledDate: string | null
  price: number | null
  stage: string
  type: string
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
}

interface RequestsListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT' | 'MANAGER'
  projectId?: string | null
}

export function RequestsList({ branchId, userRole, projectId }: RequestsListProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Work order editing state
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null)
  const [editWorkOrder, setEditWorkOrder] = useState<{
    price: string
    scheduledDate: string
  }>({ price: '', scheduledDate: '' })

  const [newRequest, setNewRequest] = useState<{
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    dueDate: string
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  })

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

  // Get project for a request
  const getProjectForRequest = (request: Request): Project | undefined => {
    if (request.projectId) {
      return projects.find(p => p.id === request.projectId)
    }
    return undefined
  }

  // Start editing a work order
  const startEditWorkOrder = (wo: WorkOrder) => {
    setEditingWorkOrderId(wo.id)
    setEditWorkOrder({
      price: wo.price?.toString() || '',
      scheduledDate: wo.scheduledDate ? wo.scheduledDate.split('T')[0] : '',
    })
  }

  // Save work order changes
  const handleSaveWorkOrder = async (workOrderId: string) => {
    if (!selectedProject) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: editWorkOrder.price ? parseFloat(editWorkOrder.price) : null,
          scheduledDate: editWorkOrder.scheduledDate || null,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update work order')
      }
      setEditingWorkOrderId(null)
      // Refresh projects and update selected project
      await fetchProjects()
      const updatedProjects = await fetch(`/api/branches/${branchId}/projects`).then(r => r.json())
      const updated = updatedProjects.find((p: Project) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
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
      setNewRequest({ title: '', description: '', priority: 'MEDIUM', dueDate: '' })
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (requestId: string, status: Request['status']) => {
    try {
      await fetch(`/api/branches/${branchId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchRequests()
      router.refresh()
    } catch (err) {
      console.error('Failed to update request:', err)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      await fetch(`/api/branches/${branchId}/requests/${requestId}`, {
        method: 'DELETE',
      })
      fetchRequests()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete request:', err)
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
              {userRole === 'CONTRACTOR' 
                ? 'Manage work orders and service requests for this branch'
                : 'View and submit service requests for this branch'}
            </CardDescription>
          </div>
          {userRole !== 'CONTRACTOR' && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {userRole === 'CONTRACTOR'
                  ? 'No service requests from the client yet.'
                  : 'Submit a service request to get started.'}
              </p>
              {userRole !== 'CONTRACTOR' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const project = getProjectForRequest(request)
                    if (project && request.createdByRole === 'CONTRACTOR') {
                      setSelectedProject(project)
                      setProjectDialogOpen(true)
                    } else {
                      setSelectedRequest(request)
                      setDetailDialogOpen(true)
                    }
                  }}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{request.title}</h4>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
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
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {request.status === 'OPEN' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'IN_PROGRESS')}>
                          Mark In Progress
                        </DropdownMenuItem>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}>
                          Mark Completed
                        </DropdownMenuItem>
                      )}
                      {request.status !== 'CANCELLED' && request.status !== 'COMPLETED' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'CANCELLED')}>
                          Cancel Request
                        </DropdownMenuItem>
                      )}
                      {userRole === 'CONTRACTOR' && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            <DialogTitle>New Service Request</DialogTitle>
            <DialogDescription>
              Create a new service request for this branch.
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Brief description of the request"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Detailed description of the work needed"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value) => setNewRequest({ ...newRequest, priority: value as Request['priority'] })}
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newRequest.dueDate}
                    onChange={(e) => setNewRequest({ ...newRequest, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              Request Details
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedRequest.priority)}
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              {selectedRequest.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedRequest.dueDate && (
                  <div>
                    <p className="font-medium text-muted-foreground">Due Date</p>
                    <p>{new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-muted-foreground">Created By</p>
                  <p className="capitalize">{selectedRequest.createdByRole.toLowerCase()}</p>
                </div>
                {selectedRequest.completedAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">Completed</p>
                    <p>{new Date(selectedRequest.completedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {userRole === 'CONTRACTOR' && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedRequest.status === 'OPEN' && (
                    <Button 
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'IN_PROGRESS')
                        setDetailDialogOpen(false)
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Start Work
                    </Button>
                  )}
                  {selectedRequest.status === 'IN_PROGRESS' && (
                    <Button 
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'COMPLETED')
                        setDetailDialogOpen(false)
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                  {selectedRequest.status !== 'CANCELLED' && selectedRequest.status !== 'COMPLETED' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.id, 'CANCELLED')
                        setDetailDialogOpen(false)
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Project Proposal Dialog - For contractors to view/edit work orders */}
      <Dialog open={projectDialogOpen} onOpenChange={(open) => { if (!open) { setProjectDialogOpen(false); setSelectedProject(null); setEditingWorkOrderId(null); } }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Project proposal - Review and manage work orders
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {selectedProject && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={selectedProject.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                    {selectedProject.status === 'PENDING' ? 'Pending Client Approval' : selectedProject.status}
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
                    ${selectedProject.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Work Orders Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Work Orders</h3>
                  {selectedProject.workOrders?.some(wo => wo.price === null) && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Some items need pricing
                    </Badge>
                  )}
                </div>
                
                {selectedProject.workOrders && selectedProject.workOrders.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Work Order</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Scheduled Date</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProject.workOrders.map((wo) => (
                          <TableRow key={wo.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{wo.title}</p>
                                {wo.description && (
                                  <p className="text-xs text-muted-foreground">{wo.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={wo.type === 'ADHOC' ? 'text-purple-600' : ''}>
                                {wo.type === 'ADHOC' ? 'Client Added' : 'Scheduled'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {editingWorkOrderId === wo.id ? (
                                <Input
                                  type="date"
                                  value={editWorkOrder.scheduledDate}
                                  onChange={(e) => setEditWorkOrder({ ...editWorkOrder, scheduledDate: e.target.value })}
                                  className="w-[140px]"
                                />
                              ) : wo.scheduledDate ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(wo.scheduledDate).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingWorkOrderId === wo.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editWorkOrder.price}
                                  onChange={(e) => setEditWorkOrder({ ...editWorkOrder, price: e.target.value })}
                                  placeholder="0.00"
                                  className="w-[100px] text-right"
                                />
                              ) : wo.price !== null ? (
                                <span className="font-medium">${wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  Needs Price
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingWorkOrderId === wo.id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveWorkOrder(wo.id)}
                                    disabled={saving}
                                  >
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingWorkOrderId(null)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditWorkOrder(wo)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
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
                        ${selectedProject.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No work orders defined yet
                  </div>
                )}
              </div>

              {/* Status Info */}
              {selectedProject.status === 'PENDING' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Waiting for client approval.</strong> Make sure all work orders have prices set. 
                    The client cannot accept the project until all items are priced.
                  </p>
                </div>
              )}

              {selectedProject.status === 'ACTIVE' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Project is active.</strong> Work is in progress. Manage work orders in the Checklist tab.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setProjectDialogOpen(false); setSelectedProject(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
