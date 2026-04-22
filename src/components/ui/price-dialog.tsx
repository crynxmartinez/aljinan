'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign } from 'lucide-react'

interface PriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (price: number) => void
  currentPrice?: number | null
}

export function PriceDialog({ open, onOpenChange, onConfirm, currentPrice }: PriceDialogProps) {
  const [price, setPrice] = useState(currentPrice?.toString() || '')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    const numPrice = parseFloat(price)
    
    if (!price || price.trim() === '') {
      setError('Please enter a price')
      return
    }
    
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price greater than 0')
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
            <DollarSign className="h-5 w-5 text-green-600" />
            Set Work Order Price
          </DialogTitle>
          <DialogDescription>
            Enter the price for this work order in SAR (Saudi Riyal)
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Price (SAR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
                className="pl-14"
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
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            Set Price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
