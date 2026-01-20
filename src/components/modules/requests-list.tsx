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
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Send,
  Image as ImageIcon,
  User,
} from 'lucide-react'

// Helper function to extract base name from work order title (removes Q1, Q2, Month1, etc.)
function getBaseWorkOrderName(title: string): string {
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

interface WorkOrder {
  id: string
  title: string
  description: string | null
  scheduledDate: string | null
  price: number | null
  stage: string
  type: string
  recurringType?: 'ONCE' | 'MONTHLY' | 'QUARTERLY'
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

interface RequestsListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT'
  projectId?: string | null
}

// Collapsible Work Orders Grouped View for Contractor (with edit capability)
interface WorkOrdersGroupedViewContractorProps {
  workOrders: WorkOrder[]
  editingWorkOrderId: string | null
  editWorkOrder: { price: string; scheduledDate: string }
  saving: boolean
  onStartEdit: (wo: WorkOrder) => void
  onSave: (workOrderId: string) => void
  onCancel: () => void
  onEditChange: (field: 'price' | 'scheduledDate', value: string) => void
  onSaveGroupPrice: (groupName: string, price: string, scheduledDate: string, workOrderIds: string[]) => Promise<void>
}

function WorkOrdersGroupedViewContractor({
  workOrders,
  editingWorkOrderId,
  editWorkOrder,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onEditChange,
  onSaveGroupPrice,
}: WorkOrdersGroupedViewContractorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [groupPrice, setGroupPrice] = useState('')
  const [groupDate, setGroupDate] = useState('')
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

  const startEditGroup = (groupName: string, items: WorkOrder[]) => {
    setEditingGroup(groupName)
    // Use the first item's price as default, or empty
    const firstPrice = items[0]?.price
    setGroupPrice(firstPrice !== null ? firstPrice.toString() : '')
    // For single items, also set the date
    const firstDate = items[0]?.scheduledDate
    setGroupDate(firstDate ? new Date(firstDate).toISOString().split('T')[0] : '')
  }

  const saveGroupPrice = async (groupName: string, items: WorkOrder[]) => {
    const ids = items.map(wo => wo.id)
    await onSaveGroupPrice(groupName, groupPrice, groupDate, ids)
    // Clear state after save completes
    setEditingGroup(null)
    setGroupPrice('')
    setGroupDate('')
  }

  const cancelEditGroup = () => {
    setEditingGroup(null)
    setGroupPrice('')
    setGroupDate('')
  }
  
  return (
    <div className="divide-y border rounded-lg overflow-hidden">
      {Array.from(groups.entries()).map(([groupName, items]) => {
        const isExpanded = expandedGroups.has(groupName)
        const groupTotal = items.reduce((sum, wo) => sum + (wo.price || 0), 0)
        const hasPendingPrice = items.some(wo => wo.price === null)
        const isSingleItem = items.length === 1
        const isEditingThisGroup = editingGroup === groupName
        const hasAdhoc = items.some(wo => wo.type === 'adhoc' || wo.type === 'ADHOC')
        
        return (
          <div key={groupName} className="bg-white">
            {/* Group Header */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <button
                onClick={() => !isSingleItem && toggleGroup(groupName)}
                className={`flex-1 flex items-center gap-2 text-left ${isSingleItem ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {!isSingleItem && (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{groupName}</span>
                    {!isSingleItem && (
                      <Badge variant="secondary" className="text-xs">
                        {items.length} occurrences
                      </Badge>
                    )}
                    {hasAdhoc && (
                      <Badge variant="outline" className="text-purple-600 text-xs">
                        Client Added
                      </Badge>
                    )}
                    {/* Show recurring type for client-added items */}
                    {hasAdhoc && items[0].recurringType && items[0].recurringType !== 'ONCE' && (
                      <Badge variant="outline" className="text-blue-600 text-xs">
                        {items[0].recurringType === 'MONTHLY' ? 'Monthly' : 'Quarterly'}
                      </Badge>
                    )}
                  </div>
                  {items[0].description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {items[0].description}
                    </p>
                  )}
                </div>
              </button>
              
              {/* Price & Edit Section */}
              <div className="flex items-center gap-3">
                {isEditingThisGroup ? (
                  <div className="flex items-center gap-2">
                    {/* Date input - for single items it's the date, for groups it's the start date */}
                    <div className="flex items-center gap-1">
                      {!isSingleItem && (
                        <span className="text-xs text-muted-foreground">Start:</span>
                      )}
                      <Input
                        type="date"
                        value={groupDate}
                        onChange={(e) => setGroupDate(e.target.value)}
                        className="w-[140px]"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-1">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={groupPrice}
                        onChange={(e) => setGroupPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-[100px] text-right"
                      />
                      {!isSingleItem && (
                        <span className="text-xs text-muted-foreground ml-1">each</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveGroupPrice(groupName, items)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditGroup}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      {hasPendingPrice ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Needs Price
                        </Badge>
                      ) : (
                        <span className="font-semibold text-primary">
                          ${groupTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditGroup(groupName, items)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
            
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
                  <div key={wo.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3 text-sm">
                      <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      <div>
                        <span className="text-muted-foreground">
                          {wo.title.match(/\((Q\d+|Month\d+)\)/i)?.[1] || `#${idx + 1}`}:
                        </span>
                        {wo.scheduledDate && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(wo.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingWorkOrderId === wo.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editWorkOrder.price}
                            onChange={(e) => onEditChange('price', e.target.value)}
                            placeholder="0.00"
                            className="w-[80px] text-right"
                          />
                          <Button size="sm" onClick={() => onSave(wo.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={onCancel}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {wo.price !== null ? (
                            <span className="font-medium">${wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <Badge variant="outline" className="text-xs text-orange-600">Pending</Badge>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => onStartEdit(wo)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
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
  const [successMessage, setSuccessMessage] = useState('')
  const [showCompleted, setShowCompleted] = useState(false) // Toggle to show/hide completed requests
  
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

  // Quote dialog state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)
  const [quoteRequest, setQuoteRequest] = useState<Request | null>(null)
  const [quoteData, setQuoteData] = useState({
    quotedPrice: '',
    quotedDate: '',
    assignedTo: '',
  })
  const [submittingQuote, setSubmittingQuote] = useState(false)

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        // Show all requests for this branch - don't filter by projectId
        // Standalone service requests have no projectId
        setRequests(data)
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter requests based on showCompleted toggle
  const filteredRequests = showCompleted 
    ? requests 
    : requests.filter(r => r.status !== 'COMPLETED')

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
      const payload = {
        price: editWorkOrder.price || null,
        scheduledDate: editWorkOrder.scheduledDate || null,
      }
      console.log('Saving work order:', workOrderId, payload)
      
      const response = await fetch(`/api/projects/${selectedProject.id}/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      console.log('Response:', response.status, data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update work order')
      }
      
      setEditingWorkOrderId(null)
      // Refresh projects and update selected project
      const updatedProjects = await fetch(`/api/branches/${branchId}/projects`).then(r => r.json())
      setProjects(updatedProjects)
      const updated = updatedProjects.find((p: Project) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Save group price - applies same price to all work orders in the group
  // For recurring groups, also recalculates occurrence dates based on start date
  const handleSaveGroupPrice = async (groupName: string, price: string, scheduledDate: string, workOrderIds: string[]) => {
    if (!selectedProject) return
    setSaving(true)
    setError('')
    try {
      const isSingleItem = workOrderIds.length === 1
      
      // Find the work orders to get their recurring type
      const workOrders = selectedProject.workOrders?.filter(wo => workOrderIds.includes(wo.id)) || []
      const recurringType = workOrders[0]?.recurringType || 'ONCE'
      
      // For recurring groups, calculate dates based on start date and interval
      const startDate = scheduledDate ? new Date(scheduledDate) : null
      const interval = recurringType === 'MONTHLY' ? 1 : recurringType === 'QUARTERLY' ? 3 : 0
      
      for (let i = 0; i < workOrderIds.length; i++) {
        const workOrderId = workOrderIds[i]
        const payload: { price?: string; scheduledDate?: string } = {}
        
        if (price) payload.price = price
        
        // Calculate date for this occurrence
        if (startDate && scheduledDate) {
          if (isSingleItem || recurringType === 'ONCE') {
            // Single item - use the date directly
            payload.scheduledDate = scheduledDate
          } else {
            // Recurring group - calculate date based on occurrence index
            const occurrenceDate = new Date(startDate)
            occurrenceDate.setMonth(occurrenceDate.getMonth() + (i * interval))
            payload.scheduledDate = occurrenceDate.toISOString().split('T')[0]
          }
        }
        
        const response = await fetch(`/api/projects/${selectedProject.id}/work-orders/${workOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update work order')
        }
      }
      
      // Refresh projects and update selected project
      const updatedProjects = await fetch(`/api/branches/${branchId}/projects`).then(r => r.json())
      setProjects(updatedProjects)
      const updated = updatedProjects.find((p: Project) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    } catch (err) {
      console.error('Save group error:', err)
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

  // Open quote dialog for a request
  const openQuoteDialog = (request: Request) => {
    setQuoteRequest(request)
    setQuoteData({
      quotedPrice: request.quotedPrice?.toString() || '',
      quotedDate: request.quotedDate ? new Date(request.quotedDate).toISOString().split('T')[0] : '',
      assignedTo: request.assignedTo || '',
    })
    setQuoteDialogOpen(true)
  }

  // Submit quote for a request
  const handleSubmitQuote = async () => {
    if (!quoteRequest) return
    if (!quoteData.quotedPrice || !quoteData.quotedDate) {
      setError('Please provide both price and scheduled date')
      return
    }

    setSubmittingQuote(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${quoteRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quote',
          quotedPrice: parseFloat(quoteData.quotedPrice),
          quotedDate: quoteData.quotedDate,
          assignedTo: quoteData.assignedTo || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit quote')
      }

      setQuoteDialogOpen(false)
      setQuoteRequest(null)
      setQuoteData({ quotedPrice: '', quotedDate: '', assignedTo: '' })
      setSuccessMessage('Quote sent to client for approval')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmittingQuote(false)
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
              {userRole === 'CONTRACTOR' 
                ? 'Manage work orders and service requests for this branch'
                : 'View and submit service requests for this branch'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'CONTRACTOR' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? (
                  <><EyeOff className="mr-2 h-4 w-4" />Hide Completed</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" />Show Completed</>
                )}
              </Button>
            )}
            {userRole !== 'CONTRACTOR' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {requests.length > 0 && !showCompleted ? 'No active requests' : 'No requests yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {requests.length > 0 && !showCompleted
                  ? 'All requests have been completed. Toggle "Show Completed" to view them.'
                  : userRole === 'CONTRACTOR'
                    ? 'No service requests from the client yet.'
                    : 'Submit a service request to get started.'}
              </p>
              {userRole !== 'CONTRACTOR' && requests.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
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
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userRole === 'CONTRACTOR' && request.status === 'REQUESTED' && request.createdByRole === 'CLIENT' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openQuoteDialog(request); }}>
                          <Send className="mr-2 h-4 w-4" />
                          Review & Quote
                        </DropdownMenuItem>
                      )}
                      {request.status === 'REQUESTED' && (
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
                  {selectedRequest.status === 'REQUESTED' && (
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

          {successMessage && (
            <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {successMessage}
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
                    ${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  <>
                    <WorkOrdersGroupedViewContractor
                      workOrders={selectedProject.workOrders}
                      editingWorkOrderId={editingWorkOrderId}
                      editWorkOrder={editWorkOrder}
                      saving={saving}
                      onStartEdit={startEditWorkOrder}
                      onSave={handleSaveWorkOrder}
                      onCancel={() => setEditingWorkOrderId(null)}
                      onEditChange={(field, value) => setEditWorkOrder({ ...editWorkOrder, [field]: value })}
                      onSaveGroupPrice={handleSaveGroupPrice}
                    />
                    
                    {/* Total Row */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 border rounded-lg mt-3">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        ${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
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
          )})()}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setProjectDialogOpen(false); setSelectedProject(null); }}>
              Close
            </Button>
            {selectedProject?.status === 'PENDING' && (
              <Button 
                onClick={() => {
                  setSuccessMessage('Proposal updated! Client will see the changes when they view the proposal.')
                  setTimeout(() => {
                    setSuccessMessage('')
                    setProjectDialogOpen(false)
                    setSelectedProject(null)
                  }, 2000)
                }}
                disabled={selectedProject?.workOrders?.some(wo => wo.price === null)}
                className="bg-primary"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog - For contractors to review and quote client requests */}
      <Dialog open={quoteDialogOpen} onOpenChange={(open) => { if (!open) { setQuoteDialogOpen(false); setQuoteRequest(null); setError(''); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Quote Request</DialogTitle>
            <DialogDescription>
              Review the client&apos;s request and provide a quote
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {quoteRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{quoteRequest.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {getPriorityBadge(quoteRequest.priority)}
                    {getStatusBadge(quoteRequest.status)}
                    {quoteRequest.issueType && (
                      <Badge variant="outline">{formatIssueType(quoteRequest.issueType)}</Badge>
                    )}
                    {quoteRequest.workOrderType && (
                      <Badge variant="secondary">{formatWorkOrderType(quoteRequest.workOrderType)}</Badge>
                    )}
                  </div>
                </div>

                {quoteRequest.description && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{quoteRequest.description}</p>
                  </div>
                )}

                {/* Client Preferences */}
                {(quoteRequest.preferredDate || quoteRequest.preferredTimeSlot) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">Client Preferences</p>
                    <div className="flex gap-4 text-sm">
                      {quoteRequest.preferredDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{new Date(quoteRequest.preferredDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {quoteRequest.preferredTimeSlot && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="capitalize">{quoteRequest.preferredTimeSlot.toLowerCase().replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {quoteRequest.photos && quoteRequest.photos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Attached Photos ({quoteRequest.photos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quoteRequest.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Request photo'}
                            className="h-20 w-20 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{new Date(quoteRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-medium capitalize">{quoteRequest.createdByRole.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {/* Quote Form */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Your Quote</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quotedPrice">Price (SAR) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="quotedPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={quoteData.quotedPrice}
                          onChange={(e) => setQuoteData({ ...quoteData, quotedPrice: e.target.value })}
                          placeholder="0.00"
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotedDate">Scheduled Date *</Label>
                      <Input
                        id="quotedDate"
                        type="date"
                        value={quoteData.quotedDate}
                        onChange={(e) => setQuoteData({ ...quoteData, quotedDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign Technician (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="assignedTo"
                        value={quoteData.assignedTo}
                        onChange={(e) => setQuoteData({ ...quoteData, assignedTo: e.target.value })}
                        placeholder="Technician name or ID"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can assign a team member to handle this request
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Once you submit this quote, the client will be notified and can accept or reject it.
                  If accepted, a work order will be automatically created.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setQuoteDialogOpen(false); setQuoteRequest(null); setError(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitQuote} 
              disabled={submittingQuote || !quoteData.quotedPrice || !quoteData.quotedDate}
            >
              {submittingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Quote to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
