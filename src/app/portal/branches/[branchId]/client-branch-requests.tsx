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
  FileText,
  Plus,
  Loader2,
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

interface ClientBranchRequestsProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchRequests({ branchId, projectId }: ClientBranchRequestsProps) {
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
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  })
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

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

  useEffect(() => {
    fetchRequests()
  }, [branchId, projectId])

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
                  onClick={() => setSelectedRequest(request)}
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

      {/* View Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.createdByRole === 'CONTRACTOR' ? 'Project proposal from contractor' : 'Your service request'}
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

              {selectedRequest.status === 'OPEN' && selectedRequest.createdByRole === 'CONTRACTOR' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    This is a project proposal from your contractor. Review the details above and contact them if you have questions or want to make changes.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
