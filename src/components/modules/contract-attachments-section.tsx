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
  Award, 
  Download, 
  ExternalLink, 
  Upload,
  Pencil,
  Plus,
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
  certificateUrl: string | null
  certificateFileName: string | null
  isContractor: boolean
  onUpdate?: () => void
}

export function ContractAttachmentsSection({
  contractId,
  branchId,
  fileUrl,
  fileName,
  certificateUrl,
  certificateFileName,
  isContractor,
  onUpdate,
}: ContractAttachmentsSectionProps) {
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [pdfUrl, setPdfUrl] = useState(fileUrl || '')
  const [pdfFileName, setPdfFileName] = useState(fileName || '')
  const [certUrl, setCertUrl] = useState(certificateUrl || '')
  const [certFileName, setCertFileName] = useState(certificateFileName || '')

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

  const handleSaveCert = async () => {
    setSaving(true)
    setError('')
    
    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateUrl: certUrl,
          certificateFileName: certFileName || 'Certificate.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setCertDialogOpen(false)
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

  const openCertDialog = () => {
    setCertUrl(certificateUrl || '')
    setCertFileName(certificateFileName || '')
    setError('')
    setCertDialogOpen(true)
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
                <h4 className="font-medium text-sm">Contract PDF</h4>
                {fileUrl ? (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {fileName || 'Document attached'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No document attached
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
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
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
                    <Download className="h-3 w-3 mr-1" />
                    Download
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
                  <Upload className="h-3 w-3 mr-1" />
                  Attach PDF
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Contractor will attach document
                </p>
              )}
            </div>
          </div>

          {/* Certificate Card */}
          <div className={cn(
            "rounded-lg border-2 p-4 transition-colors",
            certificateUrl 
              ? "border-amber-200 bg-amber-50/50" 
              : "border-dashed border-gray-300 bg-gray-50/50"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                certificateUrl ? "bg-amber-100" : "bg-gray-100"
              )}>
                <Award className={cn(
                  "h-5 w-5",
                  certificateUrl ? "text-amber-600" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">Certificate</h4>
                {certificateUrl ? (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {certificateFileName || 'Certificate attached'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No certificate attached
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              {certificateUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(certificateUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = certificateUrl
                      link.download = certificateFileName || 'certificate.pdf'
                      link.click()
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  {isContractor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openCertDialog}
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
                  onClick={openCertDialog}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Attach Certificate
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Contractor will attach certificate
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
              {fileUrl ? 'Update Contract PDF' : 'Attach Contract PDF'}
            </DialogTitle>
            <DialogDescription>
              Enter the URL where the contract PDF is hosted (Google Drive, Dropbox, etc.)
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdfFileName">File Name</Label>
              <Input
                id="pdfFileName"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder="e.g., Service Agreement 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF URL *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pdfUrl"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePdf} disabled={saving || !pdfUrl}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {certificateUrl ? 'Update Certificate' : 'Attach Certificate'}
            </DialogTitle>
            <DialogDescription>
              Enter the URL where the certificate is hosted (Google Drive, Dropbox, etc.)
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certFileName">File Name</Label>
              <Input
                id="certFileName"
                value={certFileName}
                onChange={(e) => setCertFileName(e.target.value)}
                placeholder="e.g., FSEC Certificate 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certUrl">Certificate URL *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="certUrl"
                    value={certUrl}
                    onChange={(e) => setCertUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCert} disabled={saving || !certUrl}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
