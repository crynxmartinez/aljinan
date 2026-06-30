'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileCheck,
  ScrollText,
  Camera,
  Award,
  Sparkles,
} from 'lucide-react'

type SourceType = 'quote' | 'request' | 'report' | 'contract' | 'certificate' | 'generated' | 'payment_proof'

// Unified document type
interface UnifiedDocument {
  id: string
  fileName: string
  fileUrl: string
  source: SourceType
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

const SECTION_CONFIG: {
  source: SourceType
  label: string
  icon: React.ReactNode
  badgeClass: string
}[] = [
    {
      source: 'payment_proof',
      label: 'Proof of Payment',
      icon: <CreditCard className="h-4 w-4" />,
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      source: 'certificate',
      label: 'Certificates',
      icon: <Award className="h-4 w-4" />,
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      source: 'contract',
      label: 'Contracts',
      icon: <FileCheck className="h-4 w-4" />,
      badgeClass: 'bg-orange-100 text-orange-700',
    },
    {
      source: 'quote',
      label: 'Quotations',
      icon: <ScrollText className="h-4 w-4" />,
      badgeClass: 'bg-purple-100 text-purple-700',
    },
    {
      source: 'report',
      label: 'Report Photos',
      icon: <Camera className="h-4 w-4" />,
      badgeClass: 'bg-green-100 text-green-700',
    },
    {
      source: 'request',
      label: 'Request Photos',
      icon: <Camera className="h-4 w-4" />,
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      source: 'generated',
      label: 'Generated Documents',
      icon: <Sparkles className="h-4 w-4" />,
      badgeClass: 'bg-gray-100 text-gray-700',
    },
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
    case 'image': return <ImageIcon className="h-4 w-4 text-blue-500" />
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />
    default: return <File className="h-4 w-4 text-gray-500" />
  }
}

export function DocumentsList({ branchId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<SourceType>>(new Set())
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

  const toggleSection = (source: SourceType) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(source)) {
        next.delete(source)
      } else {
        next.add(source)
      }
      return next
    })
  }

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

  const expiringCount = documents.filter(d => d.expiryDate && getExpiryStatus(d.expiryDate).status === 'expiring').length
  const expiredCount = documents.filter(d => d.expiryDate && getExpiryStatus(d.expiryDate).status === 'expired').length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const docsBySource = (source: SourceType) => documents.filter(d => d.source === source)

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
            <span className="text-sm text-muted-foreground">{documents.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground max-w-md">
                Documents uploaded from requests, quotes, reports, contracts, and payments will appear here.
              </p>
            </div>
          ) : (
            SECTION_CONFIG.map(({ source, label, icon, badgeClass }) => {
              const sectionDocs = docsBySource(source)
              if (sectionDocs.length === 0) return null
              const isOpen = expandedSections.has(source)

              return (
                <Collapsible key={source} open={isOpen} onOpenChange={() => toggleSection(source)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        {isOpen
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                          {icon}
                          {label}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {sectionDocs.length} {sectionDocs.length === 1 ? 'file' : 'files'}
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-[36px]"></TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>Related To</TableHead>
                            <TableHead>Uploaded By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead className="w-[90px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionDocs.map((doc) => {
                            const expiryInfo = getExpiryStatus(doc.expiryDate)
                            return (
                              <TableRow
                                key={doc.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => openPreview(doc)}
                              >
                                <TableCell>{getFileIcon(doc.fileType)}</TableCell>
                                <TableCell>
                                  <p className="font-medium truncate max-w-[200px]" title={doc.fileName}>
                                    {doc.fileName}
                                  </p>
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
                                      <AlertTriangle className="h-3 w-3" />Expired
                                    </Badge>
                                  )}
                                  {expiryInfo.status === 'expiring' && (
                                    <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                                      <Clock className="h-3 w-3" />{expiryInfo.daysLeft}d
                                    </Badge>
                                  )}
                                  {expiryInfo.status === 'valid' && (
                                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                      <CheckCircle className="h-3 w-3" />Valid
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
                                      onClick={(e) => { e.stopPropagation(); openPreview(doc) }}
                                      title="View"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {doc.fileUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank') }}
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Image Preview */}
      {previewFile?.type === 'image' && (
        <ImageLightbox
          images={[{ url: previewFile.url, name: previewFile.name }]}
          open={previewOpen}
          onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewFile(null) } }}
        />
      )}

      {/* PDF Preview */}
      {previewFile?.type === 'pdf' && (
        <PDFViewer
          url={previewFile.url}
          name={previewFile.name}
          open={previewOpen}
          onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewFile(null) } }}
        />
      )}
    </>
  )
}
