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
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleSendQuotation = async (quotationId: string) => {
    try {
      await fetch(`/api/branches/${branchId}/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      fetchQuotations()
      router.refresh()
    } catch (err) {
      console.error('Failed to send quotation:', err)
    }
  }

  const handleDeleteQuotation = async (quotationId: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return

    try {
      await fetch(`/api/branches/${branchId}/quotations/${quotationId}`, {
        method: 'DELETE',
      })
      fetchQuotations()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete quotation:', err)
    }
  }

  const getStatusBadge = (status: Quotation['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileEdit, label: 'Draft' },
      SENT: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Sent' },
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
            <CardTitle>Quotations</CardTitle>
            <CardDescription>
              Create and manage quotes for this branch
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quotations yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Create your first quotation for this branch. Once sent, the client can approve or reject it.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                      <span className="font-semibold">{formatCurrency(quotation.total)}</span>
                      <span className="text-muted-foreground">
                        {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground">
                        Created {new Date(quotation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {quotation.rejectionNote && (
                      <p className="text-sm text-red-600 mt-2">
                        Rejection note: {quotation.rejectionNote}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {quotation.status === 'DRAFT' && (
                        <>
                          <DropdownMenuItem onClick={() => handleSendQuotation(quotation.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                      {quotation.status !== 'DRAFT' && (
                        <DropdownMenuItem disabled>
                          View Details
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
            <DialogTitle>Create New Quotation</DialogTitle>
            <DialogDescription>
              Create a quotation with line items. You can save as draft or send directly to the client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuotation}>
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
                  value={newQuotation.title}
                  onChange={(e) => setNewQuotation({ ...newQuotation, title: e.target.value })}
                  placeholder="e.g., Monthly Pest Control Service"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newQuotation.description}
                  onChange={(e) => setNewQuotation({ ...newQuotation, description: e.target.value })}
                  placeholder="Additional details about this quotation"
                  rows={2}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="space-y-2">
                  {newQuotation.items.map((item, index) => (
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
                          disabled={newQuotation.items.length === 1}
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
                      value={newQuotation.taxRate}
                      onChange={(e) => setNewQuotation({ ...newQuotation, taxRate: parseFloat(e.target.value) || 0 })}
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
                <Label htmlFor="validUntil">Valid Until</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
