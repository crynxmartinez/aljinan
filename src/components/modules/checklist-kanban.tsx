'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ClipboardList,
  Calendar,
  CalendarClock,
  Clock,
  CheckCircle,
  FileText,
  User,
  Send,
  Loader2,
  GripVertical,
  XCircle,
  Image as ImageIcon,
  PenTool,
  ClipboardCheck,
  Award,
  Tag,
  Check,
  Archive,
  Printer,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ColumnDetailModal } from './column-detail-modal'
import { SignatureDialog } from '@/components/ui/signature-dialog'
import { PriceDialog } from '@/components/ui/price-dialog'
import { TechnicianDetailsModal } from '@/components/ui/technician-details-modal'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { api } from '@/lib/api-client'
import { useTranslation } from '@/lib/i18n/use-translation'
import {
  ServiceReportData,
  MaintenanceReportData,
  InstallationReportData,
  InspectionReportData,
  getEmptyReportData,
} from '@/types/reports'

type AnyReportData = ServiceReportData | MaintenanceReportData | InstallationReportData | InspectionReportData | null

type ChecklistItemStage = 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED' | 'ARCHIVED'
type ChecklistItemType = 'SCHEDULED' | 'ADHOC'

interface InspectionPhoto {
  id: string
  url: string
  caption: string | null
  photoType: string
}

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  location: string | null
  dateAdded: string | null
  expectedExpiry: string | null
  lastInspected: string | null
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NEEDS_ATTENTION'
  inspectionResult: 'PASS' | 'FAIL' | 'NEEDS_REPAIR' | 'PENDING'
  isInspected: boolean
  certificateIssued: boolean
  stickerApplied: boolean
  notes: string | null
  deficiencies: string | null
  certificateId?: string | null
}

interface ChecklistItem {
  id: string
  description: string
  notes: string | null
  stage: ChecklistItemStage
  type: ChecklistItemType
  scheduledDate: string | null
  price: number | null
  isCompleted: boolean
  checklistId: string
  checklistTitle: string
  projectTitle: string | null
  deletedAt: string | null
  deletedBy: string | null
  deletedReason: string | null
  // Contract fields
  contractSystemId?: string | null
  contractTitle?: string | null
  visitIndex?: number | null
  paymentDueDate?: string | null
  // Inspection fields
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION' | 'OTHER' | null
  workOrderNumber?: number | null
  linkedRequestId?: string | null
  inspectionDate?: string | null

  // Report Fields - Universal
  problemScope?: string | null
  findings?: string | null
  actionTaken?: string | null
  systemStatus?: 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL' | null
  technicianNotes?: string | null

  // Report Fields - SERVICE
  partsReplaced?: string | null

  // Report Fields - INSTALLATION
  equipmentInstalled?: string | null
  installQuantity?: string | null
  completionStatus?: 'COMPLETED' | 'PARTIAL' | 'PENDING' | null

  // Report Fields - INSPECTION
  areasInspected?: string | null
  systemsChecked?: string | null
  deficiencies?: string | null
  recommendations?: string | null
  inspectionResult?: 'PASSED' | 'FAILED' | 'ATTENTION_REQUIRED' | null

  // Report Fields - MAINTENANCE
  systemsMaintained?: string | null
  maintenancePerformed?: string | null
  partsServiced?: string | null
  testResult?: 'PASSED' | 'FAILED' | 'PARTIAL' | null
  nextMaintenanceDate?: string | null

  // Signatures
  technicianSignature?: string | null
  technicianSignedAt?: string | null
  supervisorSignature?: string | null
  supervisorSignedAt?: string | null
  clientSignature?: string | null
  clientSignedAt?: string | null
  reportGeneratedAt?: string | null
  reportUrl?: string | null
  reportData?: Record<string, unknown> | null
  photos?: InspectionPhoto[]
  certificateId?: string | null
  assignedTo?: string | null
  equipment?: Equipment[]
}

interface ChecklistKanbanProps {
  branchId: string
  readOnly?: boolean // For client view
  userRole?: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

const STAGES: { id: ChecklistItemStage; label: string; color: string; bgColor: string; icon: typeof Clock }[] = [
  { id: 'SCHEDULED', label: 'مجدول', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Calendar },
  { id: 'IN_PROGRESS', label: 'قيد التنفيذ', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: Clock },
  { id: 'FOR_REVIEW', label: 'للمراجعة', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: FileText },
  { id: 'COMPLETED', label: 'مكتمل', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
  { id: 'ARCHIVED', label: 'مؤرشف', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-300', icon: Archive },
]

// Allowed stage transitions
// Contractor: SCHEDULED → IN_PROGRESS → FOR_REVIEW
// Client: FOR_REVIEW → COMPLETED or FOR_REVIEW → IN_PROGRESS (reject)
// ARCHIVED can be restored to any stage by contractor
const ALLOWED_TRANSITIONS: Record<ChecklistItemStage, { contractor: ChecklistItemStage[]; client: ChecklistItemStage[] }> = {
  'SCHEDULED': { contractor: ['IN_PROGRESS'], client: [] },
  'IN_PROGRESS': { contractor: ['FOR_REVIEW'], client: [] },
  'FOR_REVIEW': { contractor: [], client: ['COMPLETED', 'IN_PROGRESS'] },
  'COMPLETED': { contractor: [], client: [] },
  'ARCHIVED': { contractor: ['SCHEDULED', 'IN_PROGRESS', 'FOR_REVIEW', 'COMPLETED'], client: [] }, // Can restore to any stage
}

function canTransition(from: ChecklistItemStage, to: ChecklistItemStage, isClient: boolean, item?: ChecklistItem): boolean {
  const allowed = isClient
    ? ALLOWED_TRANSITIONS[from].client
    : ALLOWED_TRANSITIONS[from].contractor

  // Can't move to FOR_REVIEW if price is null (contractor must add price first)
  if (to === 'FOR_REVIEW' && item && item.price === null) {
    return false
  }

  // Can't move to COMPLETED if price is null (must have price before completing)
  if (to === 'COMPLETED' && item && item.price === null) {
    return false
  }

  return allowed.includes(to)
}

// Draggable card component
function DraggableCard({
  item,
  onClick,
  disabled,
  assigneeName,
  clickable = true,
}: {
  item: ChecklistItem
  onClick: () => void
  disabled: boolean
  assigneeName?: string | null
  clickable?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled,
  })

  const priority = getDatePriority(item.scheduledDate, item.stage)
  const daysOverdue = getDaysOverdue(item.scheduledDate)

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const priorityStyles: Record<DatePriority, string> = {
    'overdue': 'border-red-500 border-2 bg-red-50',
    'due-today': 'border-orange-500 border-2 bg-orange-50',
    'due-soon': 'border-yellow-500 border-2 bg-yellow-50',
    'normal': 'border bg-white',
  }

  // Special styling for archived items
  const isArchived = item.stage === 'ARCHIVED'

  // Check acceptance status for FOR_REVIEW items
  const hasClientAcceptance = item.clientSignature
  const hasSupervisorAcceptance = item.supervisorSignature
  const isInReview = item.stage === 'FOR_REVIEW'
  const bothAccepted = hasClientAcceptance && hasSupervisorAcceptance
  const hasNoPrice = item.price === null

  // Determine card styling based on acceptance and price
  let cardStyle = isArchived ? 'border border-gray-300 bg-gray-100 opacity-75' : priorityStyles[priority]

  // Orange border for FOR_REVIEW cards without price (blocking completion)
  if (isInReview && hasNoPrice) {
    cardStyle = 'border-2 border-orange-500 bg-orange-50'
  } else if (isInReview && bothAccepted) {
    cardStyle = 'border-2 border-green-500 bg-green-50'
  } else if (isInReview && (hasClientAcceptance || hasSupervisorAcceptance)) {
    cardStyle = 'border-2 border-blue-500 bg-blue-50'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow',
        clickable ? 'cursor-pointer' : 'cursor-default',
        cardStyle,
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {!disabled && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ms-1 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {item.workOrderNumber && (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground mb-1 inline-block">
              أمر-{String(item.workOrderNumber).padStart(4, '0')}
            </span>
          )}
          <p className="font-medium text-sm line-clamp-2 mb-2">
            {item.description}
          </p>

          {/* Priority badges */}
          {priority === 'overdue' && (
            <Badge variant="destructive" className="text-xs mb-2">
              متأخر {Math.abs(daysOverdue)} يوم
            </Badge>
          )}
          {priority === 'due-today' && (
            <Badge className="text-xs mb-2 bg-orange-500">
              مستحق اليوم
            </Badge>
          )}
          {priority === 'due-soon' && (
            <Badge className="text-xs mb-2 bg-yellow-500 text-yellow-900">
              مستحق خلال {daysOverdue} يوم
            </Badge>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1 flex-wrap">
              {isArchived ? (
                <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 bg-gray-200">
                  <Archive className="h-3 w-3 me-1" />
                  مؤرشف
                </Badge>
              ) : item.type === 'ADHOC' ? (
                <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                  مؤقت
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                  مجدول
                </Badge>
              )}
              {!isArchived && item.price === null && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                  بانتظار السعر
                </Badge>
              )}
            </div>

            {!isArchived && item.scheduledDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.scheduledDate)}
              </div>
            )}

            {isArchived && item.deletedAt && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDate(item.deletedAt)}
              </div>
            )}
          </div>

          {item.price && (
            <div className="mt-2 text-xs font-medium text-green-700">
              {formatCurrency(item.price)}
            </div>
          )}

          {item.projectTitle && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              {item.projectTitle}
            </div>
          )}

          {/* Contract Work Order badge */}
          {item.contractTitle && (
            <div className="mt-2 space-y-1">
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                <ClipboardList className="h-3 w-3 me-1" />
                أمر عمل تعاقدي
              </Badge>
              <div className="text-xs text-purple-600 truncate">{item.contractTitle}</div>
              {item.paymentDueDate && (
                <div className="text-xs text-muted-foreground">
                  استحقاق الدفع: {new Date(item.paymentDueDate).toLocaleDateString('ar-SA')}
                </div>
              )}
            </div>
          )}

          {assigneeName && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{assigneeName}</span>
            </div>
          )}

          {/* Acceptance Status Badges for FOR_REVIEW */}
          {isInReview && (hasClientAcceptance || hasSupervisorAcceptance) && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {hasSupervisorAcceptance && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-100">
                  <CheckCircle className="h-3 w-3 me-1" />
                  المشرف
                </Badge>
              )}
              {hasClientAcceptance && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-100">
                  <CheckCircle className="h-3 w-3 me-1" />
                  العميل
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Droppable column component
function DroppableColumn({
  stage,
  count,
  children,
  isOver,
  onHeaderClick
}: {
  stage: typeof STAGES[number]
  count: number
  children: React.ReactNode
  isOver: boolean
  onHeaderClick: () => void
}) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  })

  const StageIcon = stage.icon

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 rounded-lg border-2 transition-colors',
        stage.bgColor,
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div
        className={cn('p-3 border-b cursor-pointer hover:opacity-80 transition-opacity', stage.bgColor)}
        onClick={onHeaderClick}
      >
        <div className="flex items-center gap-2">
          <StageIcon className={cn('h-4 w-4', stage.color)} />
          <span className={cn('font-semibold text-sm', stage.color)}>
            {stage.label}
          </span>
          <Badge variant="secondary" className="text-xs ms-auto">
            {count}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[400px] p-2">
        <div className="space-y-2">
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

function formatDate(dateString: string | null, locale: 'en' | 'ar' = 'ar') {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return `ر.س ${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}`
}

// Date priority types for visual indicators
type DatePriority = 'overdue' | 'due-today' | 'due-soon' | 'normal'

// Get date priority for a checklist item
function getDatePriority(scheduledDate: string | null, stage: ChecklistItemStage): DatePriority {
  // Only apply to SCHEDULED and IN_PROGRESS stages
  if (!scheduledDate || stage === 'FOR_REVIEW' || stage === 'COMPLETED') {
    return 'normal'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const scheduled = new Date(scheduledDate)
  scheduled.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'due-today'
  if (diffDays <= 3) return 'due-soon'
  return 'normal'
}

// Get days overdue (negative means overdue)
function getDaysOverdue(scheduledDate: string | null): number {
  if (!scheduledDate) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const scheduled = new Date(scheduledDate)
  scheduled.setHours(0, 0, 0, 0)

  return Math.floor((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Sort items by priority (overdue first, then due-today, then due-soon, then by date)
function sortByPriority(items: ChecklistItem[]): ChecklistItem[] {
  return [...items].sort((a, b) => {
    const priorityA = getDatePriority(a.scheduledDate, a.stage)
    const priorityB = getDatePriority(b.scheduledDate, b.stage)

    const priorityOrder: Record<DatePriority, number> = {
      'overdue': 0,
      'due-today': 1,
      'due-soon': 2,
      'normal': 3
    }

    // First sort by priority
    if (priorityOrder[priorityA] !== priorityOrder[priorityB]) {
      return priorityOrder[priorityA] - priorityOrder[priorityB]
    }

    // Then sort by date (earlier first for overdue, later first for normal)
    if (a.scheduledDate && b.scheduledDate) {
      const dateA = new Date(a.scheduledDate).getTime()
      const dateB = new Date(b.scheduledDate).getTime()
      return dateA - dateB
    }

    // Items without dates go last
    if (a.scheduledDate && !b.scheduledDate) return -1
    if (!a.scheduledDate && b.scheduledDate) return 1

    return 0
  })
}

export function ChecklistKanban({ branchId, readOnly = false, userRole }: ChecklistKanbanProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<typeof STAGES[number] | null>(null)
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [confirmMoveDialogOpen, setConfirmMoveDialogOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    itemId: string
    targetStage: ChecklistItemStage
  } | null>(null)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signatureType, setSignatureType] = useState<'technician' | 'supervisor' | 'client' | null>(null)
  const [pendingSignWorkOrderId, setPendingSignWorkOrderId] = useState<string | null>(null)
  const [signerName, setSignerName] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState<string>('')

  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [pendingPriceWorkOrderId, setPendingPriceWorkOrderId] = useState<string | null>(null)

  // Technician details modal state
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false)
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null)

  // Inspection form state
  const [inspectionMode, setInspectionMode] = useState(false)
  const [inspectionData, setInspectionData] = useState({
    inspectionDate: '',
    // Universal fields
    problemScope: '',
    findings: '',
    actionTaken: '',
    systemStatus: '' as '' | 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL',
    technicianNotes: '',
    // SERVICE fields
    partsReplaced: '',
    // INSTALLATION fields
    equipmentInstalled: '',
    installQuantity: '',
    completionStatus: '' as '' | 'COMPLETED' | 'PARTIAL' | 'PENDING',
    // INSPECTION fields
    areasInspected: '',
    systemsChecked: '',
    deficiencies: '',
    recommendations: '',
    inspectionResult: '' as '' | 'PASSED' | 'ATTENTION_REQUIRED' | 'FAILED',
    // MAINTENANCE fields
    systemsMaintained: '',
    maintenancePerformed: '',
    partsServiced: '',
    testResult: '' as '' | 'PASSED' | 'FAILED' | 'PARTIAL',
    nextMaintenanceDate: '',
  })
  const [inspectionPhotos, setInspectionPhotos] = useState<{ url: string; name: string; type: string }[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingInspection, setSavingInspection] = useState(false)

  // Service-type-specific report data
  const [reportData, setReportData] = useState<AnyReportData>(null)

  // Team members for assignment
  const [teamMembers, setTeamMembers] = useState<{ userId: string; user: { name: string | null; email: string }; teamRole: string }[]>([])

  const teamMemberMap: Record<string, string> = {}
  for (const tm of teamMembers) {
    teamMemberMap[tm.userId] = tm.user.name || tm.user.email
  }

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    reason: '',
  })
  const [rescheduling, setRescheduling] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    fetchItems()
    // Fetch team members for both contractors and clients (clients need to see assignee names)
    if (userRole === 'CONTRACTOR' || userRole === 'CLIENT') {
      fetch('/api/team-members')
        .then(r => r.ok ? r.json() : [])
        .then(data => setTeamMembers(data))
        .catch(() => { })
    }

    // Fetch current user name for signature dialog
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(session => {
        if (session?.user?.name) {
          setCurrentUserName(session.user.name)
        }
      })
      .catch(() => { })

    // Auto-refresh every 30 seconds to keep board updated
    const refreshInterval = setInterval(() => {
      fetchItems()
    }, 60000) // 60 seconds

    return () => clearInterval(refreshInterval)
  }, [branchId])

  async function fetchItems() {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch checklist items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignPersonnel(workOrderId: string, userId: string | null) {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_personnel',
          workOrderId,
          assignedTo: userId,
        }),
      })
      if (response.ok) {
        setItems(prev => prev.map(item =>
          item.id === workOrderId ? { ...item, assignedTo: userId } : item
        ))
        if (selectedItem?.id === workOrderId) {
          setSelectedItem(prev => prev ? { ...prev, assignedTo: userId } : prev)
        }
      }
    } catch (error) {
      console.error('Failed to assign personnel:', error)
    }
  }

  const getItemsByStage = (stage: ChecklistItemStage) => {
    const stageItems = items.filter(item => item.stage === stage)
    return sortByPriority(stageItems)
  }

  const handleColumnHeaderClick = (stage: typeof STAGES[number]) => {
    setSelectedStage(stage)
    setColumnModalOpen(true)
  }

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item)
    // Pre-populate inspection data if exists
    setInspectionData({
      inspectionDate: item.inspectionDate ? new Date(item.inspectionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Universal fields
      problemScope: item.problemScope || '',
      findings: item.findings || '',
      actionTaken: item.actionTaken || '',
      systemStatus: (item.systemStatus as '' | 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL') || '',
      technicianNotes: item.technicianNotes || '',
      // SERVICE fields
      partsReplaced: item.partsReplaced || '',
      // INSTALLATION fields
      equipmentInstalled: item.equipmentInstalled || '',
      installQuantity: item.installQuantity || '',
      completionStatus: (item.completionStatus as '' | 'COMPLETED' | 'PARTIAL' | 'PENDING') || '',
      // INSPECTION fields
      areasInspected: item.areasInspected || '',
      systemsChecked: item.systemsChecked || '',
      deficiencies: item.deficiencies || '',
      recommendations: item.recommendations || '',
      inspectionResult: (item.inspectionResult ?? '') as '' | 'PASSED' | 'ATTENTION_REQUIRED' | 'FAILED',
      // MAINTENANCE fields
      systemsMaintained: item.systemsMaintained || '',
      maintenancePerformed: item.maintenancePerformed || '',
      partsServiced: item.partsServiced || '',
      testResult: (item.testResult as '' | 'PASSED' | 'FAILED' | 'PARTIAL') || '',
      nextMaintenanceDate: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0] : '',
    })
    setInspectionPhotos(item.photos?.map(p => ({ url: p.url, name: p.caption || 'Photo', type: p.photoType })) || [])

    // Initialize service-type-specific report data
    if (item.reportData) {
      setReportData(item.reportData as unknown as AnyReportData)
    } else {
      setReportData(getEmptyReportData(item.workOrderType))
    }

    setInspectionMode(false)
    setDetailsOpen(true)
  }

  // Photo upload handler
  const handleInspectionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'photo')
        formData.append('folder', 'inspection-photos')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setInspectionPhotos(prev => [...prev, { url: data.url, name: file.name, type: photoType }])
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removeInspectionPhoto = (url: string) => {
    setInspectionPhotos(prev => prev.filter(p => p.url !== url))
  }

  // Save inspection/report data
  const handleSaveInspection = async () => {
    if (!selectedItem) return
    setSavingInspection(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_inspection',
          workOrderId: selectedItem.id,
          ...inspectionData,
          reportData: reportData,
          photoUrls: inspectionPhotos.map(p => ({ url: p.url, type: p.type })),
        }),
      })

      if (response.ok) {
        toast.success(t.toasts.reportSaved)
        fetchItems()
        setInspectionMode(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save report:', error)
      toast.error(t.toasts.reportSaveFailed)
    } finally {
      setSavingInspection(false)
    }
  }

  // Technician sign (for inspection)
  const handleTechnicianSign = async (signature: string) => {
    if (!pendingSignWorkOrderId) return
    setUpdating(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'technician_sign',
          workOrderId: pendingSignWorkOrderId,
          signature
        }),
      })

      if (response.ok) {
        toast.success(t.toasts.inspectionSigned)
        fetchItems()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sign inspection')
        throw new Error(error.error)
      }
    } catch (error) {
      toast.error(t.toasts.inspectionSignFailed)
      throw error
    } finally {
      setUpdating(false)
      setPendingSignWorkOrderId(null)
    }
  }

  // Supervisor sign
  const handleSupervisorSign = async (signature: string) => {
    if (!selectedItem) return
    setUpdating(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'supervisor_sign',
          workOrderId: selectedItem.id,
          signature
        }),
      })

      if (response.ok) {
        toast.success(t.toasts.signedBySupervisor)
        fetchItems()
        const updatedItems = await api.get<never[]>(`/api/branches/${branchId}/checklist-items`)
        const updated = updatedItems.find((i: ChecklistItem) => i.id === selectedItem.id)
        if (updated) setSelectedItem(updated)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sign')
        throw new Error(error.error)
      }
    } catch (error) {
      toast.error(t.toasts.signFailed)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // Client sign (accepting completed work)
  const handleClientSign = async (signature: string) => {
    if (!selectedItem) return
    setUpdating(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'client_sign',
          workOrderId: selectedItem.id,
          signature
        }),
      })

      if (response.ok) {
        toast.success(t.toasts.signedByClient)

        // If there's a pending move (from drag-and-drop), complete it now
        if (pendingMove && pendingMove.targetStage === 'COMPLETED') {
          const completeResponse = await fetch(`/api/branches/${branchId}/checklist-items`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_stage',
              itemId: selectedItem.id,
              stage: 'COMPLETED'
            })
          })

          if (completeResponse.ok) {
            toast.success(t.toasts.workOrderCompleted)
            setPendingMove(null)
          }
        }

        fetchItems()
        const updatedItems = await api.get<never[]>(`/api/branches/${branchId}/checklist-items`)
        const updated = updatedItems.find((i: ChecklistItem) => i.id === selectedItem.id)
        if (updated) setSelectedItem(updated)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sign')
        throw new Error(error.error)
      }
    } catch (error) {
      toast.error(t.toasts.signFailed)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // Update work order price
  const handlePriceUpdate = async (itemId: string, price: number) => {
    setUpdating(true)

    try {
      const item = items.find(i => i.id === itemId)
      if (!item) return

      // Update the work order price using checklist-items API
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_price',
          itemId: itemId,
          price: price
        })
      })

      if (response.ok) {
        toast.success(t.toasts.priceUpdated)
        fetchItems()
        const updatedItems = await api.get<never[]>(`/api/branches/${branchId}/checklist-items`)
        const updated = updatedItems.find((i: ChecklistItem) => i.id === itemId)
        if (updated) setSelectedItem(updated)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update price')
      }
    } catch (error) {
      console.error('Failed to update price:', error)
      toast.error(t.toasts.priceUpdateFailed)
    } finally {
      setUpdating(false)
    }
  }

  // Restore archived work order to a specific stage
  const handleStageChange = async (newStage: ChecklistItemStage) => {
    if (!selectedItem) return
    setUpdating(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          itemId: selectedItem.id,
          stage: newStage,
        }),
      })

      if (response.ok) {
        fetchItems()
        setDetailsOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to restore work order:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Handle reschedule work order
  const handleReschedule = async () => {
    if (!selectedItem || !rescheduleData.newDate) return
    setRescheduling(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          itemId: selectedItem.id,
          newDate: rescheduleData.newDate,
          reason: rescheduleData.reason || null,
        }),
      })

      if (response.ok) {
        toast.success(t.toasts.rescheduled)
        fetchItems()
        setRescheduleDialogOpen(false)
        setRescheduleData({ newDate: '', reason: '' })
        setDetailsOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || (t.toasts?.rescheduleFailed || 'فشل في إعادة الجدولة'))
      }
    } catch {
      toast.error(t.toasts.rescheduleFailed)
    } finally {
      setRescheduling(false)
    }
  }

  // Handle confirmation of drag-to-complete - open signature dialog instead of auto-completing
  const handleConfirmMove = () => {
    if (!pendingMove || !selectedItem) return

    // Close confirmation dialog and open signature dialog
    setConfirmMoveDialogOpen(false)
    setSignatureDialogOpen(true)
    setSignatureType('client')
    // pendingMove and selectedItem are already set, signature dialog will handle the completion
  }

  const handleSendToReview = async (itemId: string) => {
    if (readOnly) return

    // Find the item
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const targetStage = 'FOR_REVIEW'

    // Check if already in target stage
    if (item.stage === targetStage) return

    // Check if transition is allowed
    const isClient = userRole === 'CLIENT'
    if (!canTransition(item.stage, targetStage, isClient, item)) {
      if (targetStage === 'FOR_REVIEW' && item.price === null) {
        toast.error(t.toasts.priceRequiredForReview)
      }
      return
    }

    // Optimistically update UI
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, stage: targetStage } : i
    ))

    // Close the details modal
    setDetailsOpen(false)

    // Update on server using checklist-items API
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          itemId: itemId,
          stage: targetStage
        })
      })

      if (!response.ok) {
        // Revert on error
        fetchItems()
        toast.error(t.toasts.sendToReviewFailed)
      } else {
        toast.success(t.toasts.sentToReview)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update stage:', error)
      fetchItems()
      toast.error(t.toasts.sendToReviewFailed)
    }
  }

  // DnD event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const itemId = active.id as string
    const targetStage = over.id as ChecklistItemStage

    // Find the item being dragged
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // Check if dropping on the same stage
    if (item.stage === targetStage) return

    // Check if transition is allowed
    const isClient = userRole === 'CLIENT' // Use actual userRole prop
    if (!canTransition(item.stage, targetStage, isClient, item)) {
      // Show specific message if trying to move without price
      if (targetStage === 'FOR_REVIEW' && item.price === null) {
        toast.error(t.toasts.priceRequiredForReview)
      } else if (targetStage === 'COMPLETED' && item.price === null) {
        toast.error(t.toasts.priceRequiredToComplete)
      } else {
        console.log(`Transition from ${item.stage} to ${targetStage} not allowed for ${isClient ? 'client' : 'contractor'}`)
      }
      return
    }

    // If client is moving FOR_REVIEW → COMPLETED, show confirmation modal
    if (isClient && item.stage === 'FOR_REVIEW' && targetStage === 'COMPLETED') {
      setPendingMove({ itemId, targetStage })
      setSelectedItem(item)
      setConfirmMoveDialogOpen(true)
      return // Don't proceed with move yet
    }

    // No validation needed for FOR_REVIEW - client can review and reject if needed

    // Optimistically update UI
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, stage: targetStage } : i
    ))

    // Update on server using checklist-items API
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          itemId: itemId,
          stage: targetStage
        })
      })

      if (!response.ok) {
        // Revert on error
        fetchItems()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update stage:', error)
      fetchItems()
    }
  }

  // Get the active item for drag overlay
  const activeItem = activeId ? items.find(i => i.id === activeId) : null

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Work Orders
              </CardTitle>
              <CardDescription>
                عرض كانبان لجميع أوامر العمل المعتمدة
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} عنصر
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">لا توجد أوامر عمل بعد</p>
              <p className="text-sm text-muted-foreground">
                ستظهر أوامر العمل هنا بعد الموافقة على التسعيرات
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map((stage) => {
                  const stageItems = getItemsByStage(stage.id)

                  return (
                    <DroppableColumn
                      key={stage.id}
                      stage={stage}
                      count={stageItems.length}
                      isOver={overId === stage.id}
                      onHeaderClick={() => handleColumnHeaderClick(stage)}
                    >
                      {stageItems.map((item) => {
                        // Determine if this item can be dragged by current user
                        const isClient = userRole === 'CLIENT'
                        const allowedMoves = isClient
                          ? ALLOWED_TRANSITIONS[item.stage].client
                          : ALLOWED_TRANSITIONS[item.stage].contractor
                        const canDrag = allowedMoves.length > 0

                        // For clients, allow clicking cards in FOR_REVIEW, COMPLETED, and ARCHIVED stages
                        const canClick = isClient ? (item.stage === 'FOR_REVIEW' || item.stage === 'COMPLETED' || item.stage === 'ARCHIVED') : true

                        return (
                          <DraggableCard
                            key={item.id}
                            item={item}
                            onClick={() => canClick && handleItemClick(item)}
                            disabled={!canDrag}
                            clickable={canClick}
                            assigneeName={item.assignedTo ? teamMemberMap[item.assignedTo] || null : null}
                          />
                        )
                      })}

                      {stageItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          لا توجد عناصر
                        </div>
                      )}
                    </DroppableColumn>
                  )
                })}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeItem && (
                  <div className="bg-white rounded-lg border-2 border-primary p-3 shadow-xl opacity-90 w-64">
                    <p className="font-medium text-sm line-clamp-2">
                      {activeItem.description}
                    </p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(open) => { if (!open) { setDetailsOpen(false); setInspectionMode(false); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Work Order Details
            </DialogTitle>
            <DialogDescription>
              {inspectionMode ? 'Fill in the report details' : 'View and manage this work order'}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedItem.description}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn(
                    STAGES.find(s => s.id === selectedItem.stage)?.bgColor,
                    STAGES.find(s => s.id === selectedItem.stage)?.color
                  )}>
                    {STAGES.find(s => s.id === selectedItem.stage)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {selectedItem.type === 'ADHOC' ? 'مؤقت' : 'مجدول'}
                  </Badge>
                  {selectedItem.workOrderType && (
                    <Badge variant="secondary">
                      {selectedItem.workOrderType === 'SERVICE' ? 'خدمة' :
                        selectedItem.workOrderType === 'INSPECTION' ? 'تفتيش' :
                          selectedItem.workOrderType === 'MAINTENANCE' ? 'صيانة' :
                            selectedItem.workOrderType === 'INSTALLATION' ? 'تركيب' :
                              selectedItem.workOrderType === 'STICKER_INSPECTION' ? 'تفتيش ملصقات' : 'أخرى'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Schedule & Price Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {selectedItem.scheduledDate && (
                  <div>
                    <p className="text-muted-foreground">مجدول</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedItem.scheduledDate).toLocaleDateString('ar-SA')}
                    </p>
                    {/* Reschedule button - only for SCHEDULED stage and contractors */}
                    {!readOnly && userRole !== 'CLIENT' && selectedItem.stage === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRescheduleData({
                            newDate: selectedItem.scheduledDate ? selectedItem.scheduledDate.split('T')[0] : '',
                            reason: '',
                          })
                          setRescheduleDialogOpen(true)
                        }}
                        className="h-7 text-xs mt-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        <CalendarClock className="h-3 w-3 me-1" />
                        Reschedule
                      </Button>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">السعر</p>
                  {selectedItem.price ? (
                    <p className="font-semibold text-green-700">{formatCurrency(selectedItem.price)}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50 w-fit">
                        No Price Set
                      </Badge>
                      {!readOnly && userRole !== 'CLIENT' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingPriceWorkOrderId(selectedItem.id)
                            setPriceDialogOpen(true)
                          }}
                          className="h-7 text-xs w-fit"
                        >
                          Set Price
                        </Button>
                      ) : userRole === 'CLIENT' ? (
                        <p className="text-xs text-muted-foreground italic">
                          بانتظار المقاول لتحديد السعر
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
                {selectedItem.projectTitle && (
                  <div>
                    <p className="text-muted-foreground">المشروع</p>
                    <p className="font-medium">{selectedItem.projectTitle}</p>
                  </div>
                )}
              </div>

              {/* Assigned Personnel */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">الموظفون المعينون</Label>
                {userRole === 'CONTRACTOR' ? (
                  <Select
                    value={selectedItem.assignedTo || 'unassigned'}
                    onValueChange={(value) => handleAssignPersonnel(selectedItem.id, value === 'unassigned' ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="غير معين" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">غير معين</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.user.name || member.user.email} ({member.teamRole.toLowerCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  selectedItem.assignedTo ? (
                    <button
                      onClick={() => {
                        setSelectedTechnicianId(selectedItem.assignedTo!)
                        setTechnicianModalOpen(true)
                      }}
                      className="font-medium flex items-center gap-1 text-primary hover:underline cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      {teamMemberMap[selectedItem.assignedTo] || 'غير معروف'}
                    </button>
                  ) : (
                    <p className="font-medium flex items-center gap-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      Unassigned
                    </p>
                  )
                )}
              </div>

              {/* Report Form (for IN_PROGRESS stage, contractor only) */}
              {!readOnly && selectedItem.stage === 'IN_PROGRESS' && (
                <>
                  {inspectionMode ? (
                    <div className="space-y-4 border-t pt-4">
                      {/* Dynamic Report Form Header */}
                      <h4 className="font-semibold flex items-center gap-2 text-blue-600">
                        <FileText className="h-4 w-4" />
                        {selectedItem.workOrderType === 'SERVICE' ? 'تقرير خدمة' :
                          selectedItem.workOrderType === 'INSTALLATION' ? 'تقرير تركيب' :
                            selectedItem.workOrderType === 'MAINTENANCE' ? 'تقرير صيانة' :
                              selectedItem.workOrderType === 'INSPECTION' ? 'تقرير تفتيش' : 'تقرير عمل'}
                      </h4>

                      {/* Date Field - Universal */}
                      <div className="space-y-2">
                        <Label htmlFor="inspectionDate">التاريخ</Label>
                        <Input
                          id="inspectionDate"
                          type="date"
                          value={inspectionData.inspectionDate}
                          onChange={(e) => setInspectionData({ ...inspectionData, inspectionDate: e.target.value })}
                        />
                      </div>

                      {/* SERVICE Report Fields */}
                      {selectedItem.workOrderType === 'SERVICE' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="problemScope">المشكلة المبلغة</Label>
                            <Textarea
                              id="problemScope"
                              value={inspectionData.problemScope}
                              onChange={(e) => setInspectionData({ ...inspectionData, problemScope: e.target.value })}
                              placeholder="ما هي المشكلة المبلغة..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="findings">النتائج</Label>
                            <Textarea
                              id="findings"
                              value={inspectionData.findings}
                              onChange={(e) => setInspectionData({ ...inspectionData, findings: e.target.value })}
                              placeholder="ما الذي تم اكتشافه..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="actionTaken">الإجراء المتخذ</Label>
                            <Textarea
                              id="actionTaken"
                              value={inspectionData.actionTaken}
                              onChange={(e) => setInspectionData({ ...inspectionData, actionTaken: e.target.value })}
                              placeholder="ما الذي تم عمله لإصلاح المشكلة..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="partsReplaced">القطع المستبدلة</Label>
                            <Input
                              id="partsReplaced"
                              value={inspectionData.partsReplaced}
                              onChange={(e) => setInspectionData({ ...inspectionData, partsReplaced: e.target.value })}
                              placeholder="مثال: 1x كاشف دخان، 2x بطاريات"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>حالة النظام</Label>
                            <div className="flex gap-2">
                              {[
                                { value: 'WORKING', label: '✅ يعمل', color: 'bg-green-100 border-green-500 text-green-700' },
                                { value: 'NEEDS_ATTENTION', label: '⚠️ يحتاج انتباه', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
                                { value: 'CRITICAL', label: '❌ حرج', color: 'bg-red-100 border-red-500 text-red-700' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => setInspectionData({ ...inspectionData, systemStatus: status.value as 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL' })}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${inspectionData.systemStatus === status.value
                                    ? status.color + ' border-2'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* INSTALLATION Report Fields */}
                      {selectedItem.workOrderType === 'INSTALLATION' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="problemScope">نطاق التركيب</Label>
                            <Textarea
                              id="problemScope"
                              value={inspectionData.problemScope}
                              onChange={(e) => setInspectionData({ ...inspectionData, problemScope: e.target.value })}
                              placeholder="ما الذي تم تركيبه..."
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="equipmentInstalled">المعدات المركبة</Label>
                              <Input
                                id="equipmentInstalled"
                                value={inspectionData.equipmentInstalled}
                                onChange={(e) => setInspectionData({ ...inspectionData, equipmentInstalled: e.target.value })}
                                placeholder="مثال: كواشف الدخان، MCPs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="installQuantity">الكمية</Label>
                              <Input
                                id="installQuantity"
                                value={inspectionData.installQuantity}
                                onChange={(e) => setInspectionData({ ...inspectionData, installQuantity: e.target.value })}
                                placeholder="مثال: 12 جهاز"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="findings">نتيجة الاختبار</Label>
                            <Textarea
                              id="findings"
                              value={inspectionData.findings}
                              onChange={(e) => setInspectionData({ ...inspectionData, findings: e.target.value })}
                              placeholder="نتائج الاختبار..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>حالة الإكمال</Label>
                            <div className="flex gap-2">
                              {[
                                { value: 'COMPLETED', label: '✅ مكتمل', color: 'bg-green-100 border-green-500 text-green-700' },
                                { value: 'PARTIAL', label: '⚠️ جزئي', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
                                { value: 'PENDING', label: '⏳ قيد الانتظار', color: 'bg-gray-100 border-gray-500 text-gray-700' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => setInspectionData({ ...inspectionData, completionStatus: status.value as 'COMPLETED' | 'PARTIAL' | 'PENDING' })}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${inspectionData.completionStatus === status.value
                                    ? status.color + ' border-2'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* INSPECTION Report Fields */}
                      {(selectedItem.workOrderType === 'INSPECTION' || selectedItem.workOrderType === 'STICKER_INSPECTION' || !selectedItem.workOrderType || selectedItem.workOrderType === 'OTHER') && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="areasInspected">المناطق المفحوصة</Label>
                              <Input
                                id="areasInspected"
                                value={inspectionData.areasInspected}
                                onChange={(e) => setInspectionData({ ...inspectionData, areasInspected: e.target.value })}
                                placeholder="مثال: الطابق الأرضي، غرفة الكهرباء"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="systemsChecked">الأنظمة المفحوصة</Label>
                              <Input
                                id="systemsChecked"
                                value={inspectionData.systemsChecked}
                                onChange={(e) => setInspectionData({ ...inspectionData, systemsChecked: e.target.value })}
                                placeholder="مثال: إنذار الحريق، مضخة الحريق"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="findings">النتائج</Label>
                            <Textarea
                              id="findings"
                              value={inspectionData.findings}
                              onChange={(e) => setInspectionData({ ...inspectionData, findings: e.target.value })}
                              placeholder="ما الذي تم اكتشافه أثناء التفتيش..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deficiencies">النقائص</Label>
                            <Textarea
                              id="deficiencies"
                              value={inspectionData.deficiencies}
                              onChange={(e) => setInspectionData({ ...inspectionData, deficiencies: e.target.value })}
                              placeholder="المشاكل المكتشفة..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="recommendations">التوصيات</Label>
                            <Textarea
                              id="recommendations"
                              value={inspectionData.recommendations}
                              onChange={(e) => setInspectionData({ ...inspectionData, recommendations: e.target.value })}
                              placeholder="ما الذي يجب عمله..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>نتيجة التفتيش</Label>
                            <div className="flex gap-2">
                              {[
                                { value: 'PASSED', label: '✅ نجح', color: 'bg-green-100 border-green-500 text-green-700' },
                                { value: 'ATTENTION_REQUIRED', label: '⚠️ يحتاج انتباه', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
                                { value: 'FAILED', label: '❌ فشل', color: 'bg-red-100 border-red-500 text-red-700' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => setInspectionData({ ...inspectionData, inspectionResult: status.value as 'PASSED' | 'ATTENTION_REQUIRED' | 'FAILED' })}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${inspectionData.inspectionResult === status.value
                                    ? status.color + ' border-2'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* MAINTENANCE Report Fields */}
                      {selectedItem.workOrderType === 'MAINTENANCE' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="systemsMaintained">الأنظمة التي تمت صيانتها</Label>
                            <Input
                              id="systemsMaintained"
                              value={inspectionData.systemsMaintained}
                              onChange={(e) => setInspectionData({ ...inspectionData, systemsMaintained: e.target.value })}
                              placeholder="مثال: نظام إنذار الحريق، مضخة الحريق"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maintenancePerformed">الصيانة المُنجزة</Label>
                            <Textarea
                              id="maintenancePerformed"
                              value={inspectionData.maintenancePerformed}
                              onChange={(e) => setInspectionData({ ...inspectionData, maintenancePerformed: e.target.value })}
                              placeholder="تنظيف، اختبار، معايرة..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="partsServiced">القطع التي تمت صيانتها</Label>
                            <Input
                              id="partsServiced"
                              value={inspectionData.partsServiced}
                              onChange={(e) => setInspectionData({ ...inspectionData, partsServiced: e.target.value })}
                              placeholder="مثال: كواشف الدخان، اللوحة"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>نتيجة الاختبار</Label>
                            <div className="flex gap-2">
                              {[
                                { value: 'PASSED', label: '✅ نجح', color: 'bg-green-100 border-green-500 text-green-700' },
                                { value: 'PARTIAL', label: '⚠️ جزئي', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
                                { value: 'FAILED', label: '❌ فشل', color: 'bg-red-100 border-red-500 text-red-700' },
                              ].map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() => setInspectionData({ ...inspectionData, testResult: status.value as 'PASSED' | 'PARTIAL' | 'FAILED' })}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${inspectionData.testResult === status.value
                                    ? status.color + ' border-2'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nextMaintenanceDate">تاريخ الصيانة القادمة</Label>
                            <div className="flex gap-2">
                              <Input
                                id="nextMaintenanceDate"
                                type="date"
                                value={inspectionData.nextMaintenanceDate}
                                onChange={(e) => setInspectionData({ ...inspectionData, nextMaintenanceDate: e.target.value })}
                                className="flex-1"
                              />
                              <div className="flex gap-1">
                                {[
                                  { label: '+٣ شهر', months: 3 },
                                  { label: '+٦ شهر', months: 6 },
                                  { label: '+١٢ شهر', months: 12 },
                                ].map((opt) => (
                                  <button
                                    key={opt.months}
                                    type="button"
                                    onClick={() => {
                                      const date = new Date()
                                      date.setMonth(date.getMonth() + opt.months)
                                      setInspectionData({ ...inspectionData, nextMaintenanceDate: date.toISOString().split('T')[0] })
                                    }}
                                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Technician Notes - Universal */}
                      <div className="space-y-2">
                        <Label htmlFor="technicianNotes">ملاحظات الفني <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
                        <Textarea
                          id="technicianNotes"
                          value={inspectionData.technicianNotes}
                          onChange={(e) => setInspectionData({ ...inspectionData, technicianNotes: e.target.value })}
                          placeholder="أي ملاحظات إضافية..."
                          rows={2}
                        />
                      </div>

                      {/* File Upload - Common for all report types */}
                      <div className="space-y-2">
                        <Label>المرفقات</Label>
                        <FileUploadDropzone
                          onFilesSelected={(files) => {
                            const event = {
                              target: { files }
                            } as any
                            handleInspectionPhotoUpload(event, 'INSPECTION')
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                          multiple={true}
                          disabled={uploadingPhoto}
                          uploading={uploadingPhoto}
                          uploadedFiles={inspectionPhotos}
                          onRemoveFile={removeInspectionPhoto}
                          label="رفع ملفات (PDF، DOC، صور)"
                          showPreview={true}
                        />
                      </div>

                      {/* Equipment Inspection Section - Only for STICKER_INSPECTION work orders */}
                      {selectedItem.workOrderType === 'STICKER_INSPECTION' && selectedItem.equipment && selectedItem.equipment.length > 0 && (
                        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-amber-800 flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              تفتيش المعدات ({selectedItem.equipment.length} عناصر)
                            </h5>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedItem.equipment.map((eq) => (
                              <div key={eq.id} className="p-3 bg-white rounded-lg border border-amber-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{eq.equipmentNumber}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {eq.equipmentType.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                    {eq.location && (
                                      <p className="text-xs text-muted-foreground mt-1">{eq.location}</p>
                                    )}
                                  </div>
                                  <Badge
                                    variant={eq.isInspected ? 'default' : 'secondary'}
                                    className={eq.isInspected ? 'bg-green-600' : ''}
                                  >
                                    {eq.isInspected ? 'تم التفتيش' : 'قيد الانتظار'}
                                  </Badge>
                                </div>
                                {eq.isInspected && (
                                  <div className="mt-2 pt-2 border-t flex items-center gap-4 text-xs">
                                    {eq.certificateId ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <Award className="h-3 w-3" /> تم إصدار شهادة
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Award className="h-3 w-3" /> لا توجد شهادة
                                      </span>
                                    )}
                                    {eq.stickerApplied && (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <Check className="h-3 w-3" /> Sticker
                                      </span>
                                    )}
                                    {eq.inspectionResult && (
                                      <Badge variant={eq.inspectionResult === 'PASS' ? 'default' : 'destructive'} className="text-xs">
                                        {eq.inspectionResult}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-amber-600">
                            يمكن تحديث تفاصيل تفتيش المعدات في تبويب المعدات
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setInspectionMode(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveInspection} disabled={savingInspection} className="flex-1">
                          {savingInspection && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                          Save Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setInspectionMode(true)} className="flex-1">
                        <FileText className="me-2 h-4 w-4" />
                        Fill Report
                      </Button>
                      <Button
                        onClick={() => handleSendToReview(selectedItem.id)}
                        disabled={updating}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {updating ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="me-2 h-4 w-4" />
                        )}
                        Send to Review
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Show existing inspection data (for FOR_REVIEW and COMPLETED stages) */}
              {(selectedItem.stage === 'FOR_REVIEW' || selectedItem.stage === 'COMPLETED') && (
                selectedItem.inspectionDate ||
                selectedItem.systemsChecked ||
                selectedItem.findings ||
                selectedItem.deficiencies ||
                selectedItem.recommendations ||
                (selectedItem.photos && selectedItem.photos.length > 0)
              ) && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Report
                    </h4>

                    {selectedItem.inspectionDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedItem.workOrderType === 'INSTALLATION' ? 'تاريخ التركيب' :
                            selectedItem.workOrderType === 'SERVICE' ? 'تاريخ الخدمة' :
                              selectedItem.workOrderType === 'MAINTENANCE' ? 'تاريخ الصيانة' :
                                selectedItem.workOrderType === 'INSPECTION' || selectedItem.workOrderType === 'STICKER_INSPECTION' ? 'تاريخ التفتيش' :
                                  'التاريخ'}
                        </p>
                        <p className="text-sm">{new Date(selectedItem.inspectionDate).toLocaleDateString('ar-SA')}</p>
                      </div>
                    )}

                    {selectedItem.systemsChecked && (
                      <div>
                        <p className="text-sm text-muted-foreground">الأنظمة المفحوصة</p>
                        <p className="text-sm">{selectedItem.systemsChecked}</p>
                      </div>
                    )}

                    {selectedItem.findings && (
                      <div>
                        <p className="text-sm text-muted-foreground">النتائج</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedItem.findings}</p>
                      </div>
                    )}

                    {selectedItem.deficiencies && (
                      <div>
                        <p className="text-sm text-muted-foreground">النقائص</p>
                        <p className="text-sm whitespace-pre-wrap text-orange-700">{selectedItem.deficiencies}</p>
                      </div>
                    )}

                    {selectedItem.recommendations && (
                      <div>
                        <p className="text-sm text-muted-foreground">التوصيات</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedItem.recommendations}</p>
                      </div>
                    )}

                    {/* Photos */}
                    {selectedItem.photos && selectedItem.photos.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">الصور ({selectedItem.photos.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.photos.map((photo) => photo?.url ? (
                            <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={photo.url}
                                alt={photo.caption || 'صورة تفتيش'}
                                className="h-20 w-20 object-cover rounded-lg border hover:opacity-80"
                              />
                            </a>
                          ) : null)}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              {/* Signatures Section - Show for FOR_REVIEW and COMPLETED stages */}
              {(selectedItem.stage === 'FOR_REVIEW' || selectedItem.stage === 'COMPLETED') && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">التوقيعات</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">المشرف</p>
                      {selectedItem.supervisorSignature ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">موقّع {selectedItem.supervisorSignedAt && new Date(selectedItem.supervisorSignedAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      ) : userRole === 'CONTRACTOR' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!selectedItem.price) {
                              toast.error(t.toasts.priceRequiredToSign)
                              return
                            }
                            setSignatureType('supervisor')
                            setSignerName(currentUserName || 'مشرف')
                            setSignatureDialogOpen(true)
                          }}
                          disabled={updating}
                        >
                          {updating ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : <PenTool className="me-2 h-3 w-3" />}
                          Sign
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">غير موقّع</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">العميل</p>
                      {selectedItem.clientSignature ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">موقّع {selectedItem.clientSignedAt && new Date(selectedItem.clientSignedAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      ) : userRole === 'CLIENT' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!selectedItem.price) {
                              toast.error(t.toasts.priceRequiredAskContractor)
                              return
                            }
                            setSignatureType('client')
                            setSignerName(currentUserName || 'عميل')
                            setSignatureDialogOpen(true)
                          }}
                          disabled={updating}
                        >
                          {updating ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : <PenTool className="me-2 h-3 w-3" />}
                          Sign
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">غير موقّع</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Archived Info - Show deletion details */}
              {selectedItem.stage === 'ARCHIVED' && (
                <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Archive className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-700">أمر عمل مؤرشف</h4>
                  </div>
                  {selectedItem.deletedAt && (
                    <p className="text-sm text-gray-600 mb-2">
                      تمت الأرشفة في: {new Date(selectedItem.deletedAt).toLocaleDateString('ar-SA')} الساعة {new Date(selectedItem.deletedAt).toLocaleTimeString('ar-SA')}
                    </p>
                  )}
                  {selectedItem.deletedReason && (
                    <p className="text-sm text-gray-600 mb-3">
                      السبب: {selectedItem.deletedReason}
                    </p>
                  )}
                  {!readOnly && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-2">استعادة أمر العمل إلى:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStageChange('SCHEDULED')}
                          disabled={updating}
                          className="text-blue-700 border-blue-300 hover:bg-blue-50"
                        >
                          <Calendar className="me-2 h-4 w-4" />
                          Scheduled
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStageChange('IN_PROGRESS')}
                          disabled={updating}
                          className="text-orange-700 border-orange-300 hover:bg-orange-50"
                        >
                          <Clock className="me-2 h-4 w-4" />
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStageChange('FOR_REVIEW')}
                          disabled={updating}
                          className="text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          <FileText className="me-2 h-4 w-4" />
                          For Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStageChange('COMPLETED')}
                          disabled={updating}
                          className="text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="me-2 h-4 w-4" />
                          Completed
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedItem.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">ملاحظات</p>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}

              {/* Print Work Order Button - Available for all stages */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`/print/work-orders/${selectedItem.id}`, '_blank', 'noopener,noreferrer')}
                >
                  <Printer className="me-2 h-4 w-4" />
                  Print Work Order
                </Button>
              </div>

              {/* View Certificate Button - Show for completed work orders with certificate */}
              {selectedItem.stage === 'COMPLETED' && selectedItem.certificateId && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => {
                      // Navigate to certificates tab or open certificate
                      window.open(`/dashboard/clients/${branchId.split('/')[0]}/branches/${branchId}?tab=certificates`, '_blank')
                    }}
                  >
                    <Award className="me-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Column Detail Modal */}
      {selectedStage && (
        <ColumnDetailModal
          open={columnModalOpen}
          onOpenChange={setColumnModalOpen}
          stage={selectedStage}
          items={getItemsByStage(selectedStage.id)}
          onItemClick={(item) => {
            setColumnModalOpen(false)
            handleItemClick(item)
          }}
        />
      )}

      {/* Confirmation Dialog for Drag to Complete */}
      <Dialog open={confirmMoveDialogOpen} onOpenChange={setConfirmMoveDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Accept Work Order?
            </DialogTitle>
            <DialogDescription>
              راجع تفاصيل أمر العمل والتقرير قبل القبول.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Work Order Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedItem.description}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedItem.scheduledDate && (
                    <div>
                      <p className="text-muted-foreground">مجدول</p>
                      <p className="font-medium">{new Date(selectedItem.scheduledDate).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                  {selectedItem.price && (
                    <div>
                      <p className="text-muted-foreground">السعر</p>
                      <p className="font-semibold text-green-700">{formatCurrency(selectedItem.price)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Summary */}
              {(selectedItem.inspectionDate || selectedItem.findings || selectedItem.systemsChecked) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Report
                  </h4>
                  {selectedItem.inspectionDate && (
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">التاريخ:</span> {new Date(selectedItem.inspectionDate).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                  {selectedItem.systemsChecked && (
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">الأنظمة المفحوصة:</span> {selectedItem.systemsChecked}
                    </p>
                  )}
                  {selectedItem.findings && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">النتائج:</span> {selectedItem.findings}
                    </p>
                  )}
                </div>
              )}

              {/* Acceptance Status */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">حالة القبول</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedItem.supervisorSignature ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>المشرف</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedItem.clientSignature ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>العميل</span>
                  </div>
                </div>
              </div>

              {/* Warning if no acceptances */}
              {!selectedItem.supervisorSignature && !selectedItem.clientSignature && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ لم يقم المشرف ولا العميل بقبول أمر العمل هذا بعد.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmMoveDialogOpen(false)
                setPendingMove(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMove}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="me-2 h-4 w-4" />
              Sign & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <SignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSign={async (signature) => {
          if (signatureType === 'technician') {
            await handleTechnicianSign(signature)
          } else if (signatureType === 'supervisor') {
            await handleSupervisorSign(signature)
          } else if (signatureType === 'client') {
            await handleClientSign(signature)
          }
        }}
        title={
          signatureType === 'technician' ? 'توقيع التقرير' :
            signatureType === 'supervisor' ? 'توقيع أمر العمل (مشرف)' :
              'توقيع أمر العمل (عميل)'
        }
        description={
          signatureType === 'technician' ? 'وقّع لتأكيد إكمال التفتيش قبل الإرسال للمراجعة' :
            signatureType === 'supervisor' ? 'وقّع للموافقة على أمر العمل المكتمل' :
              'وقّع لقبول العمل المكتمل'
        }
        signerName={signerName}
      />

      {/* Price Dialog */}
      <PriceDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        onConfirm={(price) => {
          if (pendingPriceWorkOrderId) {
            handlePriceUpdate(pendingPriceWorkOrderId, price)
            setPendingPriceWorkOrderId(null)
          }
        }}
        currentPrice={selectedItem?.price}
      />

      {/* Technician Details Modal */}
      <TechnicianDetailsModal
        technicianId={selectedTechnicianId}
        open={technicianModalOpen}
        onOpenChange={setTechnicianModalOpen}
      />

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              إعادة جدولة أمر العمل
            </DialogTitle>
            <DialogDescription>
              قم بتغيير التاريخ المجدول لأمر العمل. سيتم إخطار العميل.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItem?.scheduledDate && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">الجدول الحالي</p>
                <p className="font-medium">
                  {new Date(selectedItem.scheduledDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newDate">التاريخ الجديد *</Label>
              <Input
                id="newDate"
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">سبب إعادة الجدولة</Label>
              <Textarea
                id="reason"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                placeholder="مثال: طلب العميل تاريخاً مختلفاً، الفني غير متاح..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false)
                setRescheduleData({ newDate: '', reason: '' })
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduling || !rescheduleData.newDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {rescheduling && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <CalendarClock className="me-2 h-4 w-4" />
              تأكيد إعادة الجدولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
