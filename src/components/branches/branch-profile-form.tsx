'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

const BUILDING_TYPES = [
  { value: 'OFFICE', labelKey: 'office' as const },
  { value: 'RETAIL', labelKey: 'retail' as const },
  { value: 'WAREHOUSE', labelKey: 'warehouse' as const },
  { value: 'INDUSTRIAL', labelKey: 'industrial' as const },
  { value: 'RESIDENTIAL', labelKey: 'residential' as const },
  { value: 'HOSPITAL', labelKey: 'hospital' as const },
  { value: 'EDUCATIONAL', labelKey: 'educational' as const },
  { value: 'HOTEL', labelKey: 'hotel' as const },
  { value: 'RESTAURANT', labelKey: 'restaurant' as const },
  { value: 'MALL', labelKey: 'mall' as const },
  { value: 'MIXED_USE', labelKey: 'mixedUse' as const },
  { value: 'PARKING', labelKey: 'parking' as const },
  { value: 'MOSQUE', labelKey: 'mosque' as const },
  { value: 'GOVERNMENT', labelKey: 'government' as const },
  { value: 'SPORTS', labelKey: 'sports' as const },
  { value: 'DATA_CENTER', labelKey: 'dataCenter' as const },
  { value: 'OTHER', labelKey: 'other' as const },
]

interface BranchProfileFormProps {
  branch: {
    id: string
    clientId: string
    name: string
    address: string
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
    phone: string | null
    notes: string | null
    municipality: string | null
    buildingType: string | null
    floorCount: number | null
    areaSize: number | null
    cdCertificateNumber: string | null
    cdCertificateExpiry: string | null
    cdCertificateUrl: string | null
    contactPersonName: string | null
    contactPersonPhone: string | null
    contactPersonEmail: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BranchProfileForm({ branch, open, onOpenChange }: BranchProfileFormProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.branchProfileForm
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: branch.name || '',
    address: branch.address || '',
    city: branch.city || '',
    state: branch.state || '',
    zipCode: branch.zipCode || '',
    country: branch.country || '',
    phone: branch.phone || '',
    notes: branch.notes || '',
    municipality: branch.municipality || '',
    buildingType: branch.buildingType || '',
    floorCount: branch.floorCount?.toString() || '',
    areaSize: branch.areaSize?.toString() || '',
    cdCertificateNumber: branch.cdCertificateNumber || '',
    cdCertificateExpiry: branch.cdCertificateExpiry ? branch.cdCertificateExpiry.split('T')[0] : '',
    cdCertificateUrl: branch.cdCertificateUrl || '',
    contactPersonName: branch.contactPersonName || '',
    contactPersonPhone: branch.contactPersonPhone || '',
    contactPersonEmail: branch.contactPersonEmail || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${branch.clientId}/branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          floorCount: formData.floorCount ? parseInt(formData.floorCount) : null,
          areaSize: formData.areaSize ? parseFloat(formData.areaSize) : null,
          cdCertificateExpiry: formData.cdCertificateExpiry || null,
          buildingType: formData.buildingType || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update branch')
      }

      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating branch:', error)
      alert(ta.failedToUpdateBranch)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ta.editFacilityProfile}</DialogTitle>
          <DialogDescription>
            {ta.updateFacilityInfo}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {ta.basicInformation}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{ta.facilityName}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{ta.phone}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{ta.address}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{ta.city}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipality">{ta.municipalityCDRegion}</Label>
                <Input
                  id="municipality"
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  placeholder={ta.civilDefenseRegion}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {ta.facilityDetails}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildingType">{ta.buildingType}</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ta.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {ta.buildingTypes[type.labelKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floorCount">{ta.numberOfFloors}</Label>
                <Input
                  id="floorCount"
                  type="number"
                  min="1"
                  value={formData.floorCount}
                  onChange={(e) => setFormData({ ...formData, floorCount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaSize">{ta.areaSizeSqm}</Label>
              <Input
                id="areaSize"
                type="number"
                min="0"
                step="0.01"
                value={formData.areaSize}
                onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                placeholder={ta.areaInSquareMeters}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{ta.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder={ta.additionalNotesAboutFacility}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {ta.civilDefenseCertificate}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cdCertificateNumber">{ta.certificateNumber}</Label>
                <Input
                  id="cdCertificateNumber"
                  value={formData.cdCertificateNumber}
                  onChange={(e) => setFormData({ ...formData, cdCertificateNumber: e.target.value })}
                  placeholder={ta.cdCertificateNumberPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdCertificateExpiry">{ta.expiryDate}</Label>
                <Input
                  id="cdCertificateExpiry"
                  type="date"
                  value={formData.cdCertificateExpiry}
                  onChange={(e) => setFormData({ ...formData, cdCertificateExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdCertificateUrl">{ta.certificateUrl}</Label>
              <Input
                id="cdCertificateUrl"
                value={formData.cdCertificateUrl}
                onChange={(e) => setFormData({ ...formData, cdCertificateUrl: e.target.value })}
                placeholder={ta.linkToUploadedCertificate}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {ta.contactPerson}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">{ta.contactPersonName}</Label>
                <Input
                  id="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder={ta.fullName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPersonPhone">{ta.contactPersonPhone}</Label>
                <Input
                  id="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonEmail">{ta.contactPersonEmail}</Label>
              <Input
                id="contactPersonEmail"
                type="email"
                value={formData.contactPersonEmail}
                onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {ta.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ta.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
