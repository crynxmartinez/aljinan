'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileEdit,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Quotation {
  id: string
  title: string
  description: string | null
  items: QuotationItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  validUntil: string | null
  sentAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionNote: string | null
  createdAt: string
}

interface ClientBranchQuotationsProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchQuotations({ branchId, projectId }: ClientBranchQuotationsProps) {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/quotations`)
      if (response.ok) {
        const data = await response.json()
        const filtered = projectId 
          ? data.filter((q: Quotation & { projectId?: string }) => q.projectId === projectId)
          : data
        setQuotations(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [branchId, projectId])

  const handleAction = async () => {
    if (!selectedQuotation || !actionType) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/branches/${branchId}/quotations/${selectedQuotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          rejectionNote: actionType === 'reject' ? rejectionNote : undefined,
        }),
      })

      if (response.ok) {
        setActionDialogOpen(false)
        setSelectedQuotation(null)
        setActionType(null)
        setRejectionNote('')
        fetchQuotations()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to process action:', err)
    } finally {
      setProcessing(false)
    }
  }

  const openActionDialog = (quotation: Quotation, action: 'approve' | 'reject') => {
    setSelectedQuotation(quotation)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const getStatusBadge = (status: Quotation['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileEdit, label: 'Draft' },
      SENT: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Pending Review' },
      APPROVED: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
      REJECTED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
      EXPIRED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Expired' },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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

  const pendingQuotations = quotations.filter(q => q.status === 'SENT')
  const otherQuotations = quotations.filter(q => q.status !== 'SENT')

  return (
    <>
      <div className="space-y-6">
        {/* Pending Approval Section */}
        {pendingQuotations.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Clock className="h-5 w-5" />
                Pending Your Approval
              </CardTitle>
              <CardDescription>
                Review and approve or reject these quotations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="p-4 bg-white border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{quotation.title}</h4>
                      {quotation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {quotation.description}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(quotation.status)}
                  </div>

                  {/* Line Items */}
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Description</th>
                          <th className="text-right p-2 w-20">Qty</th>
                          <th className="text-right p-2 w-24">Price</th>
                          <th className="text-right p-2 w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotation.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="text-right p-2">{item.quantity}</td>
                            <td className="text-right p-2">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-right p-2">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr className="border-t">
                          <td colSpan={3} className="text-right p-2">Subtotal</td>
                          <td className="text-right p-2">{formatCurrency(quotation.subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right p-2">Tax ({quotation.taxRate}%)</td>
                          <td className="text-right p-2">{formatCurrency(quotation.taxAmount)}</td>
                        </tr>
                        <tr className="font-semibold">
                          <td colSpan={3} className="text-right p-2">Total</td>
                          <td className="text-right p-2">{formatCurrency(quotation.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Sent {new Date(quotation.sentAt!).toLocaleDateString()}
                      {quotation.validUntil && (
                        <> · Valid until {new Date(quotation.validUntil).toLocaleDateString()}</>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openActionDialog(quotation, 'reject')}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => openActionDialog(quotation, 'approve')}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Quotations */}
        <Card>
          <CardHeader>
            <CardTitle>Quotations</CardTitle>
            <CardDescription>
              All quotations for this branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quotations yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Quotations from your contractor will appear here. You can review and approve or reject them.
                </p>
              </div>
            ) : otherQuotations.length === 0 && pendingQuotations.length > 0 ? (
              <p className="text-center text-muted-foreground py-4">
                All quotations are shown in the pending section above.
              </p>
            ) : (
              <div className="space-y-4">
                {otherQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{quotation.title}</h4>
                          {getStatusBadge(quotation.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{formatCurrency(quotation.total)}</span>
                          <span>{quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}</span>
                          {quotation.approvedAt && (
                            <span>Approved {new Date(quotation.approvedAt).toLocaleDateString()}</span>
                          )}
                          {quotation.rejectedAt && (
                            <span>Rejected {new Date(quotation.rejectedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        {quotation.rejectionNote && (
                          <p className="text-sm text-red-600 mt-2">
                            Your note: {quotation.rejectionNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this quotation?'
                : 'Please provide a reason for rejecting this quotation.'}
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="py-4">
              <div className="p-4 bg-muted/50 rounded-lg mb-4">
                <p className="font-medium">{selectedQuotation.title}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(selectedQuotation.total)}</p>
              </div>

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionNote">Reason for rejection</Label>
                  <Textarea
                    id="rejectionNote"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Please explain why you're rejecting this quotation..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
