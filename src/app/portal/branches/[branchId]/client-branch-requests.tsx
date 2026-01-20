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
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Upload,
  X,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
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

interface RequestPhoto {
  id: string
  url: string
  caption: string | null
}

interface Request {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'REQUESTED' | 'QUOTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CLOSED' | 'REJECTED' | 'CANCELLED'
  createdById: string
  createdByRole: string
  assignedTo: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  projectId?: string
  project?: Project
  // New fields
  issueType?: string | null
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | null
  preferredDate?: string | null
  preferredTimeSlot?: string | null
  quotedPrice?: number | null
  quotedDate?: string | null
  quotedBy?: string | null
  clientAccepted?: boolean | null
  clientAcceptedAt?: string | null
  clientRejectedAt?: string | null
  clientRejectionReason?: string | null
  photos?: RequestPhoto[]
}

interface ClientBranchRequestsProps {
  branchId: string
  projectId?: string | null
  onDataChange?: () => void
}

// Helper function to extract base name from work order title (removes Q1, Q2, Month1, etc.)
function getBaseWorkOrderName(title: string): string {
  // Remove patterns like (Q1), (Q2), (Month1), (Month2), etc.
  return title.replace(/\s*\((Q\d+|Month\d+)\)\s*$/i, '').trim()
}

// Group work orders by their base name
function groupWorkOrders(workOrders: WorkOrder[]): Map<string, WorkOrder[]> {
  const groups = new Map<string, WorkOrder[]>()
  
  for (const wo of workOrders) {
    const baseName = getBaseWorkOrderName(wo.title)
    if (!groups.has(baseName)) {
      groups.set(baseName, [])
    }
    groups.get(baseName)!.push(wo)
  }
  
  return groups
}

// Collapsible Work Orders Grouped View Component
function WorkOrdersGroupedView({ workOrders }: { workOrders: WorkOrder[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const groups = groupWorkOrders(workOrders)
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }
  
  return (
    <div className="divide-y">
      {Array.from(groups.entries()).map(([groupName, items]) => {
        const isExpanded = expandedGroups.has(groupName)
        const groupTotal = items.reduce((sum, wo) => sum + (wo.price || 0), 0)
        const hasPendingPrice = items.some(wo => wo.price === null)
        const isSingleItem = items.length === 1
        
        return (
          <div key={groupName} className="bg-white">
            {/* Group Header */}
            <button
              onClick={() => !isSingleItem && toggleGroup(groupName)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${isSingleItem ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {!isSingleItem && (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  )}
                  <span className="font-medium">{groupName}</span>
                  {!isSingleItem && (
                    <Badge variant="secondary" className="text-xs">
                      {items.length} occurrences
                    </Badge>
                  )}
                </div>
                {items[0].description && (
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    {items[0].description}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {hasPendingPrice ? (
                  <Badge variant="outline" className="text-xs">Pending Price</Badge>
                ) : (
                  <span className="font-semibold text-primary">
                    ${groupTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </button>
            
            {/* Single Item Details (inline) */}
            {isSingleItem && (
              <div className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground ml-6">
                  <CornerDownRight className="h-4 w-4 flex-shrink-0" />
                  {items[0].scheduledDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(items[0].scheduledDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <span>No date scheduled</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Expanded Items */}
            {!isSingleItem && isExpanded && (
              <div className="bg-muted/30 border-t">
                {items.map((wo, idx) => (
                  <div key={wo.id || idx} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3 text-sm">
                      <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      <div>
                        <span className="text-muted-foreground">
                          {wo.title.match(/\((Q\d+|Month\d+)\)/i)?.[1] || `#${idx + 1}`}:
                        </span>
                        {wo.scheduledDate && (
                          <span className="ml-2 flex items-center gap-1 inline-flex">
                            <Calendar className="h-3 w-3" />
                            {new Date(wo.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {wo.price !== null ? (
                        <span className="font-medium">${wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
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
  const [newWorkOrder, setNewWorkOrder] = useState({ name: '', description: '', recurringType: 'ONCE' as 'ONCE' | 'MONTHLY' | 'QUARTERLY' })
  const [addingWorkOrder, setAddingWorkOrder] = useState(false)

  const [newRequest, setNewRequest] = useState<{
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    issueType: string
    workOrderType: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION'
    preferredDate: string
    preferredTimeSlot: string
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    issueType: '',
    workOrderType: 'SERVICE',
    preferredDate: '',
    preferredTimeSlot: '',
  })
  const [uploadedPhotos, setUploadedPhotos] = useState<{ url: string; name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // Quote response state
  const [quoteResponseDialogOpen, setQuoteResponseDialogOpen] = useState(false)
  const [quoteResponseRequest, setQuoteResponseRequest] = useState<Request | null>(null)
  const [respondingToQuote, setRespondingToQuote] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        // Filter out COMPLETED requests - they should appear in Quotations/Contracts instead
        let filtered = data.filter((r: Request) => r.status !== 'COMPLETED')
        // Note: Don't filter by projectId - show all requests for this branch
        // Requests without a projectId are standalone service requests
        setRequests(filtered)
        setError('')
      } else {
        const errorData = await response.json()
        setError(`Failed to load requests: ${errorData.error || response.statusText}`)
      }
    } catch (err) {
      setError('Failed to fetch requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        // Only show PENDING projects in Requests tab (for approval)
        // ACTIVE projects should be viewed in Calendar/Quotations/Contracts
        const pendingProjects = data.filter((p: Project) => p.status === 'PENDING')
        setProjects(pendingProjects)
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
          recurringType: newWorkOrder.recurringType,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add work order')
      }
      setNewWorkOrder({ name: '', description: '', recurringType: 'ONCE' })
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'photo')
        formData.append('folder', 'request-photos')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setUploadedPhotos(prev => [...prev, { url: data.url, name: file.name }])
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (url: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.url !== url))
  }

  // Open quote response dialog
  const openQuoteResponseDialog = (request: Request) => {
    setQuoteResponseRequest(request)
    setQuoteResponseDialogOpen(true)
    setShowRejectionForm(false)
    setRejectionReason('')
  }

  // Accept quote
  const handleAcceptQuote = async () => {
    if (!quoteResponseRequest) return
    setRespondingToQuote(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${quoteResponseRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept quote')
      }

      setQuoteResponseDialogOpen(false)
      setQuoteResponseRequest(null)
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setRespondingToQuote(false)
    }
  }

  // Reject quote
  const handleRejectQuote = async () => {
    if (!quoteResponseRequest) return
    setRespondingToQuote(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${quoteResponseRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason: rejectionReason || 'No reason provided'
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject quote')
      }

      setQuoteResponseDialogOpen(false)
      setQuoteResponseRequest(null)
      setRejectionReason('')
      setShowRejectionForm(false)
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setRespondingToQuote(false)
    }
  }

  // Format issue type for display
  const formatIssueType = (issueType: string | null | undefined): string => {
    if (!issueType) return 'General'
    return issueType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  // Format work order type for display
  const formatWorkOrderType = (type: string | null | undefined): string => {
    if (!type) return 'Service'
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          photoUrls: uploadedPhotos.map(p => p.url),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create request')
      }

      setCreateDialogOpen(false)
      setNewRequest({ title: '', description: '', priority: 'MEDIUM', issueType: '', workOrderType: 'SERVICE', preferredDate: '', preferredTimeSlot: '' })
      setUploadedPhotos([])
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
    const config: Record<Request['status'], { style: string; icon: typeof Clock }> = {
      REQUESTED: { style: 'bg-yellow-100 text-yellow-700', icon: Clock },
      QUOTED: { style: 'bg-purple-100 text-purple-700', icon: Clock },
      SCHEDULED: { style: 'bg-blue-100 text-blue-700', icon: Clock },
      IN_PROGRESS: { style: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      FOR_REVIEW: { style: 'bg-orange-100 text-orange-700', icon: AlertCircle },
      PENDING_APPROVAL: { style: 'bg-amber-100 text-amber-700', icon: Clock },
      COMPLETED: { style: 'bg-green-100 text-green-700', icon: CheckCircle },
      CLOSED: { style: 'bg-gray-100 text-gray-700', icon: CheckCircle },
      REJECTED: { style: 'bg-red-100 text-red-700', icon: XCircle },
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
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
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
                  className={`p-4 border rounded-lg transition-colors ${request.status === 'QUOTED' ? 'border-purple-300 bg-purple-50/50' : 'hover:bg-muted/50'}`}
                >
                  <div 
                    className="space-y-2 cursor-pointer"
                    onClick={() => {
                      const project = getProjectForRequest(request)
                      if (project && request.createdByRole === 'CONTRACTOR') {
                        setSelectedProject(project)
                      }
                      setSelectedRequest(request)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{request.title}</h4>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                      {request.createdByRole === 'CLIENT' && (
                        <Badge variant="outline" className="text-xs">Submitted by you</Badge>
                      )}
                      {request.issueType && (
                        <Badge variant="secondary" className="text-xs">{formatIssueType(request.issueType)}</Badge>
                      )}
                    </div>
                    {request.description && !request.title.startsWith('Project Proposal:') && (
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
                  
                  {/* Show quote info and action buttons for QUOTED requests */}
                  {request.status === 'QUOTED' && request.quotedPrice && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-purple-700">
                              SAR {request.quotedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {request.quotedDate && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(request.quotedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); openQuoteResponseDialog(request); }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Review Quote
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              {/* Issue Type */}
              <div className="space-y-2">
                <Label htmlFor="issueType">Type of Issue *</Label>
                <Select
                  value={newRequest.issueType}
                  onValueChange={(value) => setNewRequest({ ...newRequest, issueType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of issue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRE_ALARM_MALFUNCTION">🔥 Fire Alarm Malfunction</SelectItem>
                    <SelectItem value="SMOKE_DETECTOR_ISSUE">💨 Smoke Detector Issue</SelectItem>
                    <SelectItem value="SPRINKLER_LEAK">💧 Sprinkler Leak</SelectItem>
                    <SelectItem value="EXTINGUISHER_EXPIRED">🧯 Fire Extinguisher Expired</SelectItem>
                    <SelectItem value="EMERGENCY_LIGHT_OUT">💡 Emergency Light Out</SelectItem>
                    <SelectItem value="EXIT_SIGN_ISSUE">🚪 Exit Sign Issue</SelectItem>
                    <SelectItem value="FIRE_DOOR_PROBLEM">🚧 Fire Door Problem</SelectItem>
                    <SelectItem value="PANEL_ERROR">⚠️ Fire Panel Error</SelectItem>
                    <SelectItem value="SCHEDULED_INSPECTION">📋 Scheduled Inspection</SelectItem>
                    <SelectItem value="CERTIFICATION_RENEWAL">📜 Certification Renewal</SelectItem>
                    <SelectItem value="NEW_INSTALLATION">🔧 New Installation</SelectItem>
                    <SelectItem value="SYSTEM_UPGRADE">⬆️ System Upgrade</SelectItem>
                    <SelectItem value="PREVENTIVE_MAINTENANCE">🛠️ Preventive Maintenance</SelectItem>
                    <SelectItem value="OTHER">📝 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Brief Description *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="e.g., Fire alarm beeping in 3rd floor office"
                  required
                />
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Provide more details: location, when it started, any error codes, etc."
                  rows={3}
                />
              </div>

              {/* Work Order Type & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workOrderType">Service Type</Label>
                  <Select
                    value={newRequest.workOrderType}
                    onValueChange={(value: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION') => setNewRequest({ ...newRequest, workOrderType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">🔧 Repair/Service</SelectItem>
                      <SelectItem value="INSPECTION">🔍 Inspection</SelectItem>
                      <SelectItem value="MAINTENANCE">🛠️ Maintenance</SelectItem>
                      <SelectItem value="INSTALLATION">📦 Installation</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">🚨 Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preferred Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={newRequest.preferredDate}
                    onChange={(e) => setNewRequest({ ...newRequest, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTimeSlot">Preferred Time</Label>
                  <Select
                    value={newRequest.preferredTimeSlot}
                    onValueChange={(value) => setNewRequest({ ...newRequest, preferredTimeSlot: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">Morning (8AM-12PM)</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon (12PM-5PM)</SelectItem>
                      <SelectItem value="EVENING">Evening (5PM-8PM)</SelectItem>
                      <SelectItem value="ANYTIME">Any time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photos (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload photos of the issue to help the technician understand the problem
                </p>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload photos</span>
                      </>
                    )}
                  </label>
                </div>
                {uploadedPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="h-16 w-16 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.url)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || uploading}>
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

              {/* Work Orders - Grouped Collapsible View */}
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
                    <WorkOrdersGroupedView workOrders={selectedProject.workOrders} />
                    
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
            <div className="space-y-2">
              <Label htmlFor="wo-recurring">Recurring</Label>
              <Select
                value={newWorkOrder.recurringType}
                onValueChange={(value) => setNewWorkOrder({ ...newWorkOrder, recurringType: value as 'ONCE' | 'MONTHLY' | 'QUARTERLY' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">One-time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Quote Response Dialog - For clients to accept or reject quotes */}
      <Dialog open={quoteResponseDialogOpen} onOpenChange={(open) => { if (!open) { setQuoteResponseDialogOpen(false); setQuoteResponseRequest(null); setShowRejectionForm(false); setRejectionReason(''); setError(''); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Quote</DialogTitle>
            <DialogDescription>
              Your contractor has provided a quote for your request
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {quoteResponseRequest && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">{quoteResponseRequest.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(quoteResponseRequest.priority)}
                  {quoteResponseRequest.issueType && (
                    <Badge variant="outline">{formatIssueType(quoteResponseRequest.issueType)}</Badge>
                  )}
                  {quoteResponseRequest.workOrderType && (
                    <Badge variant="secondary">{formatWorkOrderType(quoteResponseRequest.workOrderType)}</Badge>
                  )}
                </div>
                {quoteResponseRequest.description && (
                  <p className="text-sm text-muted-foreground">{quoteResponseRequest.description}</p>
                )}
              </div>

              {/* Quote Details */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-purple-800">Contractor&apos;s Quote</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Price</p>
                    <p className="text-2xl font-bold text-purple-800">
                      SAR {quoteResponseRequest.quotedPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Scheduled Date</p>
                    <p className="text-lg font-semibold text-purple-800">
                      {quoteResponseRequest.quotedDate ? new Date(quoteResponseRequest.quotedDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
                {quoteResponseRequest.assignedTo && (
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Assigned Technician</p>
                    <p className="text-sm font-medium text-purple-800">{quoteResponseRequest.assignedTo}</p>
                  </div>
                )}
              </div>

              {/* Rejection Form */}
              {showRejectionForm ? (
                <div className="space-y-3">
                  <Label htmlFor="rejectionReason">Reason for rejection (optional)</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Let the contractor know why you're rejecting this quote..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowRejectionForm(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleRejectQuote}
                      disabled={respondingToQuote}
                      className="flex-1"
                    >
                      {respondingToQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>What happens next?</strong> If you accept, a work order will be created and your contractor will schedule the service. 
                      If you reject, the contractor will be notified and may provide a revised quote.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setShowRejectionForm(true)}
                      className="flex-1"
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={handleAcceptQuote}
                      disabled={respondingToQuote}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {respondingToQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Accept Quote
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
