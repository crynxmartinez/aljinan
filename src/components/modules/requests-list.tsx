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
} from 'lucide-react'

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
}

interface RequestsListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT' | 'MANAGER'
  projectId?: string | null
}

export function RequestsList({ branchId, userRole, projectId }: RequestsListProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

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
        setRequests(data)
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [branchId])

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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {userRole === 'CONTRACTOR'
                  ? 'Create your first service request for this branch.'
                  : 'Submit a service request to get started.'}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                      <Button variant="ghost" size="icon">
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
    </>
  )
}
