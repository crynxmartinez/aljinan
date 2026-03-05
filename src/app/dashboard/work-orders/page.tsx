'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FilterPanel, QuickFilters } from '@/components/filters/filter-panel'
import { BulkToolbar } from '@/components/bulk-actions/bulk-toolbar'
import { ExportDialog } from '@/components/export/export-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WorkOrder {
  id: string
  description: string
  stage: string
  workOrderType: string
  scheduledDate: string | null
  price: number | null
  clientName: string
  branchName: string
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState([
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'SCHEDULED', label: 'Scheduled', checked: false },
        { value: 'IN_PROGRESS', label: 'In Progress', checked: false },
        { value: 'FOR_REVIEW', label: 'For Review', checked: false },
        { value: 'COMPLETED', label: 'Completed', checked: false },
      ]
    },
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'SERVICE', label: 'Service', checked: false },
        { value: 'INSPECTION', label: 'Inspection', checked: false },
        { value: 'MAINTENANCE', label: 'Maintenance', checked: false },
        { value: 'INSTALLATION', label: 'Installation', checked: false },
      ]
    }
  ])
  const [quickFilters, setQuickFilters] = useState([
    { label: 'Due Today', value: 'due_today', active: false },
    { label: 'Overdue', value: 'overdue', active: false },
    { label: 'In Progress', value: 'in_progress', active: false },
    { label: 'This Week', value: 'this_week', active: false },
  ])

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/work-orders')
      if (!response.ok) {
        throw new Error('Failed to fetch work orders')
      }
      const data = await response.json()
      setWorkOrders(data)
    } catch (error) {
      console.error('Failed to fetch work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(workOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWorkOrders = workOrders.slice(startIndex, endIndex)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedWorkOrders.map(wo => wo.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    // TODO: Apply filters to work orders
  }

  const handleQuickFilterClick = (value: string) => {
    setQuickFilters(prev =>
      prev.map(f => f.value === value ? { ...f, active: !f.active } : f)
    )
    // TODO: Apply quick filter
  }

  const handleExport = async (format: string, options: Record<string, boolean>) => {
    console.log('Exporting:', format, options)
    // TODO: Implement export logic
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const getActiveFilterCount = () => {
    return filters.reduce((count, group) => {
      return count + group.options.filter(opt => opt.checked).length
    }, 0)
  }

  const getStatusColor = (stage: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      FOR_REVIEW: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SERVICE: 'bg-blue-50 text-blue-700 border-blue-200',
      INSPECTION: 'bg-green-50 text-green-700 border-green-200',
      MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
      INSTALLATION: 'bg-purple-50 text-purple-700 border-purple-200',
    }
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground">Manage and track all work orders</p>
        </div>
        <ExportDialog
          title="Export Work Orders"
          description="Choose format and options for export"
          itemCount={workOrders.length}
          onExport={handleExport}
        />
      </div>

      {/* Quick Filters */}
      <QuickFilters
        filters={quickFilters}
        onFilterClick={handleQuickFilterClick}
      />

      {/* Filters and Actions Bar */}
      <div className="flex items-center gap-2">
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          activeFilterCount={getActiveFilterCount()}
        />
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {workOrders.length} total work orders
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            All Work Orders
          </CardTitle>
          <CardDescription>
            View and manage work orders across all clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">No work orders found</p>
              <p className="text-sm text-muted-foreground">
                Work orders will appear here once created
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg font-medium text-sm">
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={paginatedWorkOrders.length > 0 && selectedIds.length === paginatedWorkOrders.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Client</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1 text-right">Price</div>
              </div>

              {/* Table Rows */}
              {paginatedWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedIds.includes(wo.id)}
                      onCheckedChange={(checked) => handleSelectOne(wo.id, checked as boolean)}
                    />
                  </div>
                  <div className="col-span-4">
                    <p className="font-medium">{wo.description}</p>
                    <p className="text-xs text-muted-foreground">{wo.branchName}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm">{wo.clientName}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge className={getStatusColor(wo.stage)} variant="secondary">
                      {wo.stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge className={getTypeColor(wo.workOrderType)} variant="outline">
                      {wo.workOrderType}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm">
                      {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <p className="text-sm font-medium">
                      {wo.price ? `SAR ${wo.price.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && workOrders.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, workOrders.length)} of {workOrders.length} work orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      <BulkToolbar
        selectedCount={selectedIds.length}
        onAssign={() => console.log('Assign clicked')}
        onChangeStatus={() => console.log('Change status clicked')}
        onDelete={() => console.log('Delete clicked')}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  )
}
