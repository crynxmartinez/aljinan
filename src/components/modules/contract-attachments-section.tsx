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
  Download,
  ExternalLink,
  Upload,
  Pencil,
  Loader2,
  FileCheck,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractAttachmentsSectionProps {
  contractId: string
  branchId: string
  fileUrl: string | null
  fileName: string | null
  isContractor: boolean
  onUpdate?: () => void
}

export function ContractAttachmentsSection({
  contractId,
  branchId,
  fileUrl,
  fileName,
  isContractor,
  onUpdate,
}: ContractAttachmentsSectionProps) {
  const { t } = useTranslation()
  const tca = t.dashboard.contractAttachments
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [pdfUrl, setPdfUrl] = useState(fileUrl || '')
  const [pdfFileName, setPdfFileName] = useState(fileName || '')

  const handleSavePdf = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: pdfUrl,
          fileName: pdfFileName || 'Contract Document.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setPdfDialogOpen(false)
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const openPdfDialog = () => {
    setPdfUrl(fileUrl || '')
    setPdfFileName(fileName || '')
    setError('')
    setPdfDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Contract PDF Card */}
          <div className={cn(
            "rounded-lg border-2 p-4 transition-colors",
            fileUrl
              ? "border-blue-200 bg-blue-50/50"
              : "border-dashed border-gray-300 bg-gray-50/50"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                fileUrl ? "bg-blue-100" : "bg-gray-100"
              )}>
                <FileText className={cn(
                  "h-5 w-5",
                  fileUrl ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{tca.contractPdf}</h4>
                {fileUrl ? (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {fileName || tca.documentAttached}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tca.noDocumentAttached}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {fileUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 me-1" />
                    {tca.view}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = fileUrl
                      link.download = fileName || 'contract.pdf'
                      link.click()
                    }}
                  >
                    <Download className="h-3 w-3 me-1" />
                    {tca.download}
                  </Button>
                  {isContractor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openPdfDialog}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </>
              ) : isContractor ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={openPdfDialog}
                >
                  <Upload className="h-3 w-3 me-1" />
                  {tca.attachPdf}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {tca.contractorWillAttach}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {fileUrl ? tca.updateContractPdf : tca.attachContractPdf}
            </DialogTitle>
            <DialogDescription>
              {tca.pdfUrlDesc}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdfFileName">{tca.fileName}</Label>
              <Input
                id="pdfFileName"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder={tca.fileNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">{tca.pdfUrl}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pdfUrl"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="ps-9"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              {tca.cancel}
            </Button>
            <Button onClick={handleSavePdf} disabled={saving || !pdfUrl}>
              {saving ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="me-2 h-4 w-4" />
              )}
              {tca.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
