'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Send,
  Eye,
  Calendar,
  History,
} from 'lucide-react'

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
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  description: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  status: 'DRAFT' | 'SENT' | 'PAYMENT_PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED'
  dueDate: string | null
  sentAt: string | null
  paidAt: string | null
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
  createdAt: string
  projectId: string | null
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
  userRole: 'CONTRACTOR' | 'CLIENT' | 'MANAGER'
}

export function BillingView({ branchId, projectId, userRole }: BillingViewProps) {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('current')
  
  // Payment proof dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentProofType, setPaymentProofType] = useState<'file' | 'link'>('file')
  const [paymentLink, setPaymentLink] = useState('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // View proof dialog
  const [viewProofDialogOpen, setViewProofDialogOpen] = useState(false)
  const [proofInvoice, setProofInvoice] = useState<Invoice | null>(null)

  // Confirm payment state
  const [confirming, setConfirming] = useState(false)

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

      // Fetch invoices
      const invoicesResponse = await fetch(`/api/branches/${branchId}/invoices`)
      if (invoicesResponse.ok) {
        const invData = await invoicesResponse.json()
        const filtered = projectId 
          ? invData.filter((i: Invoice) => i.projectId === projectId)
          : invData
        setInvoices(filtered)
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

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
      SENT: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Awaiting Payment' },
      PAYMENT_PENDING: { style: 'bg-amber-100 text-amber-700', icon: AlertTriangle, label: 'Payment Pending' },
      PAID: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Paid' },
      PARTIAL: { style: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Partial Payment' },
      OVERDUE: { style: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Overdue' },
      CANCELLED: { style: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' },
    }
    const { style, icon: Icon, label } = config[status] || config.DRAFT
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getStageBadge = (stage: string) => {
    const config: Record<string, { style: string; label: string }> = {
      REQUESTED: { style: 'bg-gray-100 text-gray-700', label: 'Requested' },
      SCHEDULED: { style: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
      IN_PROGRESS: { style: 'bg-amber-100 text-amber-700', label: 'In Progress' },
      FOR_REVIEW: { style: 'bg-purple-100 text-purple-700', label: 'For Review' },
      COMPLETED: { style: 'bg-green-100 text-green-700', label: 'Completed' },
    }
    const { style, label } = config[stage] || { style: 'bg-gray-100 text-gray-700', label: stage }
    return <Badge className={style}>{label}</Badge>
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPaymentFile(file)
    }
  }

  const handleSubmitPaymentProof = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    setError('')

    try {
      let proofUrl = ''
      let proofFileName = ''

      if (paymentProofType === 'link') {
        if (!paymentLink) {
          setError('Please enter a payment link')
          setSubmitting(false)
          return
        }
        proofUrl = paymentLink
      } else {
        if (!paymentFile) {
          setError('Please select a file')
          setSubmitting(false)
          return
        }
        // Convert file to base64 data URL for now
        // In production, you'd upload to a storage service
        const reader = new FileReader()
        proofUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(paymentFile)
        })
        proofFileName = paymentFile.name
      }

      const response = await fetch(`/api/branches/${branchId}/invoices/${selectedInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_payment_proof',
          paymentProofUrl: proofUrl,
          paymentProofType: paymentProofType,
          paymentProofFileName: proofFileName || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit payment proof')
      }

      setPaymentDialogOpen(false)
      setPaymentLink('')
      setPaymentFile(null)
      setSelectedInvoice(null)
      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmPayment = async (invoice: Invoice) => {
    setConfirming(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_payment',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to confirm payment')
      }

      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setConfirming(false)
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentProofType('file')
    setPaymentLink('')
    setPaymentFile(null)
    setError('')
    setPaymentDialogOpen(true)
  }

  const openViewProofDialog = (invoice: Invoice) => {
    setProofInvoice(invoice)
    setViewProofDialogOpen(true)
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

  // Filter work orders for active project
  const activeWorkOrders = activeProject
    ? workOrders.filter(wo => wo.projectTitle === activeProject.title)
    : workOrders

  // Calculate totals
  const totalWorkOrderValue = activeWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)
  const completedWorkOrders = activeWorkOrders.filter(wo => wo.stage === 'COMPLETED')
  const completedValue = completedWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)

  // Invoices
  const unpaidInvoices = invoices.filter(inv => 
    inv.status === 'SENT' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE' || inv.status === 'PAYMENT_PENDING'
  )
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID')
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)

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

        <Card className={unpaidInvoices.length > 0 ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unpaidInvoices.length > 0 ? 'text-amber-600' : ''}`}>
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? 's' : ''} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Current Billing vs History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Current Billing
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Billing History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 space-y-6">
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
                <div className="space-y-3">
                  {activeWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{wo.description}</span>
                          {getStageBadge(wo.stage)}
                          {wo.type === 'ADHOC' && (
                            <Badge variant="outline" className="text-xs">Ad-hoc</Badge>
                          )}
                        </div>
                        {wo.scheduledDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {new Date(wo.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(wo.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Awaiting Payment */}
          {unpaidInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Invoices Awaiting Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unpaidInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <h4 className="font-medium">{invoice.title}</h4>
                        {invoice.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{formatCurrency(invoice.total)}</div>
                        {invoice.amountPaid > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Paid: {formatCurrency(invoice.amountPaid)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {userRole === 'CLIENT' && invoice.status === 'SENT' && (
                        <Button onClick={() => openPaymentDialog(invoice)}>
                          <Send className="mr-2 h-4 w-4" />
                          Payment Sent
                        </Button>
                      )}

                      {invoice.status === 'PAYMENT_PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => openViewProofDialog(invoice)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Proof
                          </Button>
                          {userRole === 'CONTRACTOR' && (
                            <Button
                              onClick={() => handleConfirmPayment(invoice)}
                              disabled={confirming}
                            >
                              {confirming ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Confirm Payment
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Completed payments and past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {paidInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paidInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <h4 className="font-medium text-sm">{invoice.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(invoice.total)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Proof Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Payment Proof</DialogTitle>
            <DialogDescription>
              Upload a screenshot or receipt of your payment, or provide a payment link.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentProofType === 'file' ? 'default' : 'outline'}
                onClick={() => setPaymentProofType('file')}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={paymentProofType === 'link' ? 'default' : 'outline'}
                onClick={() => setPaymentProofType('link')}
                className="flex-1"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Paste Link
              </Button>
            </div>

            {paymentProofType === 'file' ? (
              <div className="space-y-2">
                <Label>Payment Screenshot / Receipt</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {paymentFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-primary" />
                      <p className="font-medium">{paymentFile.name}</p>
                      <p className="text-sm text-muted-foreground">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Click to upload PDF, image, or document</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="paymentLink">Payment Link</Label>
                <Input
                  id="paymentLink"
                  type="url"
                  placeholder="https://..."
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a link to your payment confirmation or transaction receipt
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPaymentProof} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Proof Dialog */}
      <Dialog open={viewProofDialogOpen} onOpenChange={setViewProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              {proofInvoice?.paymentSubmittedAt && (
                <>Submitted on {new Date(proofInvoice.paymentSubmittedAt).toLocaleString()}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {proofInvoice && (
            <div className="space-y-4">
              {proofInvoice.paymentProofType === 'link' ? (
                <div className="space-y-2">
                  <Label>Payment Link</Label>
                  <div className="flex items-center gap-2">
                    <Input value={proofInvoice.paymentProofUrl || ''} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => window.open(proofInvoice.paymentProofUrl!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Uploaded File</Label>
                  {proofInvoice.paymentProofFileName && (
                    <p className="text-sm text-muted-foreground">{proofInvoice.paymentProofFileName}</p>
                  )}
                  {proofInvoice.paymentProofUrl?.startsWith('data:image') ? (
                    <img
                      src={proofInvoice.paymentProofUrl}
                      alt="Payment proof"
                      className="max-w-full rounded-lg border"
                    />
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => window.open(proofInvoice.paymentProofUrl!, '_blank')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Document
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProofDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
