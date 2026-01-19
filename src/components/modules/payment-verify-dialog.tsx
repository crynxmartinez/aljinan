'use client'

import { useState } from 'react'
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
  FileText,
  Loader2,
  CheckCircle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react'

interface WorkOrder {
  id: string
  description: string
  price: number | null
  scheduledDate: string | null
  paymentProofUrl: string | null
  paymentProofType: string | null
  paymentProofFileName: string | null
  paymentSubmittedAt: string | null
}

interface PaymentVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder: WorkOrder | null
  branchId: string
  onSuccess: () => void
}

export function PaymentVerifyDialog({
  open,
  onOpenChange,
  workOrder,
  branchId,
  onSuccess,
}: PaymentVerifyDialogProps) {
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleVerify = async () => {
    if (!workOrder) return
    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_payment',
          workOrderIds: [workOrder.id],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to verify payment')
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setVerifying(false)
    }
  }

  if (!workOrder) return null

  const isImageProof = workOrder.paymentProofUrl?.startsWith('data:image') || 
                       workOrder.paymentProofFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verify Payment
          </DialogTitle>
          <DialogDescription>
            Review the payment proof and confirm if the payment has been received.
          </DialogDescription>
        </DialogHeader>

        {/* Work order info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{workOrder.description}</span>
            <span className="font-bold text-primary">
              {formatCurrency(workOrder.price)}
            </span>
          </div>
          {workOrder.scheduledDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(workOrder.scheduledDate).toLocaleDateString()}
            </div>
          )}
          {workOrder.paymentSubmittedAt && (
            <div className="text-xs text-muted-foreground">
              Payment submitted: {new Date(workOrder.paymentSubmittedAt).toLocaleString()}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Payment proof display */}
        <div className="space-y-3">
          <Label>Payment Proof</Label>
          
          {workOrder.paymentProofType === 'link' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input value={workOrder.paymentProofUrl || ''} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(workOrder.paymentProofUrl!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the button to open the payment link in a new tab
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workOrder.paymentProofFileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isImageProof ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {workOrder.paymentProofFileName}
                </div>
              )}
              
              {isImageProof && workOrder.paymentProofUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={workOrder.paymentProofUrl}
                    alt="Payment proof"
                    className="max-w-full max-h-[300px] object-contain mx-auto"
                  />
                </div>
              ) : workOrder.paymentProofUrl ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(workOrder.paymentProofUrl!, '_blank')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={verifying}
            className="bg-green-600 hover:bg-green-700"
          >
            {verifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirm Payment Received
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
