'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  Wrench, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  CornerDownRight,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BillingWorkOrder {
  id: string
  description: string
  price: number | null
  scheduledDate: string | null
  stage: string
  type: string
  paymentStatus: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID'
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
}

interface BillingWorkOrdersDisplayProps {
  workOrders: BillingWorkOrder[]
  userRole: 'CONTRACTOR' | 'CLIENT' | 'MANAGER'
  onPaySingle?: (workOrderId: string) => void
  onPayGroup?: (workOrderIds: string[]) => void
  onVerifyPayment?: (workOrderId: string) => void
  onViewProof?: (workOrder: BillingWorkOrder) => void
}

function getBaseWorkOrderName(title: string): string {
  // Remove suffix patterns like "(Q1)", "(Month1)", or prefix patterns like "Q1:", "Month1:"
  return title
    .replace(/\s*\((Q\d+|Month\d+)\)\s*$/i, '') // Suffix: (Q1), (Month1)
    .replace(/^(Q\d+|Month\d+):\s*/i, '') // Prefix: Q1:, Month1:
    .trim()
}

function groupWorkOrders(workOrders: BillingWorkOrder[]): Map<string, BillingWorkOrder[]> {
  const groups = new Map<string, BillingWorkOrder[]>()
  
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

function getPaymentStatusBadge(status: BillingWorkOrder['paymentStatus']) {
  switch (status) {
    case 'PAID':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      )
    case 'PENDING_VERIFICATION':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unpaid
        </Badge>
      )
  }
}

function getStageBadge(stage: string) {
  const config: Record<string, { style: string; label: string }> = {
    REQUESTED: { style: 'bg-gray-100 text-gray-700', label: 'Requested' },
    SCHEDULED: { style: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
    IN_PROGRESS: { style: 'bg-orange-100 text-orange-700', label: 'In Progress' },
    FOR_REVIEW: { style: 'bg-purple-100 text-purple-700', label: 'For Review' },
    COMPLETED: { style: 'bg-green-100 text-green-700', label: 'Completed' },
  }
  const { style, label } = config[stage] || { style: 'bg-gray-100 text-gray-700', label: stage }
  return <Badge className={style}>{label}</Badge>
}

export function BillingWorkOrdersDisplay({ 
  workOrders, 
  userRole,
  onPaySingle,
  onPayGroup,
  onVerifyPayment,
  onViewProof,
}: BillingWorkOrdersDisplayProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [payAllMode, setPayAllMode] = useState<Record<string, boolean>>({})
  
  const groups = groupWorkOrders(workOrders)
  const totalValue = workOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const paidValue = workOrders
    .filter(wo => wo.paymentStatus === 'PAID')
    .reduce((sum, wo) => sum + (wo.price || 0), 0)

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const togglePayMode = (groupName: string) => {
    setPayAllMode(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No work orders found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm px-1 pb-2 border-b">
        <span className="text-muted-foreground">Payment Progress</span>
        <span className="font-medium">
          {formatCurrency(paidValue)} / {formatCurrency(totalValue)} paid
        </span>
      </div>

      {/* Grouped work orders */}
      <div className="space-y-3">
        {Array.from(groups.entries()).map(([groupName, items]) => {
          const groupTotal = items.reduce((sum, wo) => sum + (wo.price || 0), 0)
          const paidCount = items.filter(wo => wo.paymentStatus === 'PAID').length
          const pendingCount = items.filter(wo => wo.paymentStatus === 'PENDING_VERIFICATION').length
          const unpaidCount = items.filter(wo => !wo.paymentStatus || wo.paymentStatus === 'UNPAID').length
          const allPaid = paidCount === items.length
          const allUnpaid = unpaidCount === items.length
          const isExpanded = expandedGroups.has(groupName)
          const isPayAllMode = payAllMode[groupName] ?? true
          const isSingleItem = items.length === 1
          const unpaidItems = items.filter(wo => !wo.paymentStatus || wo.paymentStatus === 'UNPAID')
          
          return (
            <Collapsible 
              key={groupName} 
              open={isExpanded}
              onOpenChange={() => toggleGroup(groupName)}
            >
              <div className={cn(
                "rounded-lg border bg-card overflow-hidden",
                allPaid && "border-green-200 bg-green-50/30"
              )}>
                {/* Group Header */}
                <CollapsibleTrigger asChild>
                  <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-sm">{groupName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {items.length} occurrence{items.length !== 1 ? 's' : ''} • {paidCount}/{items.length} paid
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Payment status summary */}
                        {allPaid ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Fully Paid
                          </Badge>
                        ) : pendingCount > 0 ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="h-3 w-3 mr-1" />
                            {pendingCount} Pending
                          </Badge>
                        ) : null}
                        
                        <span className="font-semibold text-sm text-primary">
                          {formatCurrency(groupTotal)}
                        </span>
                        
                        {/* Pay All button (header) - only for client in pay all mode */}
                        {userRole === 'CLIENT' && isPayAllMode && !isSingleItem && unpaidItems.length > 0 && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPayGroup?.(unpaidItems.map(wo => wo.id))
                            }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pay All ({unpaidItems.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="border-t">
                    {/* Pay mode toggle - only show for groups with multiple items */}
                    {!isSingleItem && userRole === 'CLIENT' && unpaidItems.length > 0 && (
                      <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
                        <Label htmlFor={`pay-mode-${groupName}`} className="text-xs text-muted-foreground">
                          Payment mode
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", !isPayAllMode && "font-medium")}>
                            Pay separately
                          </span>
                          <Switch
                            id={`pay-mode-${groupName}`}
                            checked={isPayAllMode}
                            onCheckedChange={() => togglePayMode(groupName)}
                          />
                          <span className={cn("text-xs", isPayAllMode && "font-medium")}>
                            Pay all at once
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Individual Items */}
                    <div className="divide-y">
                      {items.map((wo, idx) => {
                        // Extract suffix from either "(Q1)" format or "Q1:" prefix format
                        const suffixMatch = wo.description.match(/\((Q\d+|Month\d+)\)/i)?.[1] ||
                                           wo.description.match(/^(Q\d+|Month\d+):/i)?.[1]
                        const suffix = suffixMatch || (isSingleItem ? '' : `#${idx + 1}`)
                        
                        return (
                          <div 
                            key={wo.id} 
                            className={cn(
                              "px-4 py-3",
                              wo.paymentStatus === 'PAID' && "bg-green-50/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {suffix && (
                                      <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                                        {suffix}:
                                      </span>
                                    )}
                                    <span className="text-sm flex items-center gap-1 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(wo.scheduledDate)}
                                    </span>
                                    {getStageBadge(wo.stage)}
                                    {wo.type === 'ADHOC' && (
                                      <Badge variant="outline" className="text-xs">Ad-hoc</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {getPaymentStatusBadge(wo.paymentStatus)}
                                <span className="text-sm font-medium min-w-[80px] text-right">
                                  {formatCurrency(wo.price)}
                                </span>
                                
                                {/* Action buttons */}
                                {wo.paymentStatus === 'UNPAID' && userRole === 'CLIENT' && !isPayAllMode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onPaySingle?.(wo.id)}
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pay
                                  </Button>
                                )}
                                
                                {wo.paymentStatus === 'PENDING_VERIFICATION' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onViewProof?.(wo)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Proof
                                    </Button>
                                    {userRole === 'CONTRACTOR' && (
                                      <Button
                                        size="sm"
                                        onClick={() => onVerifyPayment?.(wo.id)}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verify
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
        <div>
          <span className="font-semibold">Total</span>
          <p className="text-xs text-muted-foreground">
            {workOrders.filter(wo => wo.paymentStatus === 'PAID').length} of {workOrders.length} paid
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </span>
          {paidValue > 0 && paidValue < totalValue && (
            <p className="text-xs text-green-600">
              {formatCurrency(paidValue)} paid
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
