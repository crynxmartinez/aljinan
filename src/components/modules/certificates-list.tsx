'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  FileText,
  Download,
  Trash2,
  Eye,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

type CertificateType = 'PREVENTIVE_MAINTENANCE' | 'COMPLETION' | 'COMPLIANCE' | 'INSPECTION' | 'CIVIL_DEFENSE' | 'OTHER'

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
}

interface CertificatesListProps {
  branchId: string
  userRole: 'CONTRACTOR' | 'CLIENT'
}

const CERTIFICATE_TYPES: { value: CertificateType; label: string; icon: string }[] = [
  { value: 'PREVENTIVE_MAINTENANCE', label: 'Preventive Maintenance', icon: '🛠️' },
  { value: 'COMPLETION', label: 'Completion Certificate', icon: '✅' },
  { value: 'COMPLIANCE', label: 'Compliance Certificate', icon: '📋' },
  { value: 'INSPECTION', label: 'Inspection Certificate', icon: '🔍' },
  { value: 'CIVIL_DEFENSE', label: 'Civil Defense', icon: '🚒' },
  { value: 'OTHER', label: 'Other', icon: '📄' },
]

function getCertificateTypeLabel(type: CertificateType): string {
  return CERTIFICATE_TYPES.find(t => t.value === type)?.label || type
}

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
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return

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
              <Award className="h-5 w-5" />
              Certificates
            </CardTitle>
            <CardDescription>
              Manage certificates and compliance documents for this branch
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
            {userRole === 'CONTRACTOR' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Certificate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {userRole === 'CONTRACTOR'
                  ? 'Add certificates to track compliance and maintenance records for this branch.'
                  : 'No certificates have been uploaded for this branch yet.'}
              </p>
              {userRole === 'CONTRACTOR' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Certificate
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
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
                          <p className="font-medium">{certificate.title}</p>
                          {certificate.certificateNumber && (
                            <p className="text-xs text-muted-foreground">#{certificate.certificateNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCertificateTypeIcon(certificate.type)} {getCertificateTypeLabel(certificate.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(certificate.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {certificate.expiryDate 
                          ? new Date(certificate.expiryDate).toLocaleDateString()
                          : <span className="text-muted-foreground">No expiry</span>
                        }
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
                            {expiryInfo.daysLeft} days left
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openViewDialog(certificate); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {certificate.fileUrl && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(certificate.fileUrl!, '_blank'); }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                            )}
                            {userRole === 'CONTRACTOR' && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCertificate(certificate.id); }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
            <DialogTitle>Add Certificate</DialogTitle>
            <DialogDescription>
              Upload a new certificate or compliance document
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCertificate}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Certificate Type *</Label>
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
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newCertificate.title}
                  onChange={(e) => setNewCertificate({ ...newCertificate, title: e.target.value })}
                  placeholder="e.g., Annual Fire Safety Inspection"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateNumber">Certificate Number</Label>
                  <Input
                    id="certificateNumber"
                    value={newCertificate.certificateNumber}
                    onChange={(e) => setNewCertificate({ ...newCertificate, certificateNumber: e.target.value })}
                    placeholder="e.g., CERT-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
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
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newCertificate.expiryDate}
                  onChange={(e) => setNewCertificate({ ...newCertificate, expiryDate: e.target.value })}
                  min={newCertificate.issueDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCertificate.description}
                  onChange={(e) => setNewCertificate({ ...newCertificate, description: e.target.value })}
                  placeholder="Additional details about this certificate..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Certificate File (PDF)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="certificate-file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="certificate-file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : uploadedFileUrl ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">File uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-sm text-muted-foreground">Click to upload file</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || uploading}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Certificate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCertificate.title}</h3>
                <Badge variant="outline" className="mt-1">
                  {getCertificateTypeIcon(selectedCertificate.type)} {getCertificateTypeLabel(selectedCertificate.type)}
                </Badge>
              </div>

              {selectedCertificate.certificateNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Certificate Number</p>
                  <p className="font-medium">#{selectedCertificate.certificateNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  {selectedCertificate.expiryDate ? (
                    <>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedCertificate.expiryDate).toLocaleDateString()}
                      </p>
                      {(() => {
                        const expiryInfo = getExpiryStatus(selectedCertificate.expiryDate)
                        if (expiryInfo.status === 'expired') {
                          return <Badge variant="destructive" className="mt-1">Expired</Badge>
                        }
                        if (expiryInfo.status === 'expiring') {
                          return <Badge className="bg-orange-100 text-orange-700 mt-1">{expiryInfo.daysLeft} days left</Badge>
                        }
                        return <Badge className="bg-green-100 text-green-700 mt-1">Valid</Badge>
                      })()}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No expiry</p>
                  )}
                </div>
              </div>

              {selectedCertificate.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedCertificate.description}</p>
                </div>
              )}

              {selectedCertificate.project && (
                <div>
                  <p className="text-sm text-muted-foreground">Related Project</p>
                  <p className="text-sm font-medium">{selectedCertificate.project.title}</p>
                </div>
              )}

              {selectedCertificate.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedCertificate.notes}</p>
                </div>
              )}

              {selectedCertificate.fileUrl && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => window.open(selectedCertificate.fileUrl!, '_blank')}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
