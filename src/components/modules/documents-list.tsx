'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Loader2,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  File,
  Filter,
} from 'lucide-react'

// Unified document type
interface UnifiedDocument {
  id: string
  fileName: string
  fileUrl: string
  source: 'quote' | 'request' | 'report' | 'contract' | 'certificate' | 'generated'
  sourceLabel: string
  relatedTo: string
  relatedToId: string
  relatedToUrl?: string
  uploadedBy: string
  uploadedById: string
  uploadedAt: string
  expiryDate?: string | null
  fileType: 'image' | 'pdf' | 'document'
}

interface DocumentsListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT'
}

type SourceFilter = 'all' | 'quote' | 'request' | 'report' | 'contract' | 'certificate' | 'generated'
type ExpiryFilter = 'all' | 'expired' | 'expiring' | 'valid' | 'no-expiry'

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'quote', label: 'Quotations' },
  { value: 'request', label: 'Request Photos' },
  { value: 'report', label: 'Report Photos' },
  { value: 'contract', label: 'Contracts' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'generated', label: 'Generated' },
]

const EXPIRY_OPTIONS: { value: ExpiryFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'expired', label: 'Expired' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'valid', label: 'Valid' },
  { value: 'no-expiry', label: 'No Expiry' },
]

function getExpiryStatus(expiryDate: string | null | undefined): { status: 'valid' | 'expiring' | 'expired' | 'none'; daysLeft: number } {
  if (!expiryDate) return { status: 'none', daysLeft: 0 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: 'expired', daysLeft: diffDays }
  if (diffDays <= 30) return { status: 'expiring', daysLeft: diffDays }
  return { status: 'valid', daysLeft: diffDays }
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'image':
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />
    default:
      return <File className="h-4 w-4 text-gray-500" />
  }
}

function getSourceBadgeColor(source: string): string {
  switch (source) {
    case 'quote':
      return 'bg-purple-100 text-purple-700'
    case 'request':
      return 'bg-blue-100 text-blue-700'
    case 'report':
      return 'bg-green-100 text-green-700'
    case 'contract':
      return 'bg-orange-100 text-orange-700'
    case 'certificate':
      return 'bg-amber-100 text-amber-700'
    case 'generated':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function DocumentsList({ branchId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null)

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [branchId])

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Source filter
    if (sourceFilter !== 'all' && doc.source !== sourceFilter) {
      return false
    }

    // Expiry filter
    if (expiryFilter !== 'all') {
      const expiryInfo = getExpiryStatus(doc.expiryDate)
      switch (expiryFilter) {
        case 'expired':
          if (expiryInfo.status !== 'expired') return false
          break
        case 'expiring':
          if (expiryInfo.status !== 'expiring') return false
          break
        case 'valid':
          if (expiryInfo.status !== 'valid') return false
          break
        case 'no-expiry':
          if (expiryInfo.status !== 'none') return false
          break
      }
    }

    return true
  })

  // Count documents by expiry status (only those with expiry dates)
  const expiringCount = documents.filter(d => d.expiryDate && getExpiryStatus(d.expiryDate).status === 'expiring').length
  const expiredCount = documents.filter(d => d.expiryDate && getExpiryStatus(d.expiryDate).status === 'expired').length

  const openPreview = (doc: UnifiedDocument) => {
    if (!doc.fileUrl) return

    if (doc.fileType === 'image') {
      setPreviewFile({ url: doc.fileUrl, name: doc.fileName, type: 'image' })
      setPreviewOpen(true)
    } else if (doc.fileType === 'pdf') {
      setPreviewFile({ url: doc.fileUrl, name: doc.fileName, type: 'pdf' })
      setPreviewOpen(true)
    } else {
      window.open(doc.fileUrl, '_blank')
    }
  }

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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              All uploaded files and documents for this branch
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiredCount} Expired
              </Badge>
            )}
            {expiringCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expiringCount} Expiring Soon
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={(v) => setExpiryFilter(v as ExpiryFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Expiry Status" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(sourceFilter !== 'all' || expiryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSourceFilter('all'); setExpiryFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredDocuments.length} of {documents.length} documents
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents match filters'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {documents.length === 0
                  ? 'Documents uploaded from requests, quotes, reports, and contracts will appear here.'
                  : 'Try adjusting your filters to see more documents.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const expiryInfo = getExpiryStatus(doc.expiryDate)
                  return (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openPreview(doc)}>
                      <TableCell>
                        {getFileIcon(doc.fileType)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium truncate max-w-[200px]" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSourceBadgeColor(doc.source)}>
                          {doc.sourceLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]" title={doc.relatedTo}>
                          {doc.relatedTo}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{doc.uploadedBy}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell>
                        {expiryInfo.status === 'expired' && (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Expired
                          </Badge>
                        )}
                        {expiryInfo.status === 'expiring' && (
                          <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            {expiryInfo.daysLeft}d
                          </Badge>
                        )}
                        {expiryInfo.status === 'valid' && (
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Valid
                          </Badge>
                        )}
                        {expiryInfo.status === 'none' && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openPreview(doc); }}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.fileUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank'); }}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Image Preview */}
      {previewFile?.type === 'image' && (
        <ImageLightbox
          images={[{ url: previewFile.url, name: previewFile.name }]}
          open={previewOpen}
          onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewFile(null); } }}
        />
      )}

      {/* PDF Preview */}
      {previewFile?.type === 'pdf' && (
        <PDFViewer
          url={previewFile.url}
          name={previewFile.name}
          open={previewOpen}
          onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewFile(null); } }}
        />
      )}
    </>
  )
}
