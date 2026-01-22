'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  MapPin,
  Send,
  Loader2,
  GripVertical,
  Upload,
  X,
  Image as ImageIcon,
  PenTool,
  ClipboardCheck,
  Award,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
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

type ChecklistItemStage = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED'
type ChecklistItemType = 'SCHEDULED' | 'ADHOC'

interface InspectionPhoto {
  id: string
  url: string
  caption: string | null
  photoType: string
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
  // Inspection fields
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | null
  linkedRequestId?: string | null
  inspectionDate?: string | null
  systemsChecked?: string | null
  findings?: string | null
  deficiencies?: string | null
  recommendations?: string | null
  technicianSignature?: string | null
  technicianSignedAt?: string | null
  supervisorSignature?: string | null
  supervisorSignedAt?: string | null
  clientSignature?: string | null
  clientSignedAt?: string | null
  reportGeneratedAt?: string | null
  reportUrl?: string | null
  photos?: InspectionPhoto[]
  certificateId?: string | null
}

interface ChecklistKanbanProps {
  branchId: string
  projectId?: string | null
  readOnly?: boolean // For client view
  userRole?: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

const STAGES: { id: ChecklistItemStage; label: string; color: string; bgColor: string; icon: typeof Clock }[] = [
  { id: 'REQUESTED', label: 'Requested', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', icon: AlertCircle },
  { id: 'SCHEDULED', label: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Calendar },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: Clock },
  { id: 'FOR_REVIEW', label: 'For Review', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: FileText },
  { id: 'COMPLETED', label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
]

// Allowed stage transitions
// Contractor: SCHEDULED → IN_PROGRESS → FOR_REVIEW
// Client: FOR_REVIEW → COMPLETED or FOR_REVIEW → IN_PROGRESS (reject)
const ALLOWED_TRANSITIONS: Record<ChecklistItemStage, { contractor: ChecklistItemStage[]; client: ChecklistItemStage[] }> = {
  'REQUESTED': { contractor: ['SCHEDULED'], client: [] },
  'SCHEDULED': { contractor: ['IN_PROGRESS'], client: [] },
  'IN_PROGRESS': { contractor: ['FOR_REVIEW'], client: [] },
  'FOR_REVIEW': { contractor: [], client: ['COMPLETED', 'IN_PROGRESS'] },
  'COMPLETED': { contractor: [], client: [] },
}

function canTransition(from: ChecklistItemStage, to: ChecklistItemStage, isClient: boolean): boolean {
  const allowed = isClient 
    ? ALLOWED_TRANSITIONS[from].client 
    : ALLOWED_TRANSITIONS[from].contractor
  return allowed.includes(to)
}

// Draggable card component
function DraggableCard({ 
  item, 
  onClick, 
  disabled 
}: { 
  item: ChecklistItem
  onClick: () => void
  disabled: boolean
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        priorityStyles[priority],
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {!disabled && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2 mb-2">
            {item.description}
          </p>
          
          {/* Priority badges */}
          {priority === 'overdue' && (
            <Badge variant="destructive" className="text-xs mb-2">
              Overdue {Math.abs(daysOverdue)} day{Math.abs(daysOverdue) !== 1 ? 's' : ''}
            </Badge>
          )}
          {priority === 'due-today' && (
            <Badge className="text-xs mb-2 bg-orange-500">
              Due Today
            </Badge>
          )}
          {priority === 'due-soon' && (
            <Badge className="text-xs mb-2 bg-yellow-500 text-yellow-900">
              Due in {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
            </Badge>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {item.type === 'ADHOC' ? (
                <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                  Ad-hoc
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                  Scheduled
                </Badge>
              )}
            </div>
            
            {item.scheduledDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.scheduledDate)}
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
        </div>
      </div>
    </div>
  )
}

// Droppable column component
function DroppableColumn({ 
  stage, 
  children, 
  isOver 
}: { 
  stage: typeof STAGES[number]
  children: React.ReactNode
  isOver: boolean
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
      <div className={cn('p-3 border-b', stage.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageIcon className={cn('h-4 w-4', stage.color)} />
            <span className={cn('font-semibold text-sm', stage.color)}>
              {stage.label}
            </span>
          </div>
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

function formatDate(dateString: string | null) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
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

export function ChecklistKanban({ branchId, projectId, readOnly = false, userRole }: ChecklistKanbanProps) {
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  
  // Inspection form state
  const [inspectionMode, setInspectionMode] = useState(false)
  const [inspectionData, setInspectionData] = useState({
    inspectionDate: '',
    systemsChecked: '',
    findings: '',
    deficiencies: '',
    recommendations: '',
  })
  const [inspectionPhotos, setInspectionPhotos] = useState<{ url: string; name: string; type: string }[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingInspection, setSavingInspection] = useState(false)

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
  }, [branchId, projectId])

  async function fetchItems() {
    try {
      const url = projectId 
        ? `/api/branches/${branchId}/checklist-items?projectId=${projectId}`
        : `/api/branches/${branchId}/checklist-items`
      const response = await fetch(url)
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

  const getItemsByStage = (stage: ChecklistItemStage) => {
    const stageItems = items.filter(item => item.stage === stage)
    return sortByPriority(stageItems)
  }

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item)
    // Pre-populate inspection data if exists
    setInspectionData({
      inspectionDate: item.inspectionDate ? new Date(item.inspectionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      systemsChecked: item.systemsChecked || '',
      findings: item.findings || '',
      deficiencies: item.deficiencies || '',
      recommendations: item.recommendations || '',
    })
    setInspectionPhotos(item.photos?.map(p => ({ url: p.url, name: p.caption || 'Photo', type: p.photoType })) || [])
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

  // Save inspection data
  const handleSaveInspection = async () => {
    if (!selectedItem) return
    setSavingInspection(true)
    
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_inspection',
          itemId: selectedItem.id,
          ...inspectionData,
          photoUrls: inspectionPhotos.map(p => ({ url: p.url, type: p.type })),
        }),
      })

      if (response.ok) {
        fetchItems()
        setInspectionMode(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save inspection:', error)
    } finally {
      setSavingInspection(false)
    }
  }

  // Technician sign
  const handleTechnicianSign = async () => {
    if (!selectedItem) return
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'technician_sign',
          itemId: selectedItem.id,
          signature: 'signed', // In real app, this would be actual signature data
        }),
      })

      if (response.ok) {
        fetchItems()
        // Refresh selected item
        const updatedItems = await fetch(`/api/branches/${branchId}/checklist-items`).then(r => r.json())
        const updated = updatedItems.find((i: ChecklistItem) => i.id === selectedItem.id)
        if (updated) setSelectedItem(updated)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to sign:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Supervisor sign
  const handleSupervisorSign = async () => {
    if (!selectedItem) return
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'supervisor_sign',
          itemId: selectedItem.id,
          signature: 'signed',
        }),
      })

      if (response.ok) {
        fetchItems()
        // Refresh selected item
        const updatedItems = await fetch(`/api/branches/${branchId}/checklist-items`).then(r => r.json())
        const updated = updatedItems.find((i: ChecklistItem) => i.id === selectedItem.id)
        if (updated) setSelectedItem(updated)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to sign:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Client sign (accepting completed work)
  const handleClientSign = async () => {
    if (!selectedItem) return
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'client_sign',
          itemId: selectedItem.id,
          signature: 'signed',
        }),
      })

      if (response.ok) {
        fetchItems()
        // Refresh selected item
        const updatedItems = await fetch(`/api/branches/${branchId}/checklist-items`).then(r => r.json())
        const updated = updatedItems.find((i: ChecklistItem) => i.id === selectedItem.id)
        if (updated) setSelectedItem(updated)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to sign:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleSendToReview = async (itemId: string) => {
    if (readOnly) return
    setUpdating(true)
    try {
      // Get the checklist to find the project
      const item = items.find(i => i.id === itemId)
      if (!item) return

      // Find the project ID from the checklist
      const checklistResponse = await fetch(`/api/branches/${branchId}/checklists/${item.checklistId}`)
      if (!checklistResponse.ok) return
      const checklist = await checklistResponse.json()
      
      // Update the work order stage
      const response = await fetch(`/api/projects/${checklist.projectId}/work-orders/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'FOR_REVIEW' })
      })

      if (response.ok) {
        fetchItems()
        setDetailsOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to send to review:', error)
    } finally {
      setUpdating(false)
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
    const isClient = readOnly // readOnly means client view
    if (!canTransition(item.stage, targetStage, isClient)) {
      console.log(`Transition from ${item.stage} to ${targetStage} not allowed for ${isClient ? 'client' : 'contractor'}`)
      return
    }

    // Optimistically update UI
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, stage: targetStage } : i
    ))

    // Update on server
    try {
      const checklistResponse = await fetch(`/api/branches/${branchId}/checklists/${item.checklistId}`)
      if (!checklistResponse.ok) {
        // Revert on error
        fetchItems()
        return
      }
      const checklist = await checklistResponse.json()

      const response = await fetch(`/api/projects/${checklist.projectId}/work-orders/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage })
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
                Kanban view of all approved work orders
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} total items
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No work orders yet</p>
              <p className="text-sm text-muted-foreground">
                Work orders will appear here once quotations are approved
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
                      isOver={overId === stage.id}
                    >
                      <Badge variant="secondary" className="text-xs mb-2 ml-1">
                        {stageItems.length}
                      </Badge>
                      {stageItems.map((item) => (
                        <DraggableCard
                          key={item.id}
                          item={item}
                          onClick={() => handleItemClick(item)}
                          disabled={readOnly}
                        />
                      ))}
                      
                      {stageItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No items
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
              {inspectionMode ? 'Fill in the inspection report details' : 'View and manage this work order'}
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
                    {selectedItem.type === 'ADHOC' ? 'Ad-hoc' : 'Scheduled'}
                  </Badge>
                  {selectedItem.workOrderType && (
                    <Badge variant="secondary">
                      {selectedItem.workOrderType.charAt(0) + selectedItem.workOrderType.slice(1).toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Schedule & Price Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {selectedItem.scheduledDate && (
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedItem.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedItem.price && (
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-semibold text-green-700">{formatCurrency(selectedItem.price)}</p>
                  </div>
                )}
                {selectedItem.projectTitle && (
                  <div>
                    <p className="text-muted-foreground">Project</p>
                    <p className="font-medium">{selectedItem.projectTitle}</p>
                  </div>
                )}
              </div>

              {/* Inspection Form (for IN_PROGRESS stage, contractor only) */}
              {!readOnly && selectedItem.stage === 'IN_PROGRESS' && (
                <>
                  {inspectionMode ? (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Inspection Report
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inspectionDate">Inspection Date</Label>
                          <Input
                            id="inspectionDate"
                            type="date"
                            value={inspectionData.inspectionDate}
                            onChange={(e) => setInspectionData({ ...inspectionData, inspectionDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="systemsChecked">Systems Checked</Label>
                          <Input
                            id="systemsChecked"
                            value={inspectionData.systemsChecked}
                            onChange={(e) => setInspectionData({ ...inspectionData, systemsChecked: e.target.value })}
                            placeholder="e.g., Fire alarm, Sprinklers"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="findings">Findings</Label>
                        <Textarea
                          id="findings"
                          value={inspectionData.findings}
                          onChange={(e) => setInspectionData({ ...inspectionData, findings: e.target.value })}
                          placeholder="Describe what was found during inspection..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deficiencies">Deficiencies</Label>
                        <Textarea
                          id="deficiencies"
                          value={inspectionData.deficiencies}
                          onChange={(e) => setInspectionData({ ...inspectionData, deficiencies: e.target.value })}
                          placeholder="List any deficiencies found..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recommendations">Recommendations</Label>
                        <Textarea
                          id="recommendations"
                          value={inspectionData.recommendations}
                          onChange={(e) => setInspectionData({ ...inspectionData, recommendations: e.target.value })}
                          placeholder="Recommendations for the client..."
                          rows={2}
                        />
                      </div>

                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <Label>Photos</Label>
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleInspectionPhotoUpload(e, 'INSPECTION')}
                            className="hidden"
                            id="inspection-photo-upload"
                            disabled={uploadingPhoto}
                          />
                          <label
                            htmlFor="inspection-photo-upload"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            {uploadingPhoto ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-sm text-muted-foreground">Upload photos</span>
                              </>
                            )}
                          </label>
                        </div>
                        {inspectionPhotos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {inspectionPhotos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="h-16 w-16 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeInspectionPhoto(photo.url)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setInspectionMode(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveInspection} disabled={savingInspection} className="flex-1">
                          {savingInspection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Inspection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setInspectionMode(true)} className="flex-1">
                        <FileText className="mr-2 h-4 w-4" />
                        Fill Inspection Report
                      </Button>
                      <Button
                        onClick={() => handleSendToReview(selectedItem.id)}
                        disabled={updating}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {updating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send to Review
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Show existing inspection data (for FOR_REVIEW and COMPLETED stages) */}
              {(selectedItem.stage === 'FOR_REVIEW' || selectedItem.stage === 'COMPLETED') && selectedItem.findings && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Inspection Report
                  </h4>
                  
                  {selectedItem.inspectionDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Inspection Date</p>
                      <p className="text-sm">{new Date(selectedItem.inspectionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {selectedItem.systemsChecked && (
                    <div>
                      <p className="text-sm text-muted-foreground">Systems Checked</p>
                      <p className="text-sm">{selectedItem.systemsChecked}</p>
                    </div>
                  )}
                  
                  {selectedItem.findings && (
                    <div>
                      <p className="text-sm text-muted-foreground">Findings</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedItem.findings}</p>
                    </div>
                  )}
                  
                  {selectedItem.deficiencies && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deficiencies</p>
                      <p className="text-sm whitespace-pre-wrap text-orange-700">{selectedItem.deficiencies}</p>
                    </div>
                  )}
                  
                  {selectedItem.recommendations && (
                    <div>
                      <p className="text-sm text-muted-foreground">Recommendations</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedItem.recommendations}</p>
                    </div>
                  )}

                  {/* Photos */}
                  {selectedItem.photos && selectedItem.photos.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Photos ({selectedItem.photos.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.photos.map((photo) => (
                          <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={photo.url}
                              alt={photo.caption || 'Inspection photo'}
                              className="h-20 w-20 object-cover rounded-lg border hover:opacity-80"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Technician</p>
                      {selectedItem.technicianSignature ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Signed {selectedItem.technicianSignedAt && new Date(selectedItem.technicianSignedAt).toLocaleDateString()}</span>
                        </div>
                      ) : !readOnly && selectedItem.stage === 'FOR_REVIEW' ? (
                        <Button size="sm" variant="outline" onClick={handleTechnicianSign} disabled={updating}>
                          {updating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <PenTool className="mr-2 h-3 w-3" />}
                          Sign
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not signed</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supervisor</p>
                      {selectedItem.supervisorSignature ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Signed {selectedItem.supervisorSignedAt && new Date(selectedItem.supervisorSignedAt).toLocaleDateString()}</span>
                        </div>
                      ) : !readOnly && (selectedItem.stage === 'FOR_REVIEW' || selectedItem.stage === 'COMPLETED') ? (
                        <Button size="sm" variant="outline" onClick={handleSupervisorSign} disabled={updating}>
                          {updating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <PenTool className="mr-2 h-3 w-3" />}
                          Sign
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not signed</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Client Acceptance</p>
                      {selectedItem.clientSignature ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Signed {selectedItem.clientSignedAt && new Date(selectedItem.clientSignedAt).toLocaleDateString()}</span>
                        </div>
                      ) : userRole === 'CLIENT' && (selectedItem.stage === 'FOR_REVIEW' || selectedItem.stage === 'COMPLETED') ? (
                        <Button size="sm" variant="outline" onClick={handleClientSign} disabled={updating}>
                          {updating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <PenTool className="mr-2 h-3 w-3" />}
                          Accept & Sign
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not signed</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedItem.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}

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
                    <Award className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
