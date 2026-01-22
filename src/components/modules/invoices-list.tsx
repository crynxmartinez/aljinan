'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  DollarSign,
  Plus,
  Loader2,
  MoreHorizontal,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileEdit,
  XCircle,
} from 'lucide-react'

interface InvoiceItem {
  id?: string
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

interface InvoicesListProps {
  branchId: string
  projectId?: string | null
}

export function InvoicesList({ branchId, projectId }: InvoicesListProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [newInvoice, setNewInvoice] = useState({
    title: '',
    description: '',
    taxRate: 5,
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
  })

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

  const calculateTotals = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...newInvoice.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }
    setNewInvoice({ ...newInvoice, items: updatedItems })
  }

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice({ ...newInvoice, items: newInvoice.items.filter((_, i) => i !== index) })
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      // Step 1: Create the invoice
      const response = await fetch(`/api/branches/${branchId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newInvoice.title,
          description: newInvoice.description,
          taxRate: newInvoice.taxRate,
          dueDate: newInvoice.dueDate || null,
          items: newInvoice.items.filter(item => item.description),
          projectId: projectId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create invoice')
      }

      // Step 2: If sendImmediately, update status to SENT
      if (sendImmediately) {
        const createdInvoice = await response.json()
        await fetch(`/api/branches/${branchId}/invoices/${createdInvoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT' }),
        })
      }

      setCreateDialogOpen(false)
      setNewInvoice({
        title: '',
        description: '',
        taxRate: 5,
        dueDate: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      })
      fetchInvoices()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await fetch(`/api/branches/${branchId}/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      fetchInvoices()
      router.refresh()
    } catch (err) {
      console.error('Failed to send invoice:', err)
    }
  }

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      await fetch(`/api/branches/${branchId}/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      fetchInvoices()
      router.refresh()
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await fetch(`/api/branches/${branchId}/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      fetchInvoices()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete invoice:', err)
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileEdit, label: 'Draft' },
      SENT: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Sent' },
      PAID: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Paid' },
      PARTIAL: { style: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Partial' },
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
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount)
  }

  const totals = calculateTotals(newInvoice.items, newInvoice.taxRate)

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
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Create and manage invoices for this branch</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Create your first invoice for this branch.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedInvoice(invoice)
                    setDetailDialogOpen(true)
                  }}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
                      <h4 className="font-medium">{invoice.title}</h4>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                      {invoice.status === 'PARTIAL' && (
                        <span className="text-muted-foreground">
                          Paid: {formatCurrency(invoice.amountPaid)}
                        </span>
                      )}
                      {invoice.dueDate && (
                        <span className="text-muted-foreground">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invoice.status === 'DRAFT' && (
                        <>
                          <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                      {(invoice.status === 'SENT' || invoice.status === 'PARTIAL') && (
                        <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
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

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice with line items.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newInvoice.title}
                  onChange={(e) => setNewInvoice({ ...newInvoice, title: e.target.value })}
                  placeholder="e.g., Monthly Service - January 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  placeholder="Additional details"
                  rows={2}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={newInvoice.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>Tax</span>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      min="0"
                      max="100"
                      value={newInvoice.taxRate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                    <span>%</span>
                  </div>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline"
                disabled={creating}
                onClick={(e) => handleCreateInvoice(e, false)}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button 
                type="submit" 
                disabled={creating}
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateInvoice(e, true)
                }}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Create & Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">{selectedInvoice?.invoiceNumber}</span>
              {selectedInvoice?.title}
            </DialogTitle>
            <DialogDescription>Invoice Details</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedInvoice.status)}
                <span className="text-lg font-semibold">{formatCurrency(selectedInvoice.total)}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Line Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Description</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{item.description}</td>
                          <td className="text-right p-2">{item.quantity}</td>
                          <td className="text-right p-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right p-2">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t">
                        <td colSpan={3} className="text-right p-2 font-medium">Subtotal</td>
                        <td className="text-right p-2">{formatCurrency(selectedInvoice.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="text-right p-2 font-medium">Tax ({selectedInvoice.taxRate}%)</td>
                        <td className="text-right p-2">{formatCurrency(selectedInvoice.taxAmount)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right p-2">Total</td>
                        <td className="text-right p-2">{formatCurrency(selectedInvoice.total)}</td>
                      </tr>
                      {selectedInvoice.amountPaid > 0 && (
                        <tr>
                          <td colSpan={3} className="text-right p-2 font-medium text-green-600">Amount Paid</td>
                          <td className="text-right p-2 text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedInvoice.dueDate && (
                  <div>
                    <p className="font-medium text-muted-foreground">Due Date</p>
                    <p>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedInvoice.sentAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">Sent</p>
                    <p>{new Date(selectedInvoice.sentAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedInvoice.paidAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">Paid</p>
                    <p>{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedInvoice.status === 'DRAFT' && (
                  <Button 
                    onClick={() => {
                      handleSendInvoice(selectedInvoice.id)
                      setDetailDialogOpen(false)
                    }}
                    className="flex-1"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send to Client
                  </Button>
                )}
                {(selectedInvoice.status === 'SENT' || selectedInvoice.status === 'PARTIAL') && (
                  <Button 
                    onClick={() => {
                      handleMarkPaid(selectedInvoice.id)
                      setDetailDialogOpen(false)
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
