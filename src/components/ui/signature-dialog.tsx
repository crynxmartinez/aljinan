'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, PenTool, Eraser } from 'lucide-react'

interface SignatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSign: (signature: string) => Promise<void>
  title: string
  description: string
  signerName: string
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSign,
  title,
  description,
  signerName
}: SignatureDialogProps) {
  const [signing, setSigning] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Get the actual display size
        const rect = canvas.getBoundingClientRect()

        // Set canvas internal size to match display size
        canvas.width = rect.width
        canvas.height = rect.height

        // Set drawing style
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [open])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setIsEmpty(false)

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleSign = async () => {
    if (isEmpty) return

    const canvas = canvasRef.current
    if (!canvas) return

    setSigning(true)
    try {
      // Convert canvas to base64 image with compression
      // Use JPEG with quality 0.7 to reduce file size
      const signatureData = canvas.toDataURL('image/jpeg', 0.7)
      await onSign(signatureData)
      onOpenChange(false)
      clearSignature()
    } catch (error) {
      // Error handled by parent
    } finally {
      setSigning(false)
    }
  }

  const handleClose = () => {
    clearSignature()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Signing as: <span className="text-primary">{signerName}</span></p>
                <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={isEmpty || signing}
              >
                <Eraser className="mr-2 h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>

          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-48 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Draw your signature above using mouse or touch
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={signing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={isEmpty || signing}
          >
            {signing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <PenTool className="mr-2 h-4 w-4" />
                Sign Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
