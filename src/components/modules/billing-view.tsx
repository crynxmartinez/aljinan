'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, DollarSign } from 'lucide-react'
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

  // Get active project
  const activeProject = projectId 
    ? projects.find(p => p.id === projectId)
    : projects.find(p => p.status === 'ACTIVE')

  // Filter work orders for active project (include standalone work orders with null projectTitle)
  const activeWorkOrders = activeProject
    ? workOrders.filter(wo => wo.projectTitle === activeProject.title || wo.projectTitle === null)
    : workOrders

  // Calculate totals
  const totalWorkOrderValue = activeWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const completedWorkOrders = activeWorkOrders.filter(wo => wo.stage === 'COMPLETED')
  const completedValue = completedWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  
  // Payment totals
  const paidWorkOrders = activeWorkOrders.filter(wo => wo.paymentStatus === 'PAID')
  const paidValue = paidWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const pendingPaymentWorkOrders = activeWorkOrders.filter(wo => wo.paymentStatus === 'PENDING_VERIFICATION')
  const pendingValue = pendingPaymentWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const unpaidValue = totalWorkOrderValue - paidValue - pendingValue

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Project Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWorkOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeWorkOrders.length} work order{activeWorkOrders.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(completedValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedWorkOrders.length} of {activeWorkOrders.length} completed
            </p>
          </CardContent>
        </Card>

        <Card className={unpaidValue > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unpaidValue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(unpaidValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPaymentWorkOrders.length > 0 
                ? `${pendingPaymentWorkOrders.length} pending verification`
                : unpaidValue > 0 
                  ? 'Awaiting payment'
                  : 'All paid'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Work Orders
          </CardTitle>
          <CardDescription>
            {activeProject ? `Work orders for ${activeProject.title}` : 'All work orders'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No work orders yet</p>
            </div>
          ) : (
            <BillingWorkOrdersDisplay
              workOrders={activeWorkOrders}
              userRole={userRole}
              onPaySingle={handlePaySingle}
              onPayGroup={handlePayGroup}
              onVerifyPayment={handleVerifyPayment}
              onViewProof={handleViewWorkOrderProof}
            />
          )}
        </CardContent>
      </Card>

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
