'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface PriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (price: number) => void
  currentPrice?: number | null
}

export function PriceDialog({ open, onOpenChange, onConfirm, currentPrice }: PriceDialogProps) {
  const { t } = useTranslation()
  const tu = t.uiComponents
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  // Update price when dialog opens or currentPrice changes
  useEffect(() => {
    if (open) {
      setPrice(currentPrice?.toString() || '')
      setError('')
    }
  }, [open, currentPrice])

  const handleConfirm = () => {
    const numPrice = parseFloat(price)

    if (!price || price.trim() === '') {
      setError(tu.priceDialog.enterPrice)
      return
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      setError(tu.priceDialog.invalidPrice)
      return
    }

    onConfirm(numPrice)
    setPrice('')
    setError('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setPrice(currentPrice?.toString() || '')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            {tu.priceDialog.title}
          </DialogTitle>
          <DialogDescription>
            {tu.priceDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="price">{tu.priceDialog.priceLabel}</Label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                SAR
              </span>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm()
                  }
                }}
                className="ps-14"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {tu.cancel}
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            {tu.priceDialog.setPrice}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
