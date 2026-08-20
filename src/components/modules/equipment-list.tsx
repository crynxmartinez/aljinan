'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Tag,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  Download,
  Eye,
  FileText,
  Link2,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n/use-translation'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  customEquipmentType?: string
  brand?: string
  model?: string
  serialNumber?: string
  location?: string
  dateAdded: string
  expectedExpiry?: string
  lastInspected?: string
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NEEDS_ATTENTION'
  calculatedStatus?: string
  inspectionResult: 'PASS' | 'FAIL' | 'NEEDS_REPAIR' | 'PENDING'
  isInspected: boolean
  certificateIssued: boolean
  stickerApplied: boolean
  notes?: string | null
  deficiencies?: string | null
  certificate?: {
    id: string
    title: string
    type: string
    issueDate: string
    expiryDate: string | null
    fileUrl: string | null
  } | null
  request?: {
    id: string
    title: string
    status: string
  } | null
  workOrderId?: string | null
}

interface EquipmentListProps {
  branchId: string
  userRole?: 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER'
}

const EQUIPMENT_TYPE_KEYS: { value: string; labelKey: 'fireExtinguisher' | 'fireAlarmPanel' | 'sprinklerSystem' | 'emergencyLighting' | 'exitSign' | 'fireDoor' | 'smokeDetector' | 'heatDetector' | 'gasDetector' | 'kitchenHoodSuppression' | 'firePump' | 'fireHoseReel' | 'other' }[] = [
  { value: 'FIRE_EXTINGUISHER', labelKey: 'fireExtinguisher' },
  { value: 'FIRE_ALARM_PANEL', labelKey: 'fireAlarmPanel' },
  { value: 'SPRINKLER_SYSTEM', labelKey: 'sprinklerSystem' },
  { value: 'EMERGENCY_LIGHTING', labelKey: 'emergencyLighting' },
  { value: 'EXIT_SIGN', labelKey: 'exitSign' },
  { value: 'FIRE_DOOR', labelKey: 'fireDoor' },
  { value: 'SMOKE_DETECTOR', labelKey: 'smokeDetector' },
  { value: 'HEAT_DETECTOR', labelKey: 'heatDetector' },
  { value: 'GAS_DETECTOR', labelKey: 'gasDetector' },
  { value: 'KITCHEN_HOOD_SUPPRESSION', labelKey: 'kitchenHoodSuppression' },
  { value: 'FIRE_PUMP', labelKey: 'firePump' },
  { value: 'FIRE_HOSE_REEL', labelKey: 'fireHoseReel' },
  { value: 'OTHER', labelKey: 'other' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  'ACTIVE': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  'EXPIRING_SOON': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  'EXPIRED': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  'NEEDS_ATTENTION': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
}

export function EquipmentList({ branchId, userRole = 'CONTRACTOR' }: EquipmentListProps) {
  const { t } = useTranslation()
  const te = t.dashboard.equipmentList
  const EQUIPMENT_TYPES = EQUIPMENT_TYPE_KEYS.map(({ value, labelKey }) => ({ value, label: te[labelKey] }))
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    equipmentNumber: '',
    equipmentType: 'FIRE_EXTINGUISHER',
    customEquipmentType: '',
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    expectedExpiry: '',
    notes: '',
  })

  // Extended form state for edit (inspection + certificate)
  const [inspectionData, setInspectionData] = useState({
    isInspected: false,
    inspectionResult: 'PENDING' as 'PASS' | 'FAIL' | 'NEEDS_REPAIR' | 'PENDING',
    certificateIssued: false,
    stickerApplied: false,
    deficiencies: '',
    lastInspected: '',
  })

  // Certificate upload state
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificateExpiry, setCertificateExpiry] = useState('')
  const [uploadingCertificate, setUploadingCertificate] = useState(false)

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/branches/${branchId}/equipment`)
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load equipment')
      }
    } catch {
      setError('Failed to fetch equipment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipment()
  }, [branchId])

  const handleAddEquipment = async () => {
    if (!formData.equipmentNumber || !formData.equipmentType) {
      setError(te.equipmentNumberRequired)
      return
    }

    if (formData.equipmentType === 'OTHER' && !formData.customEquipmentType.trim()) {
      setError(te.specifyTypeRequired)
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setAddDialogOpen(false)
        resetForm()
        fetchEquipment()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add equipment')
      }
    } catch {
      setError('Failed to add equipment')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEquipment = async () => {
    if (!selectedEquipment) return

    setSaving(true)
    setError('')

    try {
      // Step 1: Upload certificate file if provided
      let newCertificateId: string | null = null
      if (certificateFile) {
        setUploadingCertificate(true)

        // Upload file first
        const uploadFormData = new FormData()
        uploadFormData.append('file', certificateFile)
        uploadFormData.append('type', 'document')
        uploadFormData.append('folder', 'certificates')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload certificate file')
        }

        const uploadResult = await uploadResponse.json()
        const fileUrl = uploadResult.url

        // Create new certificate record
        const certResponse = await fetch(`/api/branches/${branchId}/certificates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: te.certificateTitle.replace('{type}', EQUIPMENT_TYPES.find(et => et.value === formData.equipmentType)?.label || formData.equipmentType.replace(/_/g, ' ')),
            type: 'EQUIPMENT_CERTIFICATE',
            issueDate: new Date().toISOString(),
            expiryDate: certificateExpiry ? new Date(certificateExpiry).toISOString() : null,
            fileUrl: fileUrl,
            equipmentId: selectedEquipment.id,
          }),
        })

        if (certResponse.ok) {
          const certData = await certResponse.json()
          newCertificateId = certData.id
        }

        setUploadingCertificate(false)
      }

      // Step 2: Update equipment with all data
      const updatePayload = {
        ...formData,
        ...inspectionData,
        ...(newCertificateId && { certificateId: newCertificateId }),
      }

      const response = await fetch(`/api/branches/${branchId}/equipment/${selectedEquipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setSelectedEquipment(null)
        resetForm()
        resetInspectionData()
        fetchEquipment()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update equipment')
      }
    } catch {
      setError('Failed to update equipment')
    } finally {
      setSaving(false)
      setUploadingCertificate(false)
    }
  }

  const resetInspectionData = () => {
    setInspectionData({
      isInspected: false,
      inspectionResult: 'PENDING',
      certificateIssued: false,
      stickerApplied: false,
      deficiencies: '',
      lastInspected: '',
    })
    setCertificateFile(null)
    setCertificateExpiry('')
  }

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm(te.deleteConfirm)) return

    try {
      const response = await fetch(`/api/branches/${branchId}/equipment/${equipmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchEquipment()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete equipment')
      }
    } catch {
      setError('Failed to delete equipment')
    }
  }

  const openEditDialog = (eq: Equipment) => {
    setSelectedEquipment(eq)
    setFormData({
      equipmentNumber: eq.equipmentNumber,
      equipmentType: eq.equipmentType,
      customEquipmentType: eq.customEquipmentType || '',
      brand: eq.brand || '',
      model: eq.model || '',
      serialNumber: eq.serialNumber || '',
      location: eq.location || '',
      expectedExpiry: eq.expectedExpiry ? eq.expectedExpiry.split('T')[0] : '',
      notes: eq.notes || '',
    })
    setInspectionData({
      isInspected: eq.isInspected,
      inspectionResult: eq.inspectionResult,
      certificateIssued: eq.certificateIssued,
      stickerApplied: eq.stickerApplied,
      deficiencies: eq.deficiencies || '',
      lastInspected: eq.lastInspected ? eq.lastInspected.split('T')[0] : '',
    })
    setCertificateExpiry(eq.certificate?.expiryDate ? eq.certificate.expiryDate.split('T')[0] : '')
    setCertificateFile(null)
    setEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      equipmentNumber: '',
      equipmentType: 'FIRE_EXTINGUISHER',
      customEquipmentType: '',
      brand: '',
      model: '',
      serialNumber: '',
      location: '',
      expectedExpiry: '',
      notes: '',
    })
  }

  // Filter equipment
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch =
      eq.equipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.customEquipmentType?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      eq.status === statusFilter ||
      eq.calculatedStatus === statusFilter

    const matchesType = typeFilter === 'all' || eq.equipmentType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Stats - use calculatedStatus if available, otherwise fall back to status
  const getEffectiveStatus = (eq: Equipment) => eq.calculatedStatus || eq.status
  const stats = {
    total: equipment.length,
    active: equipment.filter(eq => getEffectiveStatus(eq) === 'ACTIVE').length,
    expiringSoon: equipment.filter(eq => getEffectiveStatus(eq) === 'EXPIRING_SOON').length,
    expired: equipment.filter(eq => getEffectiveStatus(eq) === 'EXPIRED').length,
    needsAttention: equipment.filter(eq => getEffectiveStatus(eq) === 'NEEDS_ATTENTION').length,
  }

  const STATUS_LABELS: Record<string, string> = {
    'ACTIVE': te.statusActive,
    'EXPIRING_SOON': te.statusExpiringSoon,
    'EXPIRED': te.statusExpired,
    'NEEDS_ATTENTION': te.statusNeedsAttention,
  }

  const getStatusDisplay = (eq: Equipment) => {
    const status = eq.calculatedStatus || eq.status
    const config = STATUS_COLORS[status] || STATUS_COLORS['ACTIVE']
    const Icon = config.icon
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <Icon className="h-3 w-3 me-1" />
        {STATUS_LABELS[status] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-amber-600" />
                {te.equipmentRegistry}
              </CardTitle>
              <CardDescription>
                {te.equipmentRegistryDesc}
              </CardDescription>
            </div>
            {userRole !== 'CLIENT' && (
              <Button onClick={() => setAddDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 me-2" />
                {te.addEquipment}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{te.total}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
              <p className="text-xs text-green-600">{te.active}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.expiringSoon}</p>
              <p className="text-xs text-amber-600">{te.expiringSoon}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
              <p className="text-xs text-red-600">{te.expired}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-700">{stats.needsAttention}</p>
              <p className="text-xs text-orange-600">{te.needsAttention}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={te.searchEquipment}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 me-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{te.allStatus}</SelectItem>
                <SelectItem value="ACTIVE">{te.active}</SelectItem>
                <SelectItem value="EXPIRING_SOON">{te.expiringSoon}</SelectItem>
                <SelectItem value="EXPIRED">{te.expired}</SelectItem>
                <SelectItem value="NEEDS_ATTENTION">{te.needsAttention}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{te.allTypes}</SelectItem>
                {EQUIPMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Table */}
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">{te.noEquipmentFound}</p>
              <p className="text-sm text-muted-foreground">
                {equipment.length === 0
                  ? te.addEquipmentToStart
                  : te.tryAdjustingFilters}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{te.equipmentNumber}</TableHead>
                    <TableHead>{te.type}</TableHead>
                    <TableHead>{te.location}</TableHead>
                    <TableHead>{te.expiryDate}</TableHead>
                    <TableHead>{te.lastInspected}</TableHead>
                    <TableHead>{te.status}</TableHead>
                    <TableHead>{te.certificate}</TableHead>
                    {userRole !== 'CLIENT' && <TableHead className="text-end">{te.actions}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.equipmentNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {eq.equipmentType === 'OTHER' && eq.customEquipmentType
                            ? eq.customEquipmentType
                            : EQUIPMENT_TYPES.find(et => et.value === eq.equipmentType)?.label || eq.equipmentType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {eq.location ? (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {eq.location}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {eq.expectedExpiry ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(eq.expectedExpiry).toLocaleDateString('ar-SA')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {eq.lastInspected ? (
                          <span className="text-sm">
                            {new Date(eq.lastInspected).toLocaleDateString('ar-SA')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{te.never}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusDisplay(eq)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {eq.certificate ? (() => {
                            const certExpiry = eq.certificate.expiryDate ? new Date(eq.certificate.expiryDate) : null
                            const now = new Date()
                            const thirtyDays = new Date()
                            thirtyDays.setDate(thirtyDays.getDate() + 30)
                            const isExpired = certExpiry && certExpiry < now
                            const isExpiring = certExpiry && !isExpired && certExpiry <= thirtyDays

                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 me-1" />
                                      {te.expired}
                                    </Badge>
                                  ) : isExpiring ? (
                                    <Badge className="text-xs bg-orange-100 text-orange-700 border-0">
                                      <Clock className="h-3 w-3 me-1" />
                                      {te.expiring}
                                    </Badge>
                                  ) : (
                                    <Badge className="text-xs bg-green-100 text-green-700 border-0">
                                      <CheckCircle className="h-3 w-3 me-1" />
                                      {te.valid}
                                    </Badge>
                                  )}
                                </div>
                                {certExpiry && (
                                  <span className="text-xs text-muted-foreground">
                                    {certExpiry.toLocaleDateString('ar-SA')}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  {eq.certificate.fileUrl && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1"
                                        onClick={(e) => { e.stopPropagation(); window.open(eq.certificate!.fileUrl!, '_blank'); }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1"
                                        onClick={(e) => { e.stopPropagation(); window.open(eq.certificate!.fileUrl!, '_blank'); }}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })() : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {te.noCert}
                            </Badge>
                          )}
                          {eq.stickerApplied && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              {te.sticker}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {userRole !== 'CLIENT' && (
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(eq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEquipment(eq.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-amber-600" />
              {te.addEquipment}
            </DialogTitle>
            <DialogDescription>
              {te.addEquipmentDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentNumber">{te.equipmentNumberLabel}</Label>
                <Input
                  id="equipmentNumber"
                  value={formData.equipmentNumber}
                  onChange={(e) => setFormData({ ...formData, equipmentNumber: e.target.value })}
                  placeholder={te.equipmentNumberPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentType">{te.typeLabel}</Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    equipmentType: value,
                    customEquipmentType: value !== 'OTHER' ? '' : formData.customEquipmentType
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Custom Equipment Type - Show when OTHER is selected */}
            {formData.equipmentType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="customEquipmentType">{te.specifyType}</Label>
                <Input
                  id="customEquipmentType"
                  value={formData.customEquipmentType}
                  onChange={(e) => setFormData({ ...formData, customEquipmentType: e.target.value })}
                  placeholder={te.specifyTypePlaceholder}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">{te.brand}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder={te.brandPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{te.model}</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder={te.modelPlaceholder}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{te.serialNumber}</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder={te.serialNumberPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{te.location}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={te.locationPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedExpiry">{te.nextInspectionDue}</Label>
              <Input
                id="expectedExpiry"
                type="date"
                value={formData.expectedExpiry}
                onChange={(e) => setFormData({ ...formData, expectedExpiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{te.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={te.notesPlaceholder}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              {te.cancel}
            </Button>
            <Button onClick={handleAddEquipment} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {te.addEquipment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {te.editEquipment}
            </DialogTitle>
            <DialogDescription>
              {te.editEquipmentDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {te.basicInformation}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-equipmentNumber">{te.equipmentNumberLabel}</Label>
                  <Input
                    id="edit-equipmentNumber"
                    value={formData.equipmentNumber}
                    onChange={(e) => setFormData({ ...formData, equipmentNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-equipmentType">{te.typeLabel}</Label>
                  <Select
                    value={formData.equipmentType}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      equipmentType: value,
                      customEquipmentType: value !== 'OTHER' ? '' : formData.customEquipmentType
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.equipmentType === 'OTHER' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-customEquipmentType">{te.specifyType}</Label>
                  <Input
                    id="edit-customEquipmentType"
                    value={formData.customEquipmentType}
                    onChange={(e) => setFormData({ ...formData, customEquipmentType: e.target.value })}
                    placeholder={te.specifyTypePlaceholder}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">{te.brand}</Label>
                  <Input
                    id="edit-brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model">{te.model}</Label>
                  <Input
                    id="edit-model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">{te.serialNumber}</Label>
                  <Input
                    id="edit-serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">{te.location}</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedExpiry">{te.nextInspectionDue}</Label>
                  <Input
                    id="edit-expectedExpiry"
                    type="date"
                    value={formData.expectedExpiry}
                    onChange={(e) => setFormData({ ...formData, expectedExpiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">{te.notes}</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Inspection Status Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {te.inspectionStatus}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-inspectionResult">{te.inspectionResult}</Label>
                  <Select
                    value={inspectionData.inspectionResult}
                    onValueChange={(value: 'PASS' | 'FAIL' | 'NEEDS_REPAIR' | 'PENDING') =>
                      setInspectionData({ ...inspectionData, inspectionResult: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">{te.pending}</SelectItem>
                      <SelectItem value="PASS">{te.pass}</SelectItem>
                      <SelectItem value="FAIL">{te.fail}</SelectItem>
                      <SelectItem value="NEEDS_REPAIR">{te.needsRepair}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastInspected">{te.lastInspected}</Label>
                  <Input
                    id="edit-lastInspected"
                    type="date"
                    value={inspectionData.lastInspected}
                    onChange={(e) => setInspectionData({ ...inspectionData, lastInspected: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isInspected"
                    checked={inspectionData.isInspected}
                    onCheckedChange={(checked) =>
                      setInspectionData({ ...inspectionData, isInspected: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-isInspected" className="text-sm font-normal">
                    {te.inspected}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-certificateIssued"
                    checked={inspectionData.certificateIssued}
                    onCheckedChange={(checked) =>
                      setInspectionData({ ...inspectionData, certificateIssued: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-certificateIssued" className="text-sm font-normal">
                    {te.certificateIssued}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-stickerApplied"
                    checked={inspectionData.stickerApplied}
                    onCheckedChange={(checked) =>
                      setInspectionData({ ...inspectionData, stickerApplied: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-stickerApplied" className="text-sm font-normal">
                    {te.stickerApplied}
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deficiencies">{te.deficiencies}</Label>
                <Textarea
                  id="edit-deficiencies"
                  value={inspectionData.deficiencies}
                  onChange={(e) => setInspectionData({ ...inspectionData, deficiencies: e.target.value })}
                  placeholder={te.deficienciesPlaceholder}
                  rows={2}
                />
              </div>
            </div>

            {/* Certificate Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {te.certificateSection}
              </h4>

              {/* Current Certificate */}
              {selectedEquipment?.certificate && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{te.currentCertificate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEquipment.certificate.fileUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedEquipment.certificate!.fileUrl!, '_blank')}
                          >
                            <Eye className="h-4 w-4 me-1" />
                            {te.view}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedEquipment.certificate!.fileUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4 me-1" />
                            {te.download}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedEquipment.certificate.expiryDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {te.expires}: {new Date(selectedEquipment.certificate.expiryDate).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              )}

              {/* Upload New Certificate */}
              <div className="space-y-3">
                <Label>{te.uploadNewCertificate}</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
                {certificateFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{certificateFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive"
                      onClick={() => setCertificateFile(null)}
                    >
                      {te.remove}
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-certificateExpiry">{te.certificateExpiryDate}</Label>
                  <Input
                    id="edit-certificateExpiry"
                    type="date"
                    value={certificateExpiry}
                    onChange={(e) => setCertificateExpiry(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Linked Work Order Info */}
            {(selectedEquipment?.workOrderId || selectedEquipment?.request) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Link2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{te.linkedToWorkOrder}</span>
                </div>
                {selectedEquipment?.request && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedEquipment.request.title} - {selectedEquipment.request.status}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  {te.changesWillUpdate}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedEquipment(null);
                resetForm();
                resetInspectionData();
              }}
            >
              {te.cancel}
            </Button>
            <Button onClick={handleUpdateEquipment} disabled={saving || uploadingCertificate}>
              {(saving || uploadingCertificate) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {uploadingCertificate ? te.uploading : te.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
