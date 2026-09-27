'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
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
  Banknote,
  Send,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  X,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  PenTool,
} from 'lucide-react'
import { SignaturePad } from '@/components/ui/signature-pad'
import { RequestComments } from '@/components/modules/request-comments'
import { ExportDialog } from '@/components/export/export-dialog'
import { api } from '@/lib/api-client'
import {
  exportRequestsToExcel,
  exportRequestsToPdf,
  exportRequestsToCsv,
  type ExportOptions,
  type ExportableRequest,
} from '@/lib/export/export-utils'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate as formatDateUtil } from '@/lib/i18n/format-date'

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

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  dateAdded: string
  expectedExpiry: string | null
  lastInspected: string | null
  isInspected: boolean
  notes: string | null
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
  assignedToUser?: { id: string; name: string | null; email: string } | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  projectId?: string
  project?: Project
  requestNumber?: number | null
  // Service request fields
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION' | null
  recurringType?: 'ONCE' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
  needsCertificate?: boolean
  preferredDate?: string | null
  preferredTimeSlot?: string | null
  quotedPrice?: number | null
  quotedDate?: string | null
  quotedNotes?: string | null
  quotedBy?: string | null
  clientAccepted?: boolean | null
  clientAcceptedAt?: string | null
  clientRejectedAt?: string | null
  clientRejectionReason?: string | null
  quotationUrl?: string | null
  quotationFileName?: string | null
  photos?: RequestPhoto[]
  equipment?: Equipment[]
  occurrences?: Array<{ order: number; visitDate: string; price: number | null }> | null
}

interface ClientBranchRequestsProps {
  branchId: string
  onDataChange?: () => void
  userId?: string
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
  const { t, locale } = useTranslation()
  const tc = t.dashboard.clientBranchRequestsPage
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const groups = groupWorkOrders(workOrders)
  const dateLocale = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US'

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
          <div key={groupName} className="bg-white dark:bg-card">
            {/* Group Header */}
            <button
              onClick={() => !isSingleItem && toggleGroup(groupName)}
              className={`w-full flex items-center justify-between p-4 text-start hover:bg-muted/50 transition-colors ${isSingleItem ? 'cursor-default' : 'cursor-pointer'}`}
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
                      {tc.occurrencesCount.replace('{count}', String(items.length))}
                    </Badge>
                  )}
                </div>
                {items[0].description && (
                  <p className="text-sm text-muted-foreground mt-1 ms-6">
                    {items[0].description}
                  </p>
                )}
              </div>
              <div className="text-end flex-shrink-0">
                {hasPendingPrice ? (
                  <Badge variant="outline" className="text-xs">{tc.awaitingPrice}</Badge>
                ) : (
                  <span className="font-semibold text-primary">
                    {t.dashboard.requestsList.sar} {groupTotal.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </button>

            {/* Single Item Details (inline) */}
            {isSingleItem && (
              <div className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground ms-6">
                  <CornerDownRight className="h-4 w-4 flex-shrink-0" />
                  {items[0].scheduledDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateUtil(items[0].scheduledDate, locale)}
                    </div>
                  ) : (
                    <span>{tc.noDateScheduled}</span>
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
                      <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ms-2" />
                      <div>
                        <span className="text-muted-foreground">
                          {wo.title.match(/\((Q\d+|Month\d+)\)/i)?.[1] || `#${idx + 1}`}:
                        </span>
                        {wo.scheduledDate && (
                          <span className="ms-2 flex items-center gap-1 inline-flex">
                            <Calendar className="h-3 w-3" />
                            {formatDateUtil(wo.scheduledDate, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      {wo.price !== null ? (
                        <span className="font-medium">{t.dashboard.requestsList.sar} {wo.price.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">{tc.pendingBadge}</Badge>
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

export function ClientBranchRequests({ branchId, onDataChange, userId }: ClientBranchRequestsProps) {
  const { t, locale } = useTranslation()
  const tc = t.dashboard.clientBranchRequestsPage
  const dateLocale = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US'
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [allRequests, setAllRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState('')

  const [newRequest, setNewRequest] = useState<{
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    workOrderType: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION'
    recurringType: 'ONCE' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
    needsCertificate: boolean
    preferredDate: string
    preferredTimeSlot: string
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    workOrderType: 'SERVICE',
    recurringType: 'ONCE',
    needsCertificate: false,
    preferredDate: '',
    preferredTimeSlot: '',
  })

  // Equipment state for sticker inspections
  const [equipment, setEquipment] = useState<{
    equipmentNumber: string
    equipmentType: string
    location: string
    dateAdded: string
    expectedExpiry: string
    notes: string
  }[]>([])
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [newEquipment, setNewEquipment] = useState({
    equipmentNumber: '',
    equipmentType: 'FIRE_EXTINGUISHER',
    customEquipmentType: '',
    location: '',
    dateAdded: new Date().toISOString().split('T')[0],
    expectedExpiry: '',
    notes: '',
  })
  const [uploadedPhotos, setUploadedPhotos] = useState<{ url: string; name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  // Quote response state
  const [quoteResponseDialogOpen, setQuoteResponseDialogOpen] = useState(false)
  const [quoteResponseRequest, setQuoteResponseRequest] = useState<Request | null>(null)
  const [respondingToQuote, setRespondingToQuote] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [showSignatureForm, setShowSignatureForm] = useState(false)
  const [clientSignature, setClientSignature] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Start Immediately state
  const [startImmediatelyDialogOpen, setStartImmediatelyDialogOpen] = useState(false)
  const [startImmediatelyRequest, setStartImmediatelyRequest] = useState<Request | null>(null)
  const [startImmediatelyDate, setStartImmediatelyDate] = useState('')
  const [startingImmediately, setStartingImmediately] = useState(false)

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests`)
      if (response.ok) {
        const data = await response.json()
        setAllRequests(data)
        const activeRequestStatuses = ['REQUESTED', 'QUOTED']
        const filtered = data.filter((r: Request) => activeRequestStatuses.includes(r.status))
        setRequests(filtered)
        setError('')
      } else {
        const errorData = await response.json()
        setError(tc.loadRequestsFailed.replace('{error}', errorData.error || response.statusText))
      }
    } catch {
      setError(tc.fetchRequestsFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [branchId])

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
      formData.append('branchId', branchId)

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
    setShowSignatureForm(false)
    setClientSignature(null)
    setRejectionReason('')
  }

  // Accept quote with signature
  const handleAcceptQuote = async () => {
    if (!quoteResponseRequest) return
    if (!clientSignature) {
      setError('Please sign to accept the quote')
      return
    }
    setRespondingToQuote(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${quoteResponseRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          clientSignature: clientSignature
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept quote')
      }

      setQuoteResponseDialogOpen(false)
      setQuoteResponseRequest(null)
      setShowSignatureForm(false)
      setClientSignature(null)
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.genericError)
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
      setError(err instanceof Error ? err.message : tc.genericError)
    } finally {
      setRespondingToQuote(false)
    }
  }

  // Open start immediately dialog
  const openStartImmediatelyDialog = (request: Request) => {
    setStartImmediatelyRequest(request)
    setStartImmediatelyDialogOpen(true)
    // Auto-set to today's date
    setStartImmediatelyDate(new Date().toISOString().split('T')[0])
  }

  // Start work immediately without quotation
  const handleStartImmediately = async () => {
    if (!startImmediatelyRequest) {
      setError(tc.noRequestSelected)
      return
    }

    setStartingImmediately(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${startImmediatelyRequest.id}/start-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || data.details || t.toasts.createWorkOrderFailed)
      }

      const result = await response.json()

      setStartImmediatelyDialogOpen(false)
      setStartImmediatelyRequest(null)
      setStartImmediatelyDate('')
      fetchRequests()
      onDataChange?.()
      router.refresh()

      toast.success(tc.workOrderCreatedToast.replace('{id}', result.workOrderId?.slice(0, 8) ?? ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.genericError)
      toast.error(err instanceof Error ? err.message : t.toasts.createWorkOrderFailed)
    } finally {
      setStartingImmediately(false)
    }
  }

  // Map an equipment type enum value to its translated label
  const equipmentTypeLabel = (type: string): string => {
    const el = t.dashboard.equipmentList
    const map: Record<string, string> = {
      FIRE_EXTINGUISHER: el.fireExtinguisher,
      FIRE_ALARM_PANEL: el.fireAlarmPanel,
      SPRINKLER_SYSTEM: el.sprinklerSystem,
      EMERGENCY_LIGHTING: el.emergencyLighting,
      EXIT_SIGN: el.exitSign,
      FIRE_DOOR: el.fireDoor,
      SMOKE_DETECTOR: el.smokeDetector,
      HEAT_DETECTOR: el.heatDetector,
      GAS_DETECTOR: el.gasDetector,
      KITCHEN_HOOD_SUPPRESSION: el.kitchenHoodSuppression,
      FIRE_PUMP: el.firePump,
      FIRE_HOSE_REEL: el.fireHoseReel,
      OTHER: el.other,
    }
    return map[type] ?? type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Count + frequency label for a recurring type, used to fill "{count} {freq}" templates.
  // Only MONTHLY/QUARTERLY appear in these specific flows (no SEMI_ANNUALLY here).
  const recurringCountAndFreq = (recurringType: string | null | undefined): { count: string; freq: string } =>
    recurringType === 'MONTHLY'
      ? { count: '12', freq: tc.monthly }
      : { count: '4', freq: tc.quarterly }

  // Format work order type for display
  const formatWorkOrderType = (type: string | null | undefined): string => {
    if (!type) return tc.typeService
    switch (type) {
      case 'SERVICE': return tc.typeService
      case 'INSPECTION': return tc.typeInspection
      case 'MAINTENANCE': return tc.typeMaintenance
      case 'INSTALLATION': return tc.typeInstallation
      case 'STICKER_INSPECTION': return tc.typeStickerInspection
      default: return type.charAt(0) + type.slice(1).toLowerCase()
    }
  }

  const handleExportRequests = async (
    format: string,
    options: Record<string, boolean>,
    dateRange?: { from: string; to: string }
  ) => {
    let dataToExport = allRequests as ExportableRequest[]

    if (dateRange?.from && dateRange?.to) {
      const fromDate = new Date(dateRange.from)
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      dataToExport = dataToExport.filter(r => {
        const created = new Date(r.createdAt)
        return created >= fromDate && created <= toDate
      })
    }

    const exportOpts: ExportOptions = {
      includeDetails: options.includeDetails ?? true,
      includeClient: options.includeClient ?? true,
      includePricing: options.includePricing ?? true,
      includeDates: options.includeDates ?? true,
      includePhotos: options.includePhotos ?? false,
    }

    if (format === 'excel') {
      exportRequestsToExcel(dataToExport, exportOpts, locale)
    } else if (format === 'pdf') {
      return exportRequestsToPdf(dataToExport, exportOpts, locale)
    } else if (format === 'csv') {
      exportRequestsToCsv(dataToExport, exportOpts, locale)
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
        body: JSON.stringify({
          ...newRequest,
          photoUrls: uploadedPhotos.map(p => p.url),
          // Include equipment for sticker inspections
          equipment: newRequest.workOrderType === 'STICKER_INSPECTION' ? equipment : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create request')
      }

      setCreateDialogOpen(false)
      setNewRequest({ title: '', description: '', priority: 'MEDIUM', workOrderType: 'SERVICE', recurringType: 'ONCE', needsCertificate: false, preferredDate: '', preferredTimeSlot: '' })
      setUploadedPhotos([])
      setEquipment([])
      setShowEquipmentForm(false)
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.genericError)
    } finally {
      setCreating(false)
    }
  }

  const getPriorityBadge = (priority: Request['priority']) => {
    const styles: Record<Request['priority'], string> = {
      LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      MEDIUM: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
      HIGH: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
      URGENT: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
    }
    const labels: Record<Request['priority'], string> = {
      LOW: tc.priorityLow,
      MEDIUM: tc.priorityMedium,
      HIGH: tc.priorityHigh,
      URGENT: tc.priorityUrgent,
    }
    return <Badge className={styles[priority]}>{labels[priority]}</Badge>
  }

  const getStatusBadge = (status: Request['status']) => {
    const config: Record<Request['status'], { style: string; icon: typeof Clock; label: string }> = {
      REQUESTED: { style: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400', icon: Clock, label: tc.statusRequested },
      QUOTED: { style: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400', icon: Clock, label: tc.statusQuoted },
      SCHEDULED: { style: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400', icon: Clock, label: tc.statusScheduled },
      IN_PROGRESS: { style: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400', icon: AlertCircle, label: tc.statusInProgress },
      FOR_REVIEW: { style: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400', icon: AlertCircle, label: tc.statusForReview },
      PENDING_APPROVAL: { style: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400', icon: Clock, label: tc.statusPendingApproval },
      COMPLETED: { style: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400', icon: CheckCircle, label: tc.statusCompleted },
      CLOSED: { style: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: CheckCircle, label: tc.statusClosed },
      REJECTED: { style: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400', icon: XCircle, label: tc.statusRejected },
      CANCELLED: { style: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: XCircle, label: tc.statusCancelled },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
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
            <CardTitle>{tc.title}</CardTitle>
            <CardDescription>
              {tc.subtitle}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExportDialog
              title={tc.exportTitle}
              description={tc.exportDesc}
              itemCount={allRequests.length}
              onExport={handleExportRequests}
              showDateRange={true}
            />
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {tc.submitRequest}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
              <LocalizedError message={error} />
            </div>
          )}
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{tc.noRequestsYet}</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {tc.noRequestsDesc}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                {tc.submitRequest}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sort requests: QUOTED first, then by date */}
              {[...requests].sort((a, b) => {
                if (a.status === 'QUOTED' && b.status !== 'QUOTED') return -1
                if (a.status !== 'QUOTED' && b.status === 'QUOTED') return 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              }).map((request) => (
                <div
                  key={request.id}
                  className={`p-4 border-2 rounded-lg transition-colors ${request.status === 'QUOTED' ? 'border-purple-500 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 shadow-md ring-2 ring-purple-200 dark:ring-purple-900' : 'border-gray-200 dark:border-gray-800 hover:bg-muted/50'}`}
                >
                  <div
                    className="space-y-2 cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(request)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {request.requestNumber && (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          REQ-{String(request.requestNumber).padStart(4, '0')}
                        </span>
                      )}
                      <h4 className="font-medium">{request.title}</h4>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                      {request.createdByRole === 'CLIENT' && (
                        <Badge variant="outline" className="text-xs">{tc.submittedByYou}</Badge>
                      )}
                      {request.recurringType && request.recurringType !== 'ONCE' && (
                        <Badge variant="secondary" className="text-xs">{request.recurringType === 'MONTHLY' ? tc.monthly : tc.quarterly}</Badge>
                      )}
                      {request.needsCertificate && (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">{tc.certificateBadge}</Badge>
                      )}
                    </div>
                    {request.description && !request.title.startsWith('Project Proposal:') && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {tc.createdLabel} {formatDateUtil(request.createdAt, locale)}
                      {request.dueDate && (
                        <> · {tc.dueLabel} {formatDateUtil(request.dueDate, locale)}</>
                      )}
                      {request.completedAt && (
                        <> · {tc.completedLabel} {formatDateUtil(request.completedAt, locale)}</>
                      )}
                    </p>
                  </div>

                  {/* Show quote info and action buttons for QUOTED requests */}
                  {request.status === 'QUOTED' && request.quotedPrice && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Banknote className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-purple-700 dark:text-purple-400">
                              {t.dashboard.requestsList.sar} {request.quotedPrice.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {request.quotedDate && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateUtil(request.quotedDate, locale)}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openQuoteResponseDialog(request); }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {tc.reviewQuote}
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
            <DialogTitle>{tc.submitServiceRequest}</DialogTitle>
            <DialogDescription>
              {tc.submitServiceRequestDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                <LocalizedError message={error} />
              </div>
            )}
            <div className="space-y-4">
              {/* Service Type - At Top */}
              <div className="space-y-2">
                <Label htmlFor="workOrderType">{tc.serviceTypeLabel}</Label>
                <Select
                  value={newRequest.workOrderType}
                  onValueChange={(value: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION') => {
                    const needsCert = ['INSPECTION', 'MAINTENANCE', 'INSTALLATION', 'STICKER_INSPECTION'].includes(value)
                    const defaultRecurring = value === 'STICKER_INSPECTION' ? 'ANNUALLY' : newRequest.recurringType
                    setNewRequest({ ...newRequest, workOrderType: value, needsCertificate: needsCert, recurringType: defaultRecurring })
                    // Clear equipment if switching away from sticker inspection
                    if (value !== 'STICKER_INSPECTION') {
                      setEquipment([])
                      setShowEquipmentForm(false)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">{tc.repairServiceOption}</SelectItem>
                    <SelectItem value="INSPECTION">{tc.inspectionOption}</SelectItem>
                    <SelectItem value="MAINTENANCE">{tc.maintenanceOption}</SelectItem>
                    <SelectItem value="INSTALLATION">{tc.installationOption}</SelectItem>
                    <SelectItem value="STICKER_INSPECTION">{tc.stickerInspectionOption}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{tc.briefDescLabel}</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder={tc.briefDescPlaceholder}
                  required
                />
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="description">{tc.additionalDetailsLabel}</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder={tc.additionalDetailsPlaceholder}
                  rows={3}
                />
              </div>

              {/* Priority & Frequency Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">{tc.priorityLabel}</Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setNewRequest({ ...newRequest, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">{tc.priorityLow}</SelectItem>
                      <SelectItem value="MEDIUM">{tc.priorityMedium}</SelectItem>
                      <SelectItem value="HIGH">{tc.priorityHigh}</SelectItem>
                      <SelectItem value="URGENT">🚨 {tc.priorityUrgent}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringType">{tc.frequencyLabel}</Label>
                  <Select
                    value={newRequest.recurringType}
                    onValueChange={(value: 'ONCE' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY') => setNewRequest({ ...newRequest, recurringType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">{tc.once}</SelectItem>
                      <SelectItem value="MONTHLY">{tc.monthly}</SelectItem>
                      <SelectItem value="QUARTERLY">{tc.quarterly}</SelectItem>
                      <SelectItem value="SEMI_ANNUALLY">{tc.semiAnnually}</SelectItem>
                      <SelectItem value="ANNUALLY">{tc.annually}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Equipment List - Only for Sticker Inspection */}
              {newRequest.workOrderType === 'STICKER_INSPECTION' && (
                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-amber-800 dark:text-amber-400 font-medium">{tc.equipmentListLabel}</Label>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{tc.equipmentListDesc}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                      onClick={() => setShowEquipmentForm(true)}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      {tc.addEquipmentBtn}
                    </Button>
                  </div>

                  {/* Equipment Form */}
                  {showEquipmentForm && (
                    <div className="space-y-3 p-3 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-900">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{tc.equipmentNumberLabel}</Label>
                          <Input
                            placeholder={tc.equipmentNumberPlaceholder}
                            value={newEquipment.equipmentNumber}
                            onChange={(e) => setNewEquipment({ ...newEquipment, equipmentNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{tc.typeLabel}</Label>
                          <Select
                            value={newEquipment.equipmentType}
                            onValueChange={(value) => setNewEquipment({
                              ...newEquipment,
                              equipmentType: value,
                              customEquipmentType: value !== 'OTHER' ? '' : newEquipment.customEquipmentType
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIRE_EXTINGUISHER">{t.dashboard.equipmentList.fireExtinguisher}</SelectItem>
                              <SelectItem value="FIRE_ALARM_PANEL">{t.dashboard.equipmentList.fireAlarmPanel}</SelectItem>
                              <SelectItem value="SPRINKLER_SYSTEM">{t.dashboard.equipmentList.sprinklerSystem}</SelectItem>
                              <SelectItem value="EMERGENCY_LIGHTING">{t.dashboard.equipmentList.emergencyLighting}</SelectItem>
                              <SelectItem value="EXIT_SIGN">{t.dashboard.equipmentList.exitSign}</SelectItem>
                              <SelectItem value="FIRE_DOOR">{t.dashboard.equipmentList.fireDoor}</SelectItem>
                              <SelectItem value="SMOKE_DETECTOR">{t.dashboard.equipmentList.smokeDetector}</SelectItem>
                              <SelectItem value="HEAT_DETECTOR">{t.dashboard.equipmentList.heatDetector}</SelectItem>
                              <SelectItem value="GAS_DETECTOR">{t.dashboard.equipmentList.gasDetector}</SelectItem>
                              <SelectItem value="KITCHEN_HOOD_SUPPRESSION">{t.dashboard.equipmentList.kitchenHoodSuppression}</SelectItem>
                              <SelectItem value="FIRE_PUMP">{t.dashboard.equipmentList.firePump}</SelectItem>
                              <SelectItem value="FIRE_HOSE_REEL">{t.dashboard.equipmentList.fireHoseReel}</SelectItem>
                              <SelectItem value="OTHER">{t.dashboard.equipmentList.other}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Custom Equipment Type - Show when OTHER is selected */}
                      {newEquipment.equipmentType === 'OTHER' && (
                        <div className="space-y-1">
                          <Label className="text-xs">{tc.customTypeLabel}</Label>
                          <Input
                            placeholder={tc.customTypePlaceholder}
                            value={newEquipment.customEquipmentType}
                            onChange={(e) => setNewEquipment({ ...newEquipment, customEquipmentType: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">{tc.locationLabel}</Label>
                        <Input
                          placeholder={tc.locationPlaceholder}
                          value={newEquipment.location}
                          onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{tc.dateAddedLabel}</Label>
                          <Input
                            type="date"
                            value={newEquipment.dateAdded}
                            onChange={(e) => setNewEquipment({ ...newEquipment, dateAdded: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{tc.expectedExpiryLabel}</Label>
                          <Input
                            type="date"
                            value={newEquipment.expectedExpiry}
                            onChange={(e) => setNewEquipment({ ...newEquipment, expectedExpiry: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{tc.notesOptionalLabel}</Label>
                        <Input
                          placeholder={tc.notesPlaceholder}
                          value={newEquipment.notes}
                          onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowEquipmentForm(false)
                            setNewEquipment({
                              equipmentNumber: '',
                              equipmentType: 'FIRE_EXTINGUISHER',
                              customEquipmentType: '',
                              location: '',
                              dateAdded: new Date().toISOString().split('T')[0],
                              expectedExpiry: '',
                              notes: '',
                            })
                          }}
                        >
                          {tc.cancelBtn}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => {
                            if (!newEquipment.equipmentNumber.trim()) {
                              setError(tc.equipmentNumberRequired)
                              return
                            }

                            if (newEquipment.equipmentType === 'OTHER' && !newEquipment.customEquipmentType.trim()) {
                              setError(tc.specifyTypeRequired)
                              return
                            }
                            setEquipment([...equipment, { ...newEquipment }])
                            setShowEquipmentForm(false)
                            setNewEquipment({
                              equipmentNumber: '',
                              equipmentType: 'FIRE_EXTINGUISHER',
                              customEquipmentType: '',
                              location: '',
                              dateAdded: new Date().toISOString().split('T')[0],
                              expectedExpiry: '',
                              notes: '',
                            })
                            setError('')
                          }}
                        >
                          {tc.addBtn}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Equipment List Table */}
                  {equipment.length > 0 && (
                    <div className="border border-amber-200 dark:border-amber-900 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-amber-100 dark:bg-amber-950/60">
                          <tr>
                            <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableEquipmentNumber}</th>
                            <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableType}</th>
                            <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableLocation}</th>
                            <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableExpiry}</th>
                            <th className="px-3 py-2 text-end text-amber-800 dark:text-amber-400">{tc.tableAction}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-card divide-y divide-amber-100 dark:divide-amber-900">
                          {equipment.map((eq, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-medium">{eq.equipmentNumber}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {equipmentTypeLabel(eq.equipmentType)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{eq.location || '-'}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {eq.expectedExpiry ? formatDateUtil(eq.expectedExpiry, locale) : '-'}
                              </td>
                              <td className="px-3 py-2 text-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  onClick={() => setEquipment(equipment.filter((_, i) => i !== idx))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {equipment.length === 0 && !showEquipmentForm && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-4">
                      {tc.noEquipmentYet}
                    </p>
                  )}
                </div>
              )}

              {/* Preferred Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">{tc.preferredDateLabel}</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={newRequest.preferredDate}
                    onChange={(e) => setNewRequest({ ...newRequest, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTimeSlot">{tc.preferredTimeLabel}</Label>
                  <Select
                    value={newRequest.preferredTimeSlot}
                    onValueChange={(value) => setNewRequest({ ...newRequest, preferredTimeSlot: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tc.anyTimePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">{tc.morningOption}</SelectItem>
                      <SelectItem value="AFTERNOON">{tc.afternoonOption}</SelectItem>
                      <SelectItem value="EVENING">{tc.eveningOption}</SelectItem>
                      <SelectItem value="ANYTIME">{tc.anytimeOption}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>{tc.attachmentsLabel}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {tc.attachmentsDesc}
                </p>
                <FileUploadDropzone
                  onFilesSelected={(files) => {
                    const event = {
                      target: { files }
                    } as any
                    handlePhotoUpload(event)
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  multiple={true}
                  disabled={uploading}
                  uploading={uploading}
                  uploadedFiles={uploadedPhotos}
                  onRemoveFile={removePhoto}
                  label={tc.uploadFilesLabel}
                  showPreview={true}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {tc.cancelBtn}
              </Button>
              <Button type="submit" disabled={creating || uploading}>
                {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {tc.submitRequest}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog - Enhanced for Client */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              {selectedRequest?.createdByRole === 'CLIENT' ? tc.yourServiceRequest : tc.requestFromContractor}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Status and Type Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(selectedRequest.priority)}
                {getStatusBadge(selectedRequest.status)}
                {selectedRequest.workOrderType && (
                  <Badge variant="outline">{formatWorkOrderType(selectedRequest.workOrderType)}</Badge>
                )}
                {selectedRequest.recurringType && selectedRequest.recurringType !== 'ONCE' && (
                  <Badge variant="secondary">{selectedRequest.recurringType === 'MONTHLY' ? tc.monthly : tc.quarterly}</Badge>
                )}
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{tc.descriptionLabel}</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              )}

              {/* Request Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{tc.createdDateLabel}</p>
                  <p className="font-medium">{formatDateUtil(selectedRequest.createdAt, locale)}</p>
                </div>
                {selectedRequest.preferredDate && (
                  <div>
                    <p className="text-muted-foreground">{tc.preferredDateLabel}</p>
                    <p className="font-medium">{formatDateUtil(selectedRequest.preferredDate, locale)}</p>
                  </div>
                )}
                {selectedRequest.preferredTimeSlot && (
                  <div>
                    <p className="text-muted-foreground">{tc.preferredTimeLabel}</p>
                    <p className="font-medium">{selectedRequest.preferredTimeSlot}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{tc.attachedPhotosLabel}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.photos.map((photo, idx) => photo?.url ? (
                      <img
                        key={idx}
                        src={photo.url}
                        alt={`Request photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(photo.url, '_blank')}
                      />
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Equipment List - For Sticker Inspections */}
              {selectedRequest.workOrderType === 'STICKER_INSPECTION' && selectedRequest.equipment && selectedRequest.equipment.length > 0 && (
                <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">{tc.equipmentForInspectionLabel.replace('{count}', String(selectedRequest.equipment.length))}</p>
                  <div className="border border-amber-200 dark:border-amber-900 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-100 dark:bg-amber-950/60">
                        <tr>
                          <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableEquipmentNumber}</th>
                          <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableType}</th>
                          <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableLocation}</th>
                          <th className="px-3 py-2 text-start text-amber-800 dark:text-amber-400">{tc.tableExpiry}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-card divide-y divide-amber-100 dark:divide-amber-900">
                        {selectedRequest.equipment.map((eq) => (
                          <tr key={eq.id}>
                            <td className="px-3 py-2 font-medium">{eq.equipmentNumber}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {equipmentTypeLabel(eq.equipmentType)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{eq.location || '-'}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {eq.expectedExpiry ? formatDateUtil(eq.expectedExpiry, locale) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quote Response Section - If contractor has quoted */}
              {selectedRequest.status === 'QUOTED' && selectedRequest.quotedPrice && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-400 mb-2">{tc.quoteFromContractor}</p>

                  {/* For recurring requests with occurrences - show table */}
                  {selectedRequest.recurringType && selectedRequest.recurringType !== 'ONCE' && selectedRequest.occurrences && selectedRequest.occurrences.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-purple-700 dark:text-purple-400">
                        {selectedRequest.recurringType === 'MONTHLY' ? `12 ${tc.monthly}` :
                          selectedRequest.recurringType === 'QUARTERLY' ? `4 ${tc.quarterly}` :
                            selectedRequest.recurringType === 'SEMI_ANNUALLY' ? `2 ${tc.semiAnnual}` : ''} {t.dashboard.requestsList.workOrdersCount}
                      </p>
                      <div className="border border-purple-200 dark:border-purple-900 rounded-lg overflow-hidden bg-white dark:bg-card">
                        <table className="w-full text-sm">
                          <thead className="bg-purple-100 dark:bg-purple-950/60">
                            <tr>
                              <th className="px-3 py-2 text-start text-purple-800 dark:text-purple-400 font-medium">#</th>
                              <th className="px-3 py-2 text-start text-purple-800 dark:text-purple-400 font-medium">{tc.visitDateHeader}</th>
                              <th className="px-3 py-2 text-end text-purple-800 dark:text-purple-400 font-medium">{tc.priceSarHeader}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100 dark:divide-purple-900">
                            {selectedRequest.occurrences.map((occ, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-muted-foreground">{occ.order}</td>
                                <td className="px-3 py-2">
                                  {occ.visitDate ? formatDateUtil(occ.visitDate, locale) : '-'}
                                </td>
                                <td className="px-3 py-2 text-end font-medium">
                                  {occ.price ? occ.price.toLocaleString(dateLocale) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-purple-50 dark:bg-purple-950/40 border-t border-purple-200 dark:border-purple-900">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 font-semibold text-purple-800 dark:text-purple-400">{tc.totalLabel}</td>
                              <td className="px-3 py-2 text-end font-bold text-purple-900 dark:text-purple-300">
                                {t.dashboard.requestsList.sar} {selectedRequest.quotedPrice.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* For one-time requests - show simple view */
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-purple-600 dark:text-purple-400">{tc.offeredPrice}</p>
                        <p className="font-bold text-lg">{t.dashboard.requestsList.sar} {selectedRequest.quotedPrice.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}</p>
                      </div>
                      {selectedRequest.quotedDate && (
                        <div>
                          <p className="text-purple-600 dark:text-purple-400">{tc.scheduledDateLabel}</p>
                          <p className="font-semibold">{formatDateUtil(selectedRequest.quotedDate, locale)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.quotedNotes && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900">
                      <p className="text-purple-600 dark:text-purple-400 text-sm mb-1">{tc.notesFromContractorLabel}</p>
                      <p className="text-sm text-purple-900 dark:text-purple-300 whitespace-pre-wrap">{selectedRequest.quotedNotes}</p>
                    </div>
                  )}
                  {selectedRequest.quotationUrl && (
                    <div className="mt-2">
                      <a
                        href={selectedRequest.quotationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-800 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 underline"
                      >
                        <FileText className="h-4 w-4" />
                        {selectedRequest.quotationFileName || tc.viewQuotation}
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        openQuoteResponseDialog(selectedRequest)
                        setSelectedRequest(null)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="me-2 h-4 w-4" />
                      {tc.acceptQuoteBtn}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        openQuoteResponseDialog(selectedRequest)
                        setSelectedRequest(null)
                      }}
                      className="border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <ThumbsDown className="me-2 h-4 w-4" />
                      {tc.rejectQuoteBtn}
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {selectedRequest.status === 'REQUESTED' && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      {tc.waitingContractorReview}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">{tc.needUrgentTitle}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                      {tc.needUrgentDesc}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        openStartImmediatelyDialog(selectedRequest)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="me-2 h-4 w-4" />
                      {tc.startNowBtn}
                    </Button>
                  </div>
                </div>
              )}
              {selectedRequest.status === 'SCHEDULED' && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    {tc.scheduledStatusMsg}
                  </p>
                </div>
              )}
              {selectedRequest.status === 'IN_PROGRESS' && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    {tc.inProgressStatusMsg}
                  </p>
                </div>
              )}
              {selectedRequest.status === 'COMPLETED' && (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 p-3 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    {tc.completedStatusMsg}
                  </p>
                </div>
              )}

              {/* Comments Section */}
              <div className="pt-4 border-t">
                <RequestComments
                  branchId={branchId}
                  requestId={selectedRequest.id}
                  currentUserId={userId || ''}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedRequest?.status === 'REQUESTED' && selectedRequest?.createdByRole === 'CLIENT' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
              >
                {tc.cancelRequestBtn}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              {tc.closeBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.cancelRequestTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc.cancelRequestDesc}
              {selectedRequest && (
                <span className="block mt-2 font-medium text-foreground">
                  &quot;{selectedRequest.title}&quot;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{tc.keepRequestBtn}</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault()
                if (!selectedRequest) return
                setCancelling(true)
                try {
                  await fetch(`/api/branches/${branchId}/requests/${selectedRequest.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'CANCELLED' }),
                  })
                  setCancelDialogOpen(false)
                  setSelectedRequest(null)
                  fetchRequests()
                } catch (err) {
                  console.error('Failed to cancel request:', err)
                } finally {
                  setCancelling(false)
                }
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {tc.cancelling}
                </>
              ) : (
                tc.yesCancelRequest
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quote Response Dialog - For clients to accept or reject quotes */}
      <Dialog open={quoteResponseDialogOpen} onOpenChange={(open) => { if (!open) { setQuoteResponseDialogOpen(false); setQuoteResponseRequest(null); setShowRejectionForm(false); setRejectionReason(''); setError(''); } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tc.reviewQuoteTitle}</DialogTitle>
            <DialogDescription>
              {tc.reviewQuoteDesc}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              <LocalizedError message={error} />
            </div>
          )}

          {quoteResponseRequest && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">{quoteResponseRequest.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(quoteResponseRequest.priority)}
                  {quoteResponseRequest.workOrderType && (
                    <Badge variant="secondary">{formatWorkOrderType(quoteResponseRequest.workOrderType)}</Badge>
                  )}
                  {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE' && (
                    <Badge variant="outline">{quoteResponseRequest.recurringType === 'MONTHLY' ? tc.monthly : tc.quarterly}</Badge>
                  )}
                </div>
                {quoteResponseRequest.description && (
                  <p className="text-sm text-muted-foreground">{quoteResponseRequest.description}</p>
                )}
              </div>

              {/* Quote Details */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-lg space-y-3">
                <h4 className="font-semibold text-purple-800 dark:text-purple-400">{tc.contractorQuoteHeading}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                      {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE'
                        ? tc.totalPriceLabel
                        : tc.priceLabel}
                    </p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-400">
                      {t.dashboard.requestsList.sar} {quoteResponseRequest.quotedPrice?.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                      {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE'
                        ? tc.firstScheduledDateLabel
                        : tc.scheduledDateLabel}
                    </p>
                    <p className="text-lg font-semibold text-purple-800 dark:text-purple-400">
                      {quoteResponseRequest.quotedDate ? formatDateUtil(quoteResponseRequest.quotedDate, locale) : tc.pendingSchedule}
                    </p>
                  </div>
                </div>
                {quoteResponseRequest.assignedTo && (
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">{tc.assignedTechnicianLabel}</p>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-400">
                      {quoteResponseRequest.assignedToUser?.name || quoteResponseRequest.assignedToUser?.email || tc.assignedFallback}
                    </p>
                  </div>
                )}
                {quoteResponseRequest.quotedNotes && (
                  <div className="pt-3 border-t border-purple-200 dark:border-purple-900">
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">{tc.notesFromContractorLabel}</p>
                    <p className="text-sm text-purple-900 dark:text-purple-300 whitespace-pre-wrap">{quoteResponseRequest.quotedNotes}</p>
                  </div>
                )}
                {quoteResponseRequest.quotationUrl && (
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">{tc.quotationDocumentLabel}</p>
                    <a
                      href={quoteResponseRequest.quotationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-800 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 underline"
                    >
                      <FileText className="h-4 w-4" />
                      {quoteResponseRequest.quotationFileName || tc.viewQuotation}
                    </a>
                  </div>
                )}
              </div>

              {/* Recurring Work Orders Tree */}
              {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE' && quoteResponseRequest.quotedDate && quoteResponseRequest.quotedPrice && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <h5 className="font-medium text-blue-800 dark:text-blue-400 mb-3">
                    {tc.workOrdersParens.replace('{freq}', quoteResponseRequest.recurringType === 'MONTHLY' ? tc.monthly :
                      quoteResponseRequest.recurringType === 'QUARTERLY' ? tc.quarterly : tc.semiAnnual)}
                  </h5>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      // Use occurrences data if available (new format)
                      if (quoteResponseRequest.occurrences && quoteResponseRequest.occurrences.length > 0) {
                        return (
                          <>
                            {quoteResponseRequest.occurrences.map((occ, idx) => (
                              <div key={idx} className="flex justify-between items-center py-1 border-b border-blue-100 dark:border-blue-900 last:border-0">
                                <span className="text-blue-700 dark:text-blue-400">
                                  └ #{occ.order}: {occ.visitDate ? formatDateUtil(occ.visitDate, locale) : tc.pendingSchedule}
                                </span>
                                <span className="font-medium text-blue-800 dark:text-blue-400">
                                  {occ.price ? `${t.dashboard.requestsList.sar} ${occ.price.toLocaleString(dateLocale)}` : '-'}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-blue-300 dark:border-blue-800 font-semibold">
                              <span className="text-blue-800 dark:text-blue-400">{tc.workOrderTotalLabel.replace('{count}', String(quoteResponseRequest.occurrences.length))}</span>
                              <span className="text-blue-900 dark:text-blue-300 text-lg">{t.dashboard.requestsList.sar} {quoteResponseRequest.quotedPrice?.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        )
                      }

                      // Fallback: Calculate dates for old requests without occurrences
                      const startDate = new Date(quoteResponseRequest.quotedDate!)
                      const interval = quoteResponseRequest.recurringType === 'MONTHLY' ? 1 :
                        quoteResponseRequest.recurringType === 'QUARTERLY' ? 3 : 6
                      const occurrenceCount = quoteResponseRequest.recurringType === 'MONTHLY' ? 12 :
                        quoteResponseRequest.recurringType === 'QUARTERLY' ? 4 : 2
                      const pricePerOccurrence = (quoteResponseRequest.quotedPrice || 0) / occurrenceCount
                      const dates = []
                      for (let i = 0; i < occurrenceCount; i++) {
                        const date = new Date(startDate)
                        date.setMonth(date.getMonth() + (i * interval))
                        dates.push(date)
                      }
                      return (
                        <>
                          {dates.map((date, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-blue-100 dark:border-blue-900 last:border-0">
                              <span className="text-blue-700 dark:text-blue-400">
                                └ #{idx + 1}: {formatDateUtil(date, locale)}
                              </span>
                              <span className="font-medium text-blue-800 dark:text-blue-400">{t.dashboard.requestsList.sar} {pricePerOccurrence.toLocaleString(dateLocale)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-3 mt-2 border-t border-blue-300 dark:border-blue-800 font-semibold">
                            <span className="text-blue-800 dark:text-blue-400">{tc.workOrderTotalLabel.replace('{count}', String(dates.length))}</span>
                            <span className="text-blue-900 dark:text-blue-300 text-lg">{t.dashboard.requestsList.sar} {quoteResponseRequest.quotedPrice?.toLocaleString(dateLocale, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Rejection Form */}
              {showRejectionForm ? (
                <div className="space-y-3">
                  <Label htmlFor="rejectionReason">{tc.rejectionReasonLabel}</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={tc.rejectionReasonPlaceholder}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectionForm(false)}
                      className="flex-1"
                    >
                      {tc.backBtn}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectQuote}
                      disabled={respondingToQuote}
                      className="flex-1"
                    >
                      {respondingToQuote && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      <ThumbsDown className="me-2 h-4 w-4" />
                      {tc.confirmRejectionBtn}
                    </Button>
                  </div>
                </div>
              ) : showSignatureForm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      <strong>{tc.signToAcceptTitle}</strong> - {tc.signToAcceptDesc}
                      {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE'
                        ? ` ${tc.willCreateWorkOrders
                            .replace('{count}', recurringCountAndFreq(quoteResponseRequest.recurringType).count)
                            .replace('{freq}', recurringCountAndFreq(quoteResponseRequest.recurringType).freq)}`
                        : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      {tc.yourSignatureLabel}
                    </Label>
                    <div className="border rounded-lg p-2 bg-white">
                      <SignaturePad
                        onSignatureChange={(sig) => setClientSignature(sig)}
                        width={380}
                        height={120}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSignatureForm(false)
                        setClientSignature(null)
                      }}
                      className="flex-1"
                    >
                      {tc.backBtn}
                    </Button>
                    <Button
                      onClick={handleAcceptQuote}
                      disabled={respondingToQuote || !clientSignature}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {respondingToQuote && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="me-2 h-4 w-4" />
                      {tc.confirmAndAcceptBtn}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-400">
                      <strong>{tc.whatHappensNextTitle}</strong>{' '}
                      {quoteResponseRequest.recurringType && quoteResponseRequest.recurringType !== 'ONCE'
                        ? tc.whatHappensNextAcceptRecurring
                            .replace('{count}', recurringCountAndFreq(quoteResponseRequest.recurringType).count)
                            .replace('{freq}', recurringCountAndFreq(quoteResponseRequest.recurringType).freq)
                        : tc.whatHappensNextAcceptOnce}
                      {' '}{tc.whatHappensNextRejectNote}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectionForm(true)}
                      className="flex-1"
                    >
                      <ThumbsDown className="me-2 h-4 w-4" />
                      {tc.rejectBtn}
                    </Button>
                    <Button
                      onClick={() => setShowSignatureForm(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <PenTool className="me-2 h-4 w-4" />
                      {tc.acceptAndSignBtn}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start Immediately Dialog - Skip quotation and create work order */}
      <Dialog open={startImmediatelyDialogOpen} onOpenChange={(open) => { if (!open) { setStartImmediatelyDialogOpen(false); setStartImmediatelyRequest(null); setStartImmediatelyDate(''); setError(''); setSelectedRequest(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{tc.startWorkNowTitle}</DialogTitle>
            <DialogDescription>
              {tc.startWorkNowDesc}
            </DialogDescription>
          </DialogHeader>

          {startImmediatelyRequest && (
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  <LocalizedError message={error} />
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold mb-2">
                  {tc.warningLabel}
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 ms-4 list-disc">
                  <li><strong>{tc.warningCreateToday.replace('{date}', formatDateUtil(new Date(), locale))}</strong></li>
                  <li>{tc.warningMoveInProgress}</li>
                  <li>{tc.warningSkipQuote}</li>
                  {startImmediatelyRequest.recurringType && startImmediatelyRequest.recurringType !== 'ONCE' && (
                    <li>{tc.warningCreateRecurring
                      .replace('{count}', recurringCountAndFreq(startImmediatelyRequest.recurringType).count)
                      .replace('{freq}', recurringCountAndFreq(startImmediatelyRequest.recurringType).freq)}</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{tc.requestLabel}</strong> {startImmediatelyRequest.title}
                </p>
                {startImmediatelyRequest.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {startImmediatelyRequest.description}
                  </p>
                )}
              </div>

              <input type="hidden" value={startImmediatelyDate} />

              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>{tc.whatHappensNextTitle}</strong>
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                  <li>{tc.whatHappensNextStart1}</li>
                  <li>{tc.whatHappensNextStart2}</li>
                  <li>{tc.whatHappensNextStart3}</li>
                  <li>{tc.whatHappensNextStart4}</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartImmediatelyDialogOpen(false)
                    setStartImmediatelyRequest(null)
                    setStartImmediatelyDate('')
                  }}
                  className="flex-1"
                  disabled={startingImmediately}
                >
                  {tc.cancelBtn}
                </Button>
                <Button
                  onClick={handleStartImmediately}
                  disabled={startingImmediately || !startImmediatelyDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {startingImmediately ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {tc.creatingText}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="me-2 h-4 w-4" />
                      {tc.createWorkOrderBtn}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
