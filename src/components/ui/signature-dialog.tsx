'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, PenTool } from 'lucide-react'

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

  const handleSign = async () => {
    setSigning(true)
    try {
      await onSign('signed')
      onOpenChange(false)
    } catch (error) {
      // Error handled by parent
    } finally {
      setSigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium mb-2">Signing as:</p>
            <p className="text-lg font-semibold text-primary">{signerName}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Date: {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Click "Sign Document" to confirm your signature
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={signing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={signing}
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
