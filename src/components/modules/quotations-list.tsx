'use client'
import { generatedField } from '@/lib/i18n/generated-content'
import { LocalizedError } from '@/components/localized-error'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate, formatCurrency } from '@/lib/i18n/format-date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Receipt,
  Plus,
  Loader2,
  MoreHorizontal,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileEdit,
} from 'lucide-react'

interface QuotationItem {
  id?: string
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

interface QuotationsListProps {
  branchId: string
}

export function QuotationsList({ branchId }: QuotationsListProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const tql = t.dashboard.quotationsList
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [newQuotation, setNewQuotation] = useState({
    title: '',
    description: '',
    taxRate: 5,
    validUntil: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as QuotationItem[],
  })

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/quotations`)
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [branchId])

  const calculateTotals = (items: QuotationItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = [...newQuotation.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setNewQuotation({ ...newQuotation, items: updatedItems })
  }

  const addItem = () => {
    setNewQuotation({
      ...newQuotation,
      items: [...newQuotation.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (newQuotation.items.length > 1) {
      const updatedItems = newQuotation.items.filter((_, i) => i !== index)
      setNewQuotation({ ...newQuotation, items: updatedItems })
    }
  }

  const handleCreateQuotation = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      // Step 1: Create the quotation
      const response = await fetch(`/api/branches/${branchId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuotation.title,
          description: newQuotation.description,
          taxRate: newQuotation.taxRate,
          validUntil: newQuotation.validUntil || null,
          items: newQuotation.items.filter(item => item.description),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create quotation')
      }

      // Step 2: If sendImmediately, update status to SENT
      if (sendImmediately) {
        const createdQuotation = await response.json()
        await fetch(`/api/branches/${branchId}/quotations/${createdQuotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT' }),
        })
      }

      setCreateDialogOpen(false)
      setNewQuotation({
        title: '',
        description: '',
        taxRate: 5,
        validUntil: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      })
      fetchQuotations()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.system.serverError)
    } finally {
      setCreating(false)
    }
  }

  const handleSendQuotation = async (quotationId: string) => {
    try {
      await api.patch(`/api/branches/${branchId}/quotations/${quotationId}`, { status: 'SENT' })
      fetchQuotations()
      router.refresh()
    } catch (err) {
      console.error('Failed to send quotation:', err)
    }
  }

  const handleDeleteQuotation = async (quotationId: string) => {
    if (!confirm(tql.deleteConfirm)) return

    try {
      await api.delete(`/api/branches/${branchId}/quotations/${quotationId}`)
      fetchQuotations()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete quotation:', err)
    }
  }

  const getStatusBadge = (status: Quotation['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: FileEdit, label: tql.statusDraft },
      SENT: { style: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400', icon: Clock, label: tql.statusSent },
      APPROVED: { style: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400', icon: CheckCircle, label: tql.statusApproved },
      REJECTED: { style: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400', icon: XCircle, label: tql.statusRejected },
      EXPIRED: { style: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400', icon: Clock, label: tql.statusExpired },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const totals = calculateTotals(newQuotation.items, newQuotation.taxRate)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{tql.title}</CardTitle>
            <CardDescription>
              {tql.subtitle}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {tql.newQuote}
          </Button>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{tql.noQuotationsYet}</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {tql.noQuotationsDesc}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                {tql.createQuote}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedQuotation(quotation)
                    setDetailDialogOpen(true)
                  }}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{quotation.title}</h4>
                      {getStatusBadge(quotation.status)}
                    </div>
                    {quotation.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {quotation.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">{formatCurrency(quotation.total, locale)}</span>
                      <span className="text-muted-foreground">
                        {(quotation.items.length === 1 ? tql.itemCountSingular : tql.itemCountPlural).replace('{count}', String(quotation.items.length))}
                      </span>
                      <span className="text-muted-foreground">
                        {tql.createdOn.replace('{date}', formatDate(quotation.createdAt, locale, {}))}
                      </span>
                    </div>
                    {quotation.rejectionNote && (
                      <p className="text-sm text-red-600 mt-2">
                        {tql.rejectionNoteLabel.replace('{note}', quotation.rejectionNote)}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {quotation.status === 'DRAFT' && (
                        <>
                          <DropdownMenuItem onClick={() => handleSendQuotation(quotation.id)}>
                            <Send className="me-2 h-4 w-4" />
                            {tql.sendToClient}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {tql.delete}
                          </DropdownMenuItem>
                        </>
                      )}
                      {quotation.status !== 'DRAFT' && (
                        <DropdownMenuItem disabled>
                          {tql.viewDetails}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tql.createDialogTitle}</DialogTitle>
            <DialogDescription>
              {tql.createDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuotation}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                <LocalizedError message={error} />
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{tql.titleLabel}</Label>
                <Input
                  id="title"
                  value={newQuotation.title}
                  onChange={(e) => setNewQuotation({ ...newQuotation, title: e.target.value })}
                  placeholder={tql.titlePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{tql.descriptionLabel}</Label>
                <Textarea
                  id="description"
                  value={newQuotation.description}
                  onChange={(e) => setNewQuotation({ ...newQuotation, description: e.target.value })}
                  placeholder={tql.descriptionPlaceholder}
                  rows={2}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <Label>{tql.lineItemsLabel}</Label>
                <div className="space-y-2">
                  {newQuotation.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          placeholder={tql.itemDescriptionPlaceholder}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder={tql.qtyPlaceholder}
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder={tql.pricePlaceholder}
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 text-end font-medium">
                        {formatCurrency(item.quantity * item.unitPrice, locale)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={newQuotation.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="me-2 h-4 w-4" />
                  {tql.addItem}
                </Button>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{tql.subtotal}</span>
                  <span>{formatCurrency(totals.subtotal, locale)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>{tql.tax}</span>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      min="0"
                      max="100"
                      value={newQuotation.taxRate}
                      onChange={(e) => setNewQuotation({ ...newQuotation, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                    <span>%</span>
                  </div>
                  <span>{formatCurrency(totals.taxAmount, locale)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>{tql.total}</span>
                  <span>{formatCurrency(totals.total, locale)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">{tql.validUntil}</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={newQuotation.validUntil}
                  onChange={(e) => setNewQuotation({ ...newQuotation, validUntil: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {tql.cancel}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={(e) => handleCreateQuotation(e, false)}
              >
                {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {tql.saveDraft}
              </Button>
              <Button
                type="submit"
                disabled={creating}
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateQuotation(e, true)
                }}
              >
                {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                <Send className="me-2 h-4 w-4" />
                {tql.createAndSend}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quotation Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuotation?.title}</DialogTitle>
            <DialogDescription>{tql.detailDialogDesc}</DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedQuotation.status)}
                <span className="text-lg font-semibold">{formatCurrency(selectedQuotation.total, locale)}</span>
              </div>

              {selectedQuotation.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{tql.descriptionLabel}</p>
                  <p className="text-sm">{selectedQuotation.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{tql.lineItemsLabel}</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-start p-2">{tql.tableDescription}</th>
                        <th className="text-end p-2">{tql.tableQuantity}</th>
                        <th className="text-end p-2">{tql.tableUnitPrice}</th>
                        <th className="text-end p-2">{tql.total}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{generatedField(item, 'description', locale)}</td>
                          <td className="text-end p-2">{item.quantity}</td>
                          <td className="text-end p-2">{formatCurrency(item.unitPrice, locale)}</td>
                          <td className="text-end p-2">{formatCurrency(item.total, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t">
                        <td colSpan={3} className="text-end p-2 font-medium">{tql.subtotal}</td>
                        <td className="text-end p-2">{formatCurrency(selectedQuotation.subtotal, locale)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="text-end p-2 font-medium">{tql.taxWithRate.replace('{rate}', String(selectedQuotation.taxRate))}</td>
                        <td className="text-end p-2">{formatCurrency(selectedQuotation.taxAmount, locale)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="text-end p-2">{tql.total}</td>
                        <td className="text-end p-2">{formatCurrency(selectedQuotation.total, locale)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">{tql.createdLabel}</p>
                  <p>{formatDate(selectedQuotation.createdAt, locale, {})}</p>
                </div>
                {selectedQuotation.validUntil && (
                  <div>
                    <p className="font-medium text-muted-foreground">{tql.validUntil}</p>
                    <p>{formatDate(selectedQuotation.validUntil, locale, {})}</p>
                  </div>
                )}
                {selectedQuotation.sentAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">{tql.sentLabel}</p>
                    <p>{formatDate(selectedQuotation.sentAt, locale, {})}</p>
                  </div>
                )}
                {selectedQuotation.approvedAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">{tql.approvedLabel}</p>
                    <p>{formatDate(selectedQuotation.approvedAt, locale, {})}</p>
                  </div>
                )}
              </div>

              {selectedQuotation.rejectionNote && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">{tql.rejectionNoteTitle}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedQuotation.rejectionNote}</p>
                </div>
              )}

              {selectedQuotation.status === 'DRAFT' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleSendQuotation(selectedQuotation.id)
                      setDetailDialogOpen(false)
                    }}
                    className="flex-1"
                  >
                    <Send className="me-2 h-4 w-4" />
                    {tql.sendToClient}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
