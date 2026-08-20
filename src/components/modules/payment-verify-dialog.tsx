'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/use-translation'
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
  Image as ImageIcon,
  PenTool,
} from 'lucide-react'
import { SignaturePad } from '@/components/ui/signature-pad'

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
  workOrders: WorkOrder[]
  branchId: string
  onSuccess: () => void
}

export function PaymentVerifyDialog({
  open,
  onOpenChange,
  workOrders,
  branchId,
  onSuccess,
}: PaymentVerifyDialogProps) {
  const { t } = useTranslation()
  const tv = t.dashboard.paymentVerify
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [signature, setSignature] = useState<string | null>(null)

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totalAmount = workOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)

  // Get the first work order's proof (they should all have the same proof if paid together)
  const proofWorkOrder = workOrders[0]
  const isImageProof = proofWorkOrder?.paymentProofUrl?.startsWith('data:image') ||
    proofWorkOrder?.paymentProofFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  const handleVerify = async () => {
    if (workOrders.length === 0) return
    if (!signature) {
      setError(tv.errorNoSignature)
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_payment',
          workOrderIds: workOrders.map(wo => wo.id),
          signature: signature,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to verify payment')
      }

      setSignature(null)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setVerifying(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSignature(null)
      setError('')
    }
    onOpenChange(open)
  }

  if (workOrders.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {tv.title}
          </DialogTitle>
          <DialogDescription>
            {tv.desc}
          </DialogDescription>
        </DialogHeader>

        {/* Work orders list */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium mb-2">
            {workOrders.length === 1 ? tv.workOrder : tv.workOrdersMultiple.replace('{count}', String(workOrders.length))}
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {workOrders.map((wo) => (
              <div key={wo.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{wo.description}</span>
                <span className="font-medium ms-2">{formatCurrency(wo.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-bold">
            <span>{tv.total}</span>
            <span className="text-primary">{formatCurrency(totalAmount)}</span>
          </div>
          {proofWorkOrder?.paymentSubmittedAt && (
            <div className="text-xs text-muted-foreground">
              {tv.paymentSubmitted} {new Date(proofWorkOrder.paymentSubmittedAt).toLocaleString()}
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
          <Label>{tv.paymentProof}</Label>

          {proofWorkOrder?.paymentProofType === 'link' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input value={proofWorkOrder.paymentProofUrl || ''} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(proofWorkOrder.paymentProofUrl!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {tv.openLinkHelp}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {proofWorkOrder?.paymentProofFileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isImageProof ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {proofWorkOrder.paymentProofFileName}
                </div>
              )}

              {isImageProof && proofWorkOrder?.paymentProofUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={proofWorkOrder.paymentProofUrl}
                    alt="Payment proof"
                    className="max-w-full max-h-[200px] object-contain mx-auto"
                  />
                </div>
              ) : proofWorkOrder?.paymentProofUrl ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(proofWorkOrder.paymentProofUrl!, '_blank')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {tv.viewDocument}
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {/* Signature section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            {tv.yourSignature}
          </Label>
          <p className="text-xs text-muted-foreground">
            {tv.signatureHelp}
          </p>
          <SignaturePad
            onSignatureChange={setSignature}
            width={450}
            height={120}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {tv.cancel}
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifying || !signature}
            className="bg-green-600 hover:bg-green-700"
          >
            {verifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {tv.confirmPaymentReceived}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
