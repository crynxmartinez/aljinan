'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Wrench,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  ClipboardList,
  Plus,
  Filter,
  Loader2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WorkOrder {
  id: string
  description: string
  workOrderNumber: number | null
  workOrderType: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION' | 'OTHER' | null
  stage: 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED' | 'ARCHIVED'
  type: 'SCHEDULED' | 'ADHOC'
  price: number | null
  scheduledDate: string | null
  assignedTo: string | null
  assignedTeamMember?: {
    name: string
  } | null
  contract?: {
    id: string
    title: string
  } | null
}

interface Contract {
  id: string
  title: string
  startDate: string
  endDate: string
  totalValue: number
  workOrders: WorkOrder[]
}

interface DashboardStats {
  inProgress: number
  forReview: number
  scheduled: number
  completed: number
  totalValue: number
}

interface BranchDashboardProps {
  branchId: string
}

type ViewMode = 'split' | 'contracts' | 'adhoc'

const WORK_ORDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  SERVICE: <Wrench className="h-4 w-4" />,
  INSPECTION: <ClipboardList className="h-4 w-4" />,
  MAINTENANCE: <Wrench className="h-4 w-4" />,
  INSTALLATION: <Plus className="h-4 w-4" />,
  STICKER_INSPECTION: <ClipboardList className="h-4 w-4" />,
  OTHER: <FileText className="h-4 w-4" />,
}

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: <Calendar className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-green-100 text-green-700', icon: <Clock className="h-3 w-3" /> },
  FOR_REVIEW: { label: 'For Review', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: <CheckCircle className="h-3 w-3" /> },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-500', icon: <FileText className="h-3 w-3" /> },
}

export function BranchDashboard({ branchId }: BranchDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Calculate stats
  const contractWorkOrders = workOrders.filter(wo => wo.type === 'SCHEDULED' && wo.contract)
  const adhocWorkOrders = workOrders.filter(wo => wo.type === 'ADHOC' || !wo.contract)

  const calculateStats = (orders: WorkOrder[]): DashboardStats => {
    const activeOrders = orders.filter(wo => wo.stage !== 'ARCHIVED')
    return {
      inProgress: activeOrders.filter(wo => wo.stage === 'IN_PROGRESS').length,
      forReview: activeOrders.filter(wo => wo.stage === 'FOR_REVIEW').length,
      scheduled: activeOrders.filter(wo => wo.stage === 'SCHEDULED').length,
      completed: activeOrders.filter(wo => wo.stage === 'COMPLETED').length,
      totalValue: activeOrders.reduce((sum, wo) => sum + (wo.price || 0), 0),
    }
  }

  const contractStats = calculateStats(contractWorkOrders)
  const adhocStats = calculateStats(adhocWorkOrders)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch work orders
        const woResponse = await fetch(`/api/branches/${branchId}/checklist-items`)
        if (woResponse.ok) {
          const data = await woResponse.json()
          setWorkOrders(data)
        }

        // Fetch contracts
        const contractsResponse = await fetch(`/api/branches/${branchId}/contracts`)
        if (contractsResponse.ok) {
          const data = await contractsResponse.json()
          setContracts(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [branchId])

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Filter work orders for detail view
  const getFilteredWorkOrders = (orders: WorkOrder[]) => {
    return orders.filter(wo => {
      if (wo.stage === 'ARCHIVED') return false
      if (statusFilter !== 'all' && wo.stage !== statusFilter) return false
      if (typeFilter !== 'all' && wo.workOrderType !== typeFilter) return false
      return true
    })
  }

  const renderStatsCard = (
    title: string,
    icon: React.ReactNode,
    stats: DashboardStats,
    isActive: boolean,
    onClick: () => void,
    color: string
  ) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? `ring-2 ring-${color}-500 shadow-md` : ''
      } ${viewMode !== 'split' && !isActive ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">In Progress:</span>
            <span className="font-medium">{stats.inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">For Review:</span>
            <span className="font-medium">{stats.forReview}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Scheduled:</span>
            <span className="font-medium">{stats.scheduled}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-medium">{stats.completed}</span>
          </div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="font-semibold text-green-600">{formatCurrency(stats.totalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderWorkOrderItem = (wo: WorkOrder) => {
    const stageConfig = STAGE_CONFIG[wo.stage] || STAGE_CONFIG.SCHEDULED
    const typeIcon = WORK_ORDER_TYPE_ICONS[wo.workOrderType || 'OTHER']

    return (
      <div
        key={wo.id}
        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted-foreground">{typeIcon}</span>
              <Badge variant="outline" className="text-xs">
                {wo.workOrderType || 'OTHER'}
              </Badge>
              {wo.workOrderNumber && (
                <span className="text-xs text-muted-foreground">
                  #WO-{String(wo.workOrderNumber).padStart(3, '0')}
                </span>
              )}
            </div>
            <p className="font-medium truncate">{wo.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(wo.scheduledDate)}
              </span>
              {wo.assignedTeamMember && (
                <span className="truncate">
                  👤 {wo.assignedTeamMember.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={stageConfig.color}>
              {stageConfig.icon}
              <span className="ml-1">{stageConfig.label}</span>
            </Badge>
            <span className="font-semibold text-green-600">
              {formatCurrency(wo.price)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderContractGroup = (contract: Contract) => {
    const contractWOs = contractWorkOrders.filter(wo => wo.contract?.id === contract.id)
    const filteredWOs = getFilteredWorkOrders(contractWOs)

    if (filteredWOs.length === 0 && (statusFilter !== 'all' || typeFilter !== 'all')) {
      return null
    }

    return (
      <div key={contract.id} className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{contract.title}</h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(contract.startDate)} - {formatDate(contract.endDate)} • {contractWOs.length} work orders
              </p>
            </div>
            <span className="font-semibold text-green-600">
              {formatCurrency(contract.totalValue)}
            </span>
          </div>
        </div>
        <div className="divide-y">
          {filteredWOs.slice(0, 5).map(renderWorkOrderItem)}
          {filteredWOs.length > 5 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              +{filteredWOs.length - 5} more work orders
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDetailPanel = () => {
    const isContracts = viewMode === 'contracts'
    const orders = isContracts ? contractWorkOrders : adhocWorkOrders
    const filteredOrders = getFilteredWorkOrders(orders)

    return (
      <Card className="flex-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('split')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isContracts ? (
                <>
                  <FileText className="h-5 w-5" />
                  Contract Work Orders
                </>
              ) : (
                <>
                  <Wrench className="h-5 w-5" />
                  Ad-hoc Services
                </>
              )}
            </CardTitle>
            {!isContracts && (
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Ad-hoc
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="FOR_REVIEW">For Review</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INSTALLATION">Installation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {isContracts ? (
            contracts.length > 0 ? (
              contracts.map(renderContractGroup)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No contracts found</p>
              </div>
            )
          ) : (
            filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map(renderWorkOrderItem)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No ad-hoc services found</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Work</p>
                <p className="text-2xl font-bold">{contractStats.inProgress + adhocStats.inProgress}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{contractStats.forReview + adhocStats.forReview}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{contractStats.completed + adhocStats.completed}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <CheckCircle className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(contractStats.totalValue + adhocStats.totalValue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Split View / Detail View */}
      <div className="flex gap-6">
        {viewMode === 'split' ? (
          <>
            <div className="flex-1">
              {renderStatsCard(
                'Contract Work Orders',
                <FileText className="h-5 w-5 text-blue-600" />,
                contractStats,
                false,
                () => setViewMode('contracts'),
                'blue'
              )}
            </div>
            <div className="flex-1">
              {renderStatsCard(
                'Ad-hoc Services',
                <Wrench className="h-5 w-5 text-purple-600" />,
                adhocStats,
                false,
                () => setViewMode('adhoc'),
                'purple'
              )}
            </div>
          </>
        ) : (
          <>
            {/* Collapsed card */}
            <div className="w-[280px] shrink-0">
              {viewMode === 'contracts' ? (
                renderStatsCard(
                  'Ad-hoc Services',
                  <Wrench className="h-5 w-5 text-purple-600" />,
                  adhocStats,
                  false,
                  () => setViewMode('adhoc'),
                  'purple'
                )
              ) : (
                renderStatsCard(
                  'Contract Work Orders',
                  <FileText className="h-5 w-5 text-blue-600" />,
                  contractStats,
                  false,
                  () => setViewMode('contracts'),
                  'blue'
                )
              )}
            </div>
            {/* Expanded detail panel */}
            {renderDetailPanel()}
          </>
        )}
      </div>
    </div>
  )
}
