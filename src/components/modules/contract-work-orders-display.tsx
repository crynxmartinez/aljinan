'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Wrench, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertCircle,
  CornerDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkOrder {
  id: string
  description: string
  price: number | null
  scheduledDate: string | null
  stage: string
}

interface ContractWorkOrdersDisplayProps {
  workOrders: WorkOrder[]
  showStatus?: boolean
}

// Helper function to extract base name from work order title (removes Q1, Q2, Month1, etc.)
function getBaseWorkOrderName(title: string): string {
  return title.replace(/\s*\((Q\d+|Month\d+)\)\s*$/i, '').trim()
}

// Group work orders by their base name
function groupWorkOrders(workOrders: WorkOrder[]): Map<string, WorkOrder[]> {
  const groups = new Map<string, WorkOrder[]>()
  
  for (const wo of workOrders) {
    const baseName = getBaseWorkOrderName(wo.description)
    if (!groups.has(baseName)) {
      groups.set(baseName, [])
    }
    groups.get(baseName)!.push(wo)
  }
  
  return groups
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Not scheduled'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function getStageIcon(stage: string) {
  switch (stage) {
    case 'COMPLETED':
      return <CheckCircle className="h-3 w-3 text-green-600" />
    case 'IN_PROGRESS':
      return <Clock className="h-3 w-3 text-orange-600" />
    case 'FOR_REVIEW':
      return <AlertCircle className="h-3 w-3 text-purple-600" />
    default:
      return <Clock className="h-3 w-3 text-blue-600" />
  }
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'IN_PROGRESS':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'FOR_REVIEW':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function ContractWorkOrdersDisplay({ workOrders, showStatus = true }: ContractWorkOrdersDisplayProps) {
  const groups = groupWorkOrders(workOrders)
  const totalValue = workOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const completedCount = workOrders.filter(wo => wo.stage === 'COMPLETED').length

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No work orders in this contract</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {showStatus && (
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {completedCount} / {workOrders.length} completed
          </span>
        </div>
      )}

      {/* Grouped work orders */}
      <div className="space-y-3">
        {Array.from(groups.entries()).map(([groupName, items]) => {
          const groupTotal = items.reduce((sum, wo) => sum + (wo.price || 0), 0)
          const isSingleItem = items.length === 1
          const allCompleted = items.every(wo => wo.stage === 'COMPLETED')
          
          return (
            <div 
              key={groupName} 
              className={cn(
                "rounded-lg border bg-card",
                allCompleted && "border-green-200 bg-green-50/30"
              )}
            >
              {/* Group Header */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">{groupName}</h4>
                      {!isSingleItem && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {items.length} occurrences
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm text-primary">
                      {formatCurrency(groupTotal)}
                    </span>
                    {showStatus && allCompleted && (
                      <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Items */}
              <div className="divide-y">
                {items.map((wo, idx) => {
                  const suffix = wo.description.match(/\((Q\d+|Month\d+)\)/i)?.[1] || 
                                 (isSingleItem ? '' : `#${idx + 1}`)
                  
                  return (
                    <div 
                      key={wo.id} 
                      className={cn(
                        "px-3 py-2 flex items-center justify-between",
                        wo.stage === 'COMPLETED' && "bg-green-50/50"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <CornerDownRight className="h-3 w-3 text-muted-foreground ml-2" />
                        {suffix && (
                          <span className="text-muted-foreground font-medium min-w-[50px]">
                            {suffix}:
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(wo.scheduledDate)}</span>
                        </div>
                        {showStatus && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs ml-2", getStageColor(wo.stage))}
                          >
                            {getStageIcon(wo.stage)}
                            <span className="ml-1">{wo.stage.replace('_', ' ')}</span>
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(wo.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
        <span className="font-semibold">Total Contract Value</span>
        <span className="text-xl font-bold text-primary">
          {formatCurrency(totalValue)}
        </span>
      </div>
    </div>
  )
}
