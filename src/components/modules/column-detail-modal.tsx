'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Archive,
  Search,
  Download,
  ArrowUpDown,
  AlertCircle,
  DollarSign,
  Tag,
  User,
} from 'lucide-react'

type ChecklistItemStage = 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED' | 'ARCHIVED'
type ChecklistItemType = 'SCHEDULED' | 'ADHOC'

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
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION' | null
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
  certificateId?: string | null
  equipment?: Equipment[]
}

interface ColumnDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage: {
    id: ChecklistItemStage
    label: string
    color: string
    bgColor: string
    icon: typeof Clock
  }
  items: ChecklistItem[]
  onItemClick: (item: ChecklistItem) => void
}

type SortField = 'date' | 'priority' | 'type' | 'price'
type SortOrder = 'asc' | 'desc'

export function ColumnDetailModal({
  open,
  onOpenChange,
  stage,
  items,
  onItemClick,
}: ColumnDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterType, setFilterType] = useState<'all' | ChecklistItemType>('all')
  const [filterWorkOrderType, setFilterWorkOrderType] = useState<'all' | string>('all')

  const StageIcon = stage.icon

  const getDatePriority = (scheduledDate: string | null, itemStage: ChecklistItemStage) => {
    if (!scheduledDate || itemStage === 'COMPLETED' || itemStage === 'ARCHIVED') return 'normal'
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const scheduled = new Date(scheduledDate)
    scheduled.setHours(0, 0, 0, 0)
    const diffTime = scheduled.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'due-today'
    if (diffDays <= 3) return 'due-soon'
    return 'normal'
  }

  const getDaysOverdue = (scheduledDate: string | null) => {
    if (!scheduledDate) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const scheduled = new Date(scheduledDate)
    scheduled.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - scheduled.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.checklistTitle.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = filterType === 'all' || item.type === filterType
      const matchesWorkOrderType = filterWorkOrderType === 'all' || item.workOrderType === filterWorkOrderType

      return matchesSearch && matchesType && matchesWorkOrderType
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
          const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
          comparison = dateA - dateB
          break
        case 'priority':
          const priorities = { 'overdue': 0, 'due-today': 1, 'due-soon': 2, 'normal': 3 }
          const priorityA = priorities[getDatePriority(a.scheduledDate, a.stage)]
          const priorityB = priorities[getDatePriority(b.scheduledDate, b.stage)]
          comparison = priorityA - priorityB
          break
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '')
          break
        case 'price':
          comparison = (a.price || 0) - (b.price || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [items, searchQuery, filterType, filterWorkOrderType, sortField, sortOrder])

  const stats = useMemo(() => {
    const total = filteredAndSortedItems.length
    const overdue = filteredAndSortedItems.filter(item => getDatePriority(item.scheduledDate, item.stage) === 'overdue').length
    const highPriority = filteredAndSortedItems.filter(item => {
      const priority = getDatePriority(item.scheduledDate, item.stage)
      return priority === 'overdue' || priority === 'due-today'
    }).length
    const totalValue = filteredAndSortedItems.reduce((sum, item) => sum + (item.price || 0), 0)

    return { total, overdue, highPriority, totalValue }
  }, [filteredAndSortedItems])

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)))
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPriorityBadge = (item: ChecklistItem) => {
    const priority = getDatePriority(item.scheduledDate, item.stage)
    const daysOverdue = getDaysOverdue(item.scheduledDate)

    switch (priority) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {daysOverdue}d overdue
          </Badge>
        )
      case 'due-today':
        return (
          <Badge className="text-xs bg-orange-500">
            <Clock className="h-3 w-3 mr-1" />
            Due today
          </Badge>
        )
      case 'due-soon':
        return (
          <Badge className="text-xs bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Due soon
          </Badge>
        )
      default:
        return null
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Description', 'Type', 'Work Order Type', 'Scheduled Date', 'Price', 'Project', 'Checklist'].join(','),
      ...filteredAndSortedItems.map(item => [
        item.id,
        `"${item.description}"`,
        item.type,
        item.workOrderType || '-',
        item.scheduledDate || '-',
        item.price || 0,
        `"${item.projectTitle || '-'}"`,
        `"${item.checklistTitle}"`,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stage.label.toLowerCase().replace(' ', '-')}-work-orders.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StageIcon className={stage.color} />
            {stage.label} Work Orders
            <Badge variant="secondary" className="ml-2">
              {stats.total} {stats.total === 1 ? 'item' : 'items'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed view of all work orders in this stage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-semibold text-red-600">{stats.overdue}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">High Priority</p>
                <p className="text-lg font-semibold text-orange-600">{stats.highPriority}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ADHOC">Ad-hoc</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterWorkOrderType} onValueChange={setFilterWorkOrderType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Work Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All WO Types</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INSTALLATION">Installation</SelectItem>
                <SelectItem value="STICKER_INSPECTION">Sticker Inspection</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="priority">Sort by Priority</SelectItem>
                <SelectItem value="type">Sort by Type</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>WO Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No work orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onItemClick(item)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{item.description}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.checklistTitle}</div>
                      </TableCell>
                      <TableCell>
                        {item.type === 'ADHOC' ? (
                          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                            Ad-hoc
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                            Scheduled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.workOrderType ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.workOrderType.replace('_', ' ')}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(item.scheduledDate)}</TableCell>
                      <TableCell>{getPriorityBadge(item)}</TableCell>
                      <TableCell className="font-medium text-green-700">
                        {item.price ? formatCurrency(item.price) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        <div className="truncate">{item.projectTitle || '-'}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">
                {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
