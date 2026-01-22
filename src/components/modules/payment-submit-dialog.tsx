'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Upload,
  Link as LinkIcon,
  FileText,
  Loader2,
  Send,
  CreditCard,
} from 'lucide-react'

interface PaymentSubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrderIds: string[]
  workOrderDescriptions: string[]
  totalAmount: number
  branchId: string
  onSuccess: () => void
}

export function PaymentSubmitDialog({
  open,
  onOpenChange,
  workOrderIds,
  workOrderDescriptions,
  totalAmount,
  branchId,
  onSuccess,
}: PaymentSubmitDialogProps) {
  const [paymentProofType, setPaymentProofType] = useState<'file' | 'link'>('file')
  const [paymentLink, setPaymentLink] = useState('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPaymentFile(file)
      setError('')
    }
  }

  const resetForm = () => {
    setPaymentProofType('file')
    setPaymentLink('')
    setPaymentFile(null)
    setError('')
  }

  const handleSubmit = async () => {
    if (workOrderIds.length === 0) return
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
        // Convert file to base64 data URL
        const reader = new FileReader()
        proofUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(paymentFile)
        })
        proofFileName = paymentFile.name
      }

      // Submit payment proof for all work orders
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_payment',
          workOrderIds,
          paymentProofUrl: proofUrl,
          paymentProofType: paymentProofType,
          paymentProofFileName: proofFileName || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit payment proof')
      }

      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const isMultiple = workOrderIds.length > 1

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Submit Payment Proof
          </DialogTitle>
          <DialogDescription>
            {isMultiple 
              ? `Submit payment proof for ${workOrderIds.length} work orders`
              : 'Upload a screenshot or receipt of your payment'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Work order summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium">
            {isMultiple ? 'Work Orders:' : 'Work Order:'}
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {workOrderDescriptions.slice(0, 5).map((desc, idx) => (
              <li key={idx} className="truncate">• {desc}</li>
            ))}
            {workOrderDescriptions.length > 5 && (
              <li className="text-xs">...and {workOrderDescriptions.length - 5} more</li>
            )}
          </ul>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total Amount:</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
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
  )
}
