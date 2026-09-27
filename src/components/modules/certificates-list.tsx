'use client'
import { generatedField } from '@/lib/i18n/generated-content'
import { LocalizedError } from '@/components/localized-error'
import { TranslatedText } from '@/components/translated-text'

import { enumLabel } from '@/lib/i18n/enum-labels'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate } from '@/lib/i18n/format-date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone'
import { Badge } from '@/components/ui/badge'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Award,
  Plus,
  Loader2,
  MoreHorizontal,
  Calendar,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

type CertificateType = 'PREVENTIVE_MAINTENANCE' | 'COMPLETION' | 'COMPLIANCE' | 'INSPECTION' | 'CIVIL_DEFENSE' | 'EQUIPMENT_CERTIFICATE'

interface Certificate {
  id: string
  type: CertificateType
  title: string
  description: string | null
  certificateNumber: string | null
  issueDate: string
  expiryDate: string | null
  fileUrl: string | null
  notes: string | null
  projectId: string | null
  workOrderId: string | null
  createdAt: string
  project?: {
    id: string
    title: string
  } | null
  equipment?: {
    id: string
    equipmentNumber: string
    equipmentType: string
  } | null
}

interface CertificatesListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT'
}

const CERTIFICATE_TYPES: { value: CertificateType; icon: string }[] = [
  { value: 'PREVENTIVE_MAINTENANCE', icon: '🛠️' },
  { value: 'COMPLETION', icon: '✅' },
  { value: 'COMPLIANCE', icon: '📋' },
  { value: 'INSPECTION', icon: '🔍' },
  { value: 'CIVIL_DEFENSE', icon: '🚒' },
  { value: 'EQUIPMENT_CERTIFICATE', icon: '📄' },
]

function getCertificateTypeIcon(type: CertificateType): string {
  return CERTIFICATE_TYPES.find(t => t.value === type)?.icon || '📄'
}

function getExpiryStatus(expiryDate: string | null): { status: 'valid' | 'expiring' | 'expired' | 'none'; daysLeft: number } {
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

export function CertificatesList({ branchId, userRole }: CertificatesListProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const tcl = t.dashboard.certificatesList
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null)

  const [newCertificate, setNewCertificate] = useState({
    type: 'PREVENTIVE_MAINTENANCE' as CertificateType,
    title: '',
    description: '',
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  })
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/certificates`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [branchId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'document')
      formData.append('folder', 'certificates')
      formData.append('branchId', branchId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUploadedFileUrl(data.url)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCertificate.title.trim()) {
      setError('Title is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCertificate,
          fileUrl: uploadedFileUrl || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create certificate')
      }

      setCreateDialogOpen(false)
      setNewCertificate({
        type: 'PREVENTIVE_MAINTENANCE',
        title: '',
        description: '',
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        notes: '',
      })
      setUploadedFileUrl('')
      fetchCertificates()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.system.serverError)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm(tcl.deleteConfirm)) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/branches/${branchId}/certificates/${certificateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCertificates()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to delete certificate:', err)
    } finally {
      setDeleting(false)
    }
  }

  const openViewDialog = (certificate: Certificate) => {
    setSelectedCertificate(certificate)
    setViewDialogOpen(true)
  }

  // Count certificates by expiry status
  const expiringCount = certificates.filter(c => getExpiryStatus(c.expiryDate).status === 'expiring').length
  const expiredCount = certificates.filter(c => getExpiryStatus(c.expiryDate).status === 'expired').length

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
              <Award className="h-5 w-5" /><TranslatedText path="dashboard.branchWorkspace.documents" /></CardTitle>
            <CardDescription><TranslatedText path="copy.Manage_documents_and_compliance_records_for_this_branch" /></CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiredCount}{' '}<TranslatedText path="dashboard.equipmentList.expired" /></Badge>
            )}
            {expiringCount > 0 && (
              <Badge className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expiringCount}{' '}<TranslatedText path="dashboard.equipmentList.expiringSoon" /></Badge>
            )}
            {userRole === 'CONTRACTOR' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="me-2 h-4 w-4" /><TranslatedText path="dashboard.certificatesList.addCertificate" /></Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2"><TranslatedText path="dashboard.certificatesList.noCertificatesYet" /></h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {userRole === 'CONTRACTOR'
                  ? t.system.addCertificatesHint
                  : t.system.noCertificatesHint}
              </p>
              {userRole === 'CONTRACTOR' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="me-2 h-4 w-4" /><TranslatedText path="dashboard.certificatesList.addCertificate" /></Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><TranslatedText path="dashboard.equipmentList.certificate" /></TableHead>
                  <TableHead><TranslatedText path="dashboard.equipmentList.type" /></TableHead>
                  <TableHead><TranslatedText path="dashboard.certificatesList.equipment" /></TableHead>
                  <TableHead><TranslatedText path="dashboard.certificatesList.issueDate" /></TableHead>
                  <TableHead><TranslatedText path="dashboard.certificatesList.expiry" /></TableHead>
                  <TableHead><TranslatedText path="dashboard.equipmentList.status" /></TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate) => {
                  const expiryInfo = getExpiryStatus(certificate.expiryDate)
                  return (
                    <TableRow key={certificate.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openViewDialog(certificate)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{generatedField(certificate, 'title', locale)}</p>
                          {certificate.certificateNumber && (
                            <p className="text-xs text-muted-foreground">#{certificate.certificateNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCertificateTypeIcon(certificate.type)} {enumLabel(certificate.type, locale)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {certificate.equipment ? (
                          <Badge variant="outline" className="text-xs">
                            {certificate.equipment.equipmentNumber} · {certificate.equipment.equipmentType === 'OTHER' ? t.dashboard.equipmentList.other : enumLabel(certificate.equipment.equipmentType, locale)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{tcl.siteCertificate}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(certificate.issueDate, locale, {})}
                      </TableCell>
                      <TableCell>
                        {certificate.expiryDate
                          ? formatDate(certificate.expiryDate, locale, {})
                          : <span className="text-muted-foreground">{tcl.noExpiry}</span>
                        }
                      </TableCell>
                      <TableCell>
                        {expiryInfo.status === 'expired' && (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            {tcl.expired}
                          </Badge>
                        )}
                        {expiryInfo.status === 'expiring' && (
                          <Badge className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            {expiryInfo.daysLeft} {tcl.daysLeft}
                          </Badge>
                        )}
                        {expiryInfo.status === 'valid' && (
                          <Badge className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            {tcl.valid}
                          </Badge>
                        )}
                        {expiryInfo.status === 'none' && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openViewDialog(certificate); }}>
                              <Eye className="me-2 h-4 w-4" /><TranslatedText path="dashboard.clientsPage.viewDetails" /></DropdownMenuItem>
                            {certificate.fileUrl && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(certificate.fileUrl!, '_blank'); }}>
                                <Download className="me-2 h-4 w-4" /><TranslatedText path="dashboard.equipmentList.download" /></DropdownMenuItem>
                            )}
                            {userRole === 'CONTRACTOR' && (
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleDeleteCertificate(certificate.id); }}
                                className="text-destructive"
                              >
                                <Trash2 className="me-2 h-4 w-4" /><TranslatedText path="dashboard.teamListPage.delete" /></DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Certificate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle><TranslatedText path="dashboard.certificatesList.addCertificate" /></DialogTitle>
            <DialogDescription><TranslatedText path="dashboard.certificatesList.addCertificateDesc" /></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCertificate}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                <LocalizedError message={error} />
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type"><TranslatedText path="dashboard.certificatesList.certificateType" /></Label>
                <Select
                  value={newCertificate.type}
                  onValueChange={(value: CertificateType) => setNewCertificate({ ...newCertificate, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {enumLabel(type.value, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title"><TranslatedText path="dashboard.certificatesList.title" /></Label>
                <Input
                  id="title"
                  value={newCertificate.title}
                  onChange={(e) => setNewCertificate({ ...newCertificate, title: e.target.value })}
                  placeholder={t.copy.certificateTitleExample}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateNumber"><TranslatedText path="dashboard.certificatesList.certificateNumber" /></Label>
                  <Input
                    id="certificateNumber"
                    value={newCertificate.certificateNumber}
                    onChange={(e) => setNewCertificate({ ...newCertificate, certificateNumber: e.target.value })}
                    placeholder={t.copy.certificateNumberExample}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate"><TranslatedText path="copy.Issue_Date" /></Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={newCertificate.issueDate}
                    onChange={(e) => setNewCertificate({ ...newCertificate, issueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">{tcl.expiry}</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newCertificate.expiryDate}
                  onChange={(e) => setNewCertificate({ ...newCertificate, expiryDate: e.target.value })}
                  min={newCertificate.issueDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description"><TranslatedText path="dashboard.certificatesList.description" /></Label>
                <Textarea
                  id="description"
                  value={newCertificate.description}
                  onChange={(e) => setNewCertificate({ ...newCertificate, description: e.target.value })}
                  placeholder={t.copy.certificateDetails}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label><TranslatedText path="copy.Certificate_File" /></Label>
                <FileUploadDropzone
                  onFilesSelected={(files) => {
                    const event = {
                      target: { files }
                    } as any
                    handleFileUpload(event)
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  multiple={false}
                  disabled={uploading}
                  uploading={uploading}
                  uploadedFiles={uploadedFileUrl ? [{ url: uploadedFileUrl, name: 'Certificate' }] : []}
                  label="Upload certificate (PDF, DOC, images)"
                  showPreview={true}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}><TranslatedText path="dashboard.equipmentList.cancel" /></Button>
              <Button type="submit" disabled={creating || uploading}>
                {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}<TranslatedText path="dashboard.certificatesList.addCertificate" /></Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /><TranslatedText path="copy.Certificate_Details" /></DialogTitle>
          </DialogHeader>

          {selectedCertificate && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{generatedField(selectedCertificate, 'title', locale)}</h3>
                <Badge variant="outline" className="mt-1">
                  {getCertificateTypeIcon(selectedCertificate.type)} {enumLabel(selectedCertificate.type, locale)}
                </Badge>
              </div>

              {selectedCertificate.certificateNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.certificateNumber}</p>
                  <p className="font-medium">#{selectedCertificate.certificateNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.issueDate}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedCertificate.issueDate, locale, {})}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.expiry}</p>
                  {selectedCertificate.expiryDate ? (
                    <>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedCertificate.expiryDate, locale, {})}
                      </p>
                      {(() => {
                        const expiryInfo = getExpiryStatus(selectedCertificate.expiryDate)
                        if (expiryInfo.status === 'expired') {
                          return <Badge variant="destructive" className="mt-1">{tcl.expired}</Badge>
                        }
                        if (expiryInfo.status === 'expiring') {
                          return <Badge className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 mt-1">{expiryInfo.daysLeft} {tcl.daysLeft}</Badge>
                        }
                        return <Badge className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 mt-1">{tcl.valid}</Badge>
                      })()}
                    </>
                  ) : (
                    <p className="text-muted-foreground">{tcl.noExpiry}</p>
                  )}
                </div>
              </div>

              {selectedCertificate.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.description}</p>
                  <p className="text-sm">{generatedField(selectedCertificate, 'description', locale)}</p>
                </div>
              )}

              {selectedCertificate.project && (
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.relatedProject}</p>
                  <p className="text-sm font-medium">{selectedCertificate.project.title}</p>
                </div>
              )}

              {selectedCertificate.equipment && (
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.coversEquipment}</p>
                  <p className="text-sm font-medium">
                    {selectedCertificate.equipment.equipmentNumber} ({selectedCertificate.equipment.equipmentType === 'OTHER' ? t.dashboard.equipmentList.other : enumLabel(selectedCertificate.equipment.equipmentType, locale)})
                  </p>
                </div>
              )}

              {selectedCertificate.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{tcl.notes}</p>
                  <p className="text-sm">{generatedField(selectedCertificate, 'notes', locale)}</p>
                </div>
              )}

              {selectedCertificate.fileUrl && (
                <div className="pt-4 border-t space-y-2">
                  <Button
                    onClick={() => {
                      const isImage = selectedCertificate.fileUrl!.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                      setPreviewFile({
                        url: selectedCertificate.fileUrl!,
                        name: selectedCertificate.title,
                        type: isImage ? 'image' : 'pdf'
                      })
                      setPreviewOpen(true)
                    }}
                    className="w-full"
                    variant="default"
                  >
                    <Eye className="me-2 h-4 w-4" /><TranslatedText path="dashboard.contractorProfileCard.viewCertificate" /></Button>
                  <Button
                    onClick={() => window.open(selectedCertificate.fileUrl!, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="me-2 h-4 w-4" /><TranslatedText path="copy.Download_Certificate" /></Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview Modals */}
      {previewFile?.type === 'image' && (
        <ImageLightbox
          images={[{ url: previewFile.url, name: previewFile.name }]}
          initialIndex={0}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
      {previewFile?.type === 'pdf' && (
        <PDFViewer
          url={previewFile.url}
          name={previewFile.name}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  )
}
