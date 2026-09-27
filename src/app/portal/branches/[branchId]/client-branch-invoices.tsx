'use client'
import { generatedField } from '@/lib/i18n/generated-content'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Banknote,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate as formatDateUtil } from '@/lib/i18n/format-date'

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
}

export function ClientBranchInvoices({ branchId }: ClientBranchInvoicesProps) {
  const { t, locale } = useTranslation()
  const tc = t.dashboard.clientBranchInvoicesPage
  const dateLocale = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US'
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/invoices`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [branchId])

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: Clock, label: tc.statusDraft },
      SENT: { style: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400', icon: Clock, label: tc.statusAwaitingPayment },
      PAID: { style: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400', icon: CheckCircle, label: tc.statusPaid },
      PARTIAL: { style: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400', icon: AlertTriangle, label: tc.statusPartialPayment },
      OVERDUE: { style: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400', icon: AlertTriangle, label: tc.statusOverdue },
      CANCELLED: { style: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: XCircle, label: tc.statusCancelled },
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
    return new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'SAR' }).format(amount)
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
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Banknote className="h-5 w-5" />
              {tc.outstandingBalance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-300">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {tc.invoiceCountAwaiting.replace('{count}', String(unpaidInvoices.length))}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tc.invoicesAwaitingPaymentTitle}</CardTitle>
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
                          <span>{tc.dueLabel} {formatDateUtil(invoice.dueDate, locale)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-lg font-semibold">{formatCurrency(invoice.total)}</div>
                      {invoice.amountPaid > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {tc.paidLabel} {formatCurrency(invoice.amountPaid)}
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
                          <th className="text-start pb-2">{tc.descriptionCol}</th>
                          <th className="text-end pb-2 w-20">{tc.quantityCol}</th>
                          <th className="text-end pb-2 w-24">{tc.priceCol}</th>
                          <th className="text-end pb-2 w-24">{tc.totalCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="border-t border-muted">
                            <td className="py-2">{generatedField(item, 'description', locale)}</td>
                            <td className="text-end py-2">{item.quantity}</td>
                            <td className="text-end py-2">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-end py-2">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t">
                        <tr>
                          <td colSpan={3} className="text-end py-2">{tc.subtotalLabel}</td>
                          <td className="text-end py-2">{formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-end py-1">{tc.taxLabel.replace('{rate}', String(invoice.taxRate))}</td>
                          <td className="text-end py-1">{formatCurrency(invoice.taxAmount)}</td>
                        </tr>
                        <tr className="font-semibold">
                          <td colSpan={3} className="text-end py-2">{tc.totalLabel}</td>
                          <td className="text-end py-2">{formatCurrency(invoice.total)}</td>
                        </tr>
                        {invoice.amountPaid > 0 && (
                          <>
                            <tr className="text-green-600">
                              <td colSpan={3} className="text-end py-1">{tc.amountPaidLabel}</td>
                              <td className="text-end py-1">-{formatCurrency(invoice.amountPaid)}</td>
                            </tr>
                            <tr className="font-semibold text-amber-600">
                              <td colSpan={3} className="text-end py-2">{tc.balanceDueLabel}</td>
                              <td className="text-end py-2">{formatCurrency(invoice.total - invoice.amountPaid)}</td>
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
          <CardTitle>{tc.paymentHistoryTitle}</CardTitle>
          <CardDescription>{tc.paymentHistoryDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Banknote className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{tc.noInvoicesYet}</h3>
              <p className="text-muted-foreground max-w-md">
                {tc.noInvoicesDesc}
              </p>
            </div>
          ) : paidInvoices.length === 0 && unpaidInvoices.length > 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {tc.noPaidInvoicesYet}
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
                      {tc.paidOnLabel.replace('{date}', invoice.paidAt ? formatDateUtil(invoice.paidAt, locale) : tc.notAvailable)}
                    </p>
                  </div>
                  <div className="text-end">
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
