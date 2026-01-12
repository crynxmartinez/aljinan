'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  description: string | null
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED'
  dueDate: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
}

interface ClientBranchInvoicesProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchInvoices({ branchId, projectId }: ClientBranchInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/invoices`)
      if (response.ok) {
        const data = await response.json()
        const filtered = projectId 
          ? data.filter((i: Invoice & { projectId?: string }) => i.projectId === projectId)
          : data
        setInvoices(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [branchId, projectId])

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
      SENT: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Awaiting Payment' },
      PAID: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Paid' },
      PARTIAL: { style: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Partial Payment' },
      OVERDUE: { style: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Overdue' },
      CANCELLED: { style: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' },
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

  const unpaidInvoices = invoices.filter(inv => inv.status === 'SENT' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE')
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID')

  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {unpaidInvoices.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <DollarSign className="h-5 w-5" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? 's' : ''} awaiting payment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices Awaiting Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unpaidInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <h4 className="font-medium">{invoice.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {invoice.dueDate && (
                          <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
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
                </div>

                {expandedInvoice === invoice.id && (
                  <div className="border-t bg-muted/30 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left pb-2">Description</th>
                          <th className="text-right pb-2 w-20">Qty</th>
                          <th className="text-right pb-2 w-24">Price</th>
                          <th className="text-right pb-2 w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="border-t border-muted">
                            <td className="py-2">{item.description}</td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-right py-2">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t">
                        <tr>
                          <td colSpan={3} className="text-right py-2">Subtotal</td>
                          <td className="text-right py-2">{formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right py-1">Tax ({invoice.taxRate}%)</td>
                          <td className="text-right py-1">{formatCurrency(invoice.taxAmount)}</td>
                        </tr>
                        <tr className="font-semibold">
                          <td colSpan={3} className="text-right py-2">Total</td>
                          <td className="text-right py-2">{formatCurrency(invoice.total)}</td>
                        </tr>
                        {invoice.amountPaid > 0 && (
                          <>
                            <tr className="text-green-600">
                              <td colSpan={3} className="text-right py-1">Amount Paid</td>
                              <td className="text-right py-1">-{formatCurrency(invoice.amountPaid)}</td>
                            </tr>
                            <tr className="font-semibold text-amber-600">
                              <td colSpan={3} className="text-right py-2">Balance Due</td>
                              <td className="text-right py-2">{formatCurrency(invoice.total - invoice.amountPaid)}</td>
                            </tr>
                          </>
                        )}
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Invoices / Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All invoices for this branch</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground max-w-md">
                Invoices from your contractor will appear here.
              </p>
            </div>
          ) : paidInvoices.length === 0 && unpaidInvoices.length > 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No paid invoices yet. Outstanding invoices are shown above.
            </p>
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
    </div>
  )
}
