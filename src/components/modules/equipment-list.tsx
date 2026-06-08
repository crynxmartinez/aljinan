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
  Award,
  Download,
  Eye,
  Upload,
  FileText,
  Link2,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

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

const EQUIPMENT_TYPES = [
  { value: 'FIRE_EXTINGUISHER', label: 'Fire Extinguisher' },
  { value: 'FIRE_ALARM_PANEL', label: 'Fire Alarm Panel' },
  { value: 'SPRINKLER_SYSTEM', label: 'Sprinkler System' },
  { value: 'EMERGENCY_LIGHTING', label: 'Emergency Lighting' },
  { value: 'EXIT_SIGN', label: 'Exit Sign' },
  { value: 'FIRE_DOOR', label: 'Fire Door' },
  { value: 'SMOKE_DETECTOR', label: 'Smoke Detector' },
  { value: 'HEAT_DETECTOR', label: 'Heat Detector' },
  { value: 'GAS_DETECTOR', label: 'Gas Detector' },
  { value: 'KITCHEN_HOOD_SUPPRESSION', label: 'Kitchen Hood Suppression' },
  { value: 'FIRE_PUMP', label: 'Fire Pump' },
  { value: 'FIRE_HOSE_REEL', label: 'Fire Hose Reel' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  'ACTIVE': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  'EXPIRING_SOON': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  'EXPIRED': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  'NEEDS_ATTENTION': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
}

export function EquipmentList({ branchId, userRole = 'CONTRACTOR' }: EquipmentListProps) {
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
    } catch (err) {
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
      setError('Equipment number and type are required')
      return
    }

    if (formData.equipmentType === 'OTHER' && !formData.customEquipmentType.trim()) {
      setError('Please specify the equipment type')
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
    } catch (err) {
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
            title: `${formData.equipmentNumber} - ${formData.equipmentType.replace(/_/g, ' ')} Certificate`,
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
    } catch (err) {
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
    if (!confirm('Are you sure you want to delete this equipment?')) return

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
    } catch (err) {
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

  // Stats
  const stats = {
    total: equipment.length,
    active: equipment.filter(eq => eq.status === 'ACTIVE' || eq.calculatedStatus === 'ACTIVE').length,
    expiringSoon: equipment.filter(eq => eq.status === 'EXPIRING_SOON' || eq.calculatedStatus === 'EXPIRING_SOON').length,
    expired: equipment.filter(eq => eq.status === 'EXPIRED' || eq.calculatedStatus === 'EXPIRED').length,
    needsAttention: equipment.filter(eq => eq.status === 'NEEDS_ATTENTION' || eq.calculatedStatus === 'NEEDS_ATTENTION').length,
  }

  const getStatusDisplay = (eq: Equipment) => {
    const status = eq.calculatedStatus || eq.status
    const config = STATUS_COLORS[status] || STATUS_COLORS['ACTIVE']
    const Icon = config.icon
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ')}
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
                Equipment Registry
              </CardTitle>
              <CardDescription>
                Track and manage equipment for sticker inspections
              </CardDescription>
            </div>
            {userRole !== 'CLIENT' && (
              <Button onClick={() => setAddDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
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
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
              <p className="text-xs text-green-600">Active</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.expiringSoon}</p>
              <p className="text-xs text-amber-600">Expiring Soon</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
              <p className="text-xs text-red-600">Expired</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-700">{stats.needsAttention}</p>
              <p className="text-xs text-orange-600">Needs Attention</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="NEEDS_ATTENTION">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
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
              <p className="text-muted-foreground mb-2">No equipment found</p>
              <p className="text-sm text-muted-foreground">
                {equipment.length === 0
                  ? 'Add equipment to start tracking inspections'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Last Inspected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Certificate</TableHead>
                    {userRole !== 'CLIENT' && <TableHead className="text-right">Actions</TableHead>}
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
                            : eq.equipmentType.replace(/_/g, ' ')}
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
                            {new Date(eq.expectedExpiry).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {eq.lastInspected ? (
                          <span className="text-sm">
                            {new Date(eq.lastInspected).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
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
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Expired
                                    </Badge>
                                  ) : isExpiring ? (
                                    <Badge className="text-xs bg-orange-100 text-orange-700 border-0">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Expiring
                                    </Badge>
                                  ) : (
                                    <Badge className="text-xs bg-green-100 text-green-700 border-0">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Valid
                                    </Badge>
                                  )}
                                </div>
                                {certExpiry && (
                                  <span className="text-xs text-muted-foreground">
                                    {certExpiry.toLocaleDateString()}
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
                              No Cert
                            </Badge>
                          )}
                          {eq.stickerApplied && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              Sticker
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {userRole !== 'CLIENT' && (
                        <TableCell className="text-right">
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
              Add Equipment
            </DialogTitle>
            <DialogDescription>
              Add new equipment to track for sticker inspections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentNumber">Equipment # *</Label>
                <Input
                  id="equipmentNumber"
                  value={formData.equipmentNumber}
                  onChange={(e) => setFormData({ ...formData, equipmentNumber: e.target.value })}
                  placeholder="e.g., FE-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentType">Type *</Label>
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
                <Label htmlFor="customEquipmentType">Specify Equipment Type *</Label>
                <Input
                  id="customEquipmentType"
                  value={formData.customEquipmentType}
                  onChange={(e) => setFormData({ ...formData, customEquipmentType: e.target.value })}
                  placeholder="e.g., CO2 Detector, Water Sprayer, etc."
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Kidde"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Pro 210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Manufacturer serial number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Floor 2, Kitchen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedExpiry">Next Inspection Due</Label>
              <Input
                id="expectedExpiry"
                type="date"
                value={formData.expectedExpiry}
                onChange={(e) => setFormData({ ...formData, expectedExpiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddEquipment} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Equipment
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
              Edit Equipment
            </DialogTitle>
            <DialogDescription>
              Update equipment details, inspection status, and certificate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-equipmentNumber">Equipment # *</Label>
                  <Input
                    id="edit-equipmentNumber"
                    value={formData.equipmentNumber}
                    onChange={(e) => setFormData({ ...formData, equipmentNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-equipmentType">Type *</Label>
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
                  <Label htmlFor="edit-customEquipmentType">Specify Equipment Type *</Label>
                  <Input
                    id="edit-customEquipmentType"
                    value={formData.customEquipmentType}
                    onChange={(e) => setFormData({ ...formData, customEquipmentType: e.target.value })}
                    placeholder="e.g., CO2 Detector, Water Sprayer, etc."
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Serial Number</Label>
                  <Input
                    id="edit-serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedExpiry">Next Inspection Due</Label>
                  <Input
                    id="edit-expectedExpiry"
                    type="date"
                    value={formData.expectedExpiry}
                    onChange={(e) => setFormData({ ...formData, expectedExpiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
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
                Inspection Status
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-inspectionResult">Inspection Result</Label>
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PASS">Pass</SelectItem>
                      <SelectItem value="FAIL">Fail</SelectItem>
                      <SelectItem value="NEEDS_REPAIR">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastInspected">Last Inspected</Label>
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
                    Inspected
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
                    Certificate Issued
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
                    Sticker Applied
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deficiencies">Deficiencies / Issues Found</Label>
                <Textarea
                  id="edit-deficiencies"
                  value={inspectionData.deficiencies}
                  onChange={(e) => setInspectionData({ ...inspectionData, deficiencies: e.target.value })}
                  placeholder="Any issues or deficiencies found during inspection..."
                  rows={2}
                />
              </div>
            </div>

            {/* Certificate Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Certificate
              </h4>

              {/* Current Certificate */}
              {selectedEquipment?.certificate && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Current Certificate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEquipment.certificate.fileUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedEquipment.certificate!.fileUrl!, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedEquipment.certificate!.fileUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedEquipment.certificate.expiryDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(selectedEquipment.certificate.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Upload New Certificate */}
              <div className="space-y-3">
                <Label>Upload New Certificate</Label>
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
                      Remove
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-certificateExpiry">Certificate Expiry Date</Label>
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
                  <span className="text-sm font-medium">Linked to Work Order</span>
                </div>
                {selectedEquipment?.request && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedEquipment.request.title} - {selectedEquipment.request.status}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Changes will update the work order record
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
              Cancel
            </Button>
            <Button onClick={handleUpdateEquipment} disabled={saving || uploadingCertificate}>
              {(saving || uploadingCertificate) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploadingCertificate ? 'Uploading...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
