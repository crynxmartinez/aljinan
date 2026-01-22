'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Loader2, FileText, DollarSign, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { BillingWorkOrdersDisplay, BillingWorkOrder } from './billing-work-orders-display'
import { PaymentSubmitDialog } from './payment-submit-dialog'
import { PaymentVerifyDialog } from './payment-verify-dialog'

interface WorkOrder {
  id: string
  description: string
  notes: string | null
  stage: string
  type: string
  scheduledDate: string | null
  price: number | null
  isCompleted: boolean
  checklistId: string
  checklistTitle: string
  projectTitle: string | null
  paymentStatus: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID'
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
}

interface Project {
  id: string
  title: string
  status: string
  totalValue: number
}

interface BillingViewProps {
  branchId: string
  projectId?: string | null
  userRole: 'CONTRACTOR' | 'CLIENT'
}

export function BillingView({ branchId, projectId, userRole }: BillingViewProps) {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Work order payment dialog state
  const [woPaymentDialogOpen, setWoPaymentDialogOpen] = useState(false)
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>([])
  const [selectedWorkOrderDescriptions, setSelectedWorkOrderDescriptions] = useState<string[]>([])
  const [selectedWorkOrderTotal, setSelectedWorkOrderTotal] = useState(0)

  // Work order verify dialog state
  const [woVerifyDialogOpen, setWoVerifyDialogOpen] = useState(false)
  const [verifyWorkOrders, setVerifyWorkOrders] = useState<WorkOrder[]>([])

  // Collapsible states - must be at top level before any conditional returns
  const [contractsExpanded, setContractsExpanded] = useState(true)
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])

  const fetchData = async () => {
    try {
      // Fetch work orders
      const workOrdersUrl = projectId 
        ? `/api/branches/${branchId}/checklist-items?projectId=${projectId}`
        : `/api/branches/${branchId}/checklist-items`
      const woResponse = await fetch(workOrdersUrl)
      if (woResponse.ok) {
        const woData = await woResponse.json()
        setWorkOrders(woData)
      }

      // Fetch projects
      const projectsResponse = await fetch(`/api/branches/${branchId}/projects`)
      if (projectsResponse.ok) {
        const projData = await projectsResponse.json()
        setProjects(projData)
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [branchId, projectId])

  // Initialize expanded projects when work orders load
  useEffect(() => {
    const projectTitles = [...new Set(workOrders.filter(wo => wo.projectTitle).map(wo => wo.projectTitle as string))]
    setExpandedProjects(projectTitles)
  }, [workOrders])

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  // Work order payment handlers
  const handlePaySingle = (workOrderId: string) => {
    const wo = workOrders.find(w => w.id === workOrderId)
    if (wo) {
      setSelectedWorkOrderIds([workOrderId])
      setSelectedWorkOrderDescriptions([wo.description])
      setSelectedWorkOrderTotal(wo.price || 0)
      setWoPaymentDialogOpen(true)
    }
  }

  const handlePayGroup = (workOrderIds: string[]) => {
    const wos = workOrders.filter(w => workOrderIds.includes(w.id))
    setSelectedWorkOrderIds(workOrderIds)
    setSelectedWorkOrderDescriptions(wos.map(w => w.description))
    setSelectedWorkOrderTotal(wos.reduce((sum, w) => sum + (w.price || 0), 0))
    setWoPaymentDialogOpen(true)
  }

  const handleVerifyPayment = (workOrderId: string) => {
    const wo = workOrders.find(w => w.id === workOrderId)
    if (wo) {
      // Find all work orders with the same payment proof (paid together)
      // They will have the same paymentSubmittedAt timestamp
      const relatedWorkOrders = wo.paymentSubmittedAt
        ? workOrders.filter(w => 
            w.paymentStatus === 'PENDING_VERIFICATION' && 
            w.paymentSubmittedAt === wo.paymentSubmittedAt
          )
        : [wo]
      setVerifyWorkOrders(relatedWorkOrders)
      setWoVerifyDialogOpen(true)
    }
  }

  const handleViewWorkOrderProof = (wo: BillingWorkOrder) => {
    // Find the full WorkOrder from our state
    const fullWo = workOrders.find(w => w.id === wo.id)
    if (fullWo) {
      // Find all work orders with the same payment proof (paid together)
      const relatedWorkOrders = fullWo.paymentSubmittedAt
        ? workOrders.filter(w => 
            w.paymentStatus === 'PENDING_VERIFICATION' && 
            w.paymentSubmittedAt === fullWo.paymentSubmittedAt
          )
        : [fullWo]
      setVerifyWorkOrders(relatedWorkOrders)
      setWoVerifyDialogOpen(true)
    }
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

  // Separate work orders into contract (project-based) and standalone (ad-hoc)
  const contractWorkOrders = workOrders.filter(wo => wo.projectTitle !== null)
  const standaloneWorkOrders = workOrders.filter(wo => wo.projectTitle === null)

  // Group contract work orders by project
  const workOrdersByProject = contractWorkOrders.reduce((acc, wo) => {
    const projectTitle = wo.projectTitle || 'Unknown Project'
    if (!acc[projectTitle]) {
      acc[projectTitle] = []
    }
    acc[projectTitle].push(wo)
    return acc
  }, {} as Record<string, WorkOrder[]>)

  // Calculate contract totals
  const contractTotalValue = contractWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const contractPaidValue = contractWorkOrders.filter(wo => wo.paymentStatus === 'PAID').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const contractPendingValue = contractWorkOrders.filter(wo => wo.paymentStatus === 'PENDING_VERIFICATION').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const contractUnpaidValue = contractTotalValue - contractPaidValue - contractPendingValue

  // Calculate standalone totals
  const standaloneTotalValue = standaloneWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const standalonePaidValue = standaloneWorkOrders.filter(wo => wo.paymentStatus === 'PAID').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const standalonePendingValue = standaloneWorkOrders.filter(wo => wo.paymentStatus === 'PENDING_VERIFICATION').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const standaloneUnpaidValue = standaloneTotalValue - standalonePaidValue - standalonePendingValue

  // Combined totals
  const totalValue = contractTotalValue + standaloneTotalValue
  const totalPaidValue = contractPaidValue + standalonePaidValue
  const totalPendingValue = contractPendingValue + standalonePendingValue
  const totalUnpaidValue = contractUnpaidValue + standaloneUnpaidValue

  const toggleProject = (projectTitle: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectTitle) 
        ? prev.filter(p => p !== projectTitle)
        : [...prev, projectTitle]
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contract Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(contractTotalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {contractWorkOrders.length} work order{contractWorkOrders.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(standaloneTotalValue)}</div>
            <p className="text-xs text-blue-600 mt-1">
              {standaloneWorkOrders.length} ad-hoc work order{standaloneWorkOrders.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPendingValue > 0 ? `${formatCurrency(totalPendingValue)} pending` : 'Verified'}
            </p>
          </CardContent>
        </Card>

        <Card className={totalUnpaidValue > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnpaidValue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(totalUnpaidValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalUnpaidValue > 0 ? 'Awaiting payment' : 'All paid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contract Work Orders Section */}
      {contractWorkOrders.length > 0 && (
        <Collapsible open={contractsExpanded} onOpenChange={setContractsExpanded}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {contractsExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Contract Work Orders
                    </CardTitle>
                    <Badge variant="secondary">{contractWorkOrders.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(contractTotalValue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {contractUnpaidValue > 0 ? `${formatCurrency(contractUnpaidValue)} unpaid` : 'All paid'}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {Object.entries(workOrdersByProject).map(([projectTitle, projectWorkOrders]) => (
                  <Collapsible 
                    key={projectTitle} 
                    open={expandedProjects.includes(projectTitle)}
                    onOpenChange={() => toggleProject(projectTitle)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {expandedProjects.includes(projectTitle) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{projectTitle}</span>
                          <Badge variant="outline">{projectWorkOrders.length} work orders</Badge>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(projectWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0))}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t p-3">
                          <BillingWorkOrdersDisplay
                            workOrders={projectWorkOrders}
                            userRole={userRole}
                            onPaySingle={handlePaySingle}
                            onPayGroup={handlePayGroup}
                            onVerifyPayment={handleVerifyPayment}
                            onViewProof={handleViewWorkOrderProof}
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Service Requests Section */}
      {standaloneWorkOrders.length > 0 && (
        <Collapsible open={standaloneExpanded} onOpenChange={setStandaloneExpanded}>
          <Card className="border-blue-200 bg-blue-50/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {standaloneExpanded ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronRight className="h-5 w-5 text-blue-600" />}
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <ClipboardList className="h-5 w-5" />
                      Service Requests
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-700">Ad-hoc</Badge>
                    <Badge variant="secondary">{standaloneWorkOrders.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-700">{formatCurrency(standaloneTotalValue)}</p>
                    <p className="text-xs text-blue-600">
                      {standaloneUnpaidValue > 0 ? `${formatCurrency(standaloneUnpaidValue)} unpaid` : 'All paid'}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <BillingWorkOrdersDisplay
                  workOrders={standaloneWorkOrders}
                  userRole={userRole}
                  onPaySingle={handlePaySingle}
                  onPayGroup={handlePayGroup}
                  onVerifyPayment={handleVerifyPayment}
                  onViewProof={handleViewWorkOrderProof}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {contractWorkOrders.length === 0 && standaloneWorkOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No work orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Work orders will appear here once created
            </p>
          </CardContent>
        </Card>
      )}

      {/* Work Order Payment Submit Dialog */}
      <PaymentSubmitDialog
        open={woPaymentDialogOpen}
        onOpenChange={setWoPaymentDialogOpen}
        workOrderIds={selectedWorkOrderIds}
        workOrderDescriptions={selectedWorkOrderDescriptions}
        totalAmount={selectedWorkOrderTotal}
        branchId={branchId}
        onSuccess={() => {
          fetchData()
          router.refresh()
        }}
      />

      {/* Work Order Payment Verify Dialog */}
      <PaymentVerifyDialog
        open={woVerifyDialogOpen}
        onOpenChange={setWoVerifyDialogOpen}
        workOrders={verifyWorkOrders}
        branchId={branchId}
        onSuccess={() => {
          fetchData()
          router.refresh()
        }}
      />
    </div>
  )
}
