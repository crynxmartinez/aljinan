'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { LoadFailure } from '@/components/ui/load-failure'
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
import { useTranslation } from '@/lib/i18n/use-translation'

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
  labelKey: keyof typeof import('@/lib/i18n/translations').translations.en.dashboard.documentsList
  icon: React.ReactNode
  badgeClass: string
}[] = [
    {
      source: 'payment_proof',
      labelKey: 'sectionPaymentUploads',
      icon: <CreditCard className="h-4 w-4" />,
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      source: 'certificate',
      labelKey: 'sectionEquipmentCertification',
      icon: <Award className="h-4 w-4" />,
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      source: 'contract',
      labelKey: 'sectionContracts',
      icon: <FileCheck className="h-4 w-4" />,
      badgeClass: 'bg-orange-100 text-orange-700',
    },
    {
      source: 'quote',
      labelKey: 'sectionQuotations',
      icon: <ScrollText className="h-4 w-4" />,
      badgeClass: 'bg-purple-100 text-purple-700',
    },
    {
      source: 'report',
      labelKey: 'sectionReports',
      icon: <Camera className="h-4 w-4" />,
      badgeClass: 'bg-green-100 text-green-700',
    },
    {
      source: 'request',
      labelKey: 'sectionRequestPhotos',
      icon: <Camera className="h-4 w-4" />,
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      source: 'generated',
      labelKey: 'sectionGeneratedDocuments',
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
  const { t } = useTranslation()
  const td = t.dashboard.documentsList
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<SourceType>>(new Set())
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const fetchDocuments = async () => {
    setLoadFailed(false)
    try {
      const data = await api.get<UnifiedDocument[]>(`/api/branches/${branchId}/documents`, {
        showToast: false,
      })
      setDocuments(data ?? [])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setLoadFailed(true)
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

  if (loadFailed) {
    return <LoadFailure onRetry={fetchDocuments} message={td.documents + ' could not be loaded.'} />
  }

  const docsBySource = (source: SourceType) => documents.filter(d => d.source === source)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {td.documents}
            </CardTitle>
            <CardDescription>
              {td.documentsDesc}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiredCount} {td.expired}
              </Badge>
            )}
            {expiringCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expiringCount} {td.expiringSoon}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{documents.length} {td.total}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SECTION_CONFIG.map(({ source, labelKey, icon, badgeClass }) => {
            const label = td[labelKey]
            const sectionDocs = docsBySource(source)
            if (sectionDocs.length === 0 && source !== 'payment_proof') return null
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
                      {sectionDocs.length} {sectionDocs.length === 1 ? td.file : td.files}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[36px]"></TableHead>
                          <TableHead>{td.fileName}</TableHead>
                          <TableHead>{td.relatedTo}</TableHead>
                          <TableHead>{td.uploadedBy}</TableHead>
                          <TableHead>{td.date}</TableHead>
                          <TableHead>{td.expiry}</TableHead>
                          <TableHead className="w-[90px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sectionDocs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                              {td.noFilesYet.replace('{label}', label.toLowerCase())}
                            </TableCell>
                          </TableRow>
                        )}
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
                                    <AlertTriangle className="h-3 w-3" />{td.expired}
                                  </Badge>
                                )}
                                {expiryInfo.status === 'expiring' && (
                                  <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                                    <Clock className="h-3 w-3" />{expiryInfo.daysLeft}d
                                  </Badge>
                                )}
                                {expiryInfo.status === 'valid' && (
                                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                    <CheckCircle className="h-3 w-3" />{td.valid}
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
                                    title={td.view}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {doc.fileUrl && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank') }}
                                      title={td.download}
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
          })}
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
