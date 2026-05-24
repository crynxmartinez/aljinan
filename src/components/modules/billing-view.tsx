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
  workOrderType: string | null
  scheduledDate: string | null
  price: number | null
  isCompleted: boolean
  checklistId: string
  checklistTitle: string
  contractTitle: string | null
  contractSystemId: string | null
  visitIndex: number | null
  paymentDueDate: string | null
  paymentStatus: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID'
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
}

interface ContractPayment {
  id: string
  contractId: string
  contractTitle: string
  paymentNo: number
  dueDate: string | null
  amount: number | null
  status: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID'
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
  paidAt: string | null
}

interface BillingViewProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT'
}

export function BillingView({ branchId, userRole }: BillingViewProps) {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [contractPayments, setContractPayments] = useState<ContractPayment[]>([])
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
  const [contractPaymentsExpanded, setContractPaymentsExpanded] = useState(true)
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
  const [stickerInspectionsExpanded, setStickerInspectionsExpanded] = useState(true)
  const [expandedContracts, setExpandedContracts] = useState<string[]>([])

  const fetchData = async () => {
    try {
      const [woResponse, cpResponse] = await Promise.all([
        fetch(`/api/branches/${branchId}/checklist-items`),
        fetch(`/api/branches/${branchId}/contract-payments`)
      ])

      if (woResponse.ok) {
        const woData = await woResponse.json()
        setWorkOrders(woData)
      }

      if (cpResponse.ok) {
        const cpData = await cpResponse.json()
        setContractPayments(cpData)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [branchId])

  // Initialize expanded contracts when work orders load
  useEffect(() => {
    const contractTitles = [...new Set(workOrders.filter(wo => wo.contractTitle).map(wo => wo.contractTitle as string))]
    setExpandedContracts(contractTitles)
  }, [workOrders])

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount)
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

  // Separate work orders into contract-based, standalone (ad-hoc), and sticker inspections
  const contractWorkOrders = workOrders.filter(wo => wo.contractTitle !== null)
  const standaloneWorkOrders = workOrders.filter(wo => wo.contractTitle === null && wo.workOrderType !== 'STICKER_INSPECTION')
  const stickerInspectionWorkOrders = workOrders.filter(wo => wo.contractTitle === null && wo.workOrderType === 'STICKER_INSPECTION')

  // Group contract work orders by contract title
  const workOrdersByContract = contractWorkOrders.reduce((acc, wo) => {
    const contractTitle = wo.contractTitle || 'Unknown Contract'
    if (!acc[contractTitle]) {
      acc[contractTitle] = []
    }
    acc[contractTitle].push(wo)
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

  // Calculate sticker inspection totals
  const stickerTotalValue = stickerInspectionWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const stickerPaidValue = stickerInspectionWorkOrders.filter(wo => wo.paymentStatus === 'PAID').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const stickerPendingValue = stickerInspectionWorkOrders.filter(wo => wo.paymentStatus === 'PENDING_VERIFICATION').reduce((sum, wo) => sum + (wo.price || 0), 0)
  const stickerUnpaidValue = stickerTotalValue - stickerPaidValue - stickerPendingValue

  // Combined totals
  const totalValue = contractTotalValue + standaloneTotalValue + stickerTotalValue
  const totalPaidValue = contractPaidValue + standalonePaidValue + stickerPaidValue
  const totalPendingValue = contractPendingValue + standalonePendingValue + stickerPendingValue
  const totalUnpaidValue = contractUnpaidValue + standaloneUnpaidValue + stickerUnpaidValue

  const toggleContract = (contractTitle: string) => {
    setExpandedContracts(prev =>
      prev.includes(contractTitle)
        ? prev.filter(c => c !== contractTitle)
        : [...prev, contractTitle]
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
                {Object.entries(workOrdersByContract).map(([contractTitle, contractWOs]) => (
                  <Collapsible
                    key={contractTitle}
                    open={expandedContracts.includes(contractTitle)}
                    onOpenChange={() => toggleContract(contractTitle)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {expandedContracts.includes(contractTitle) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{contractTitle}</span>
                          <Badge variant="outline">{contractWOs.length} work orders</Badge>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(contractWOs.reduce((sum, wo) => sum + (wo.price || 0), 0))}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t p-3">
                          <BillingWorkOrdersDisplay
                            workOrders={contractWOs}
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

      {/* Contract Payments Section */}
      {contractPayments.length > 0 && (
        <Collapsible open={contractPaymentsExpanded} onOpenChange={setContractPaymentsExpanded}>
          <Card className="border-purple-200 bg-purple-50/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-purple-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {contractPaymentsExpanded ? <ChevronDown className="h-5 w-5 text-purple-600" /> : <ChevronRight className="h-5 w-5 text-purple-600" />}
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <DollarSign className="h-5 w-5" />
                      Contract Payments
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>
                    <Badge variant="secondary">{contractPayments.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-700">
                      {formatCurrency(contractPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                    </p>
                    <p className="text-xs text-purple-600">
                      {contractPayments.filter(p => p.status === 'PAID').length} of {contractPayments.length} paid
                    </p>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {contractPayments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white"
                    >
                      <div>
                        <p className="font-medium text-sm">{payment.contractTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Payment {payment.paymentNo} • Due: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                        <Badge
                          variant={payment.status === 'PAID' ? 'default' : payment.status === 'PENDING_VERIFICATION' ? 'secondary' : 'outline'}
                          className={
                            payment.status === 'PAID' ? 'bg-green-100 text-green-700' :
                              payment.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                          }
                        >
                          {payment.status === 'PAID' ? 'Paid' : payment.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Sticker Inspections Section */}
      {stickerInspectionWorkOrders.length > 0 && (
        <Collapsible open={stickerInspectionsExpanded} onOpenChange={setStickerInspectionsExpanded}>
          <Card className="border-amber-200 bg-amber-50/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stickerInspectionsExpanded ? <ChevronDown className="h-5 w-5 text-amber-600" /> : <ChevronRight className="h-5 w-5 text-amber-600" />}
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <ClipboardList className="h-5 w-5" />
                      Sticker Inspections
                    </CardTitle>
                    <Badge className="bg-amber-100 text-amber-700">Equipment</Badge>
                    <Badge variant="secondary">{stickerInspectionWorkOrders.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700">{formatCurrency(stickerTotalValue)}</p>
                    <p className="text-xs text-amber-600">
                      {stickerUnpaidValue > 0 ? `${formatCurrency(stickerUnpaidValue)} unpaid` : 'All paid'}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <BillingWorkOrdersDisplay
                  workOrders={stickerInspectionWorkOrders}
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
      {contractWorkOrders.length === 0 && standaloneWorkOrders.length === 0 && stickerInspectionWorkOrders.length === 0 && (
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
