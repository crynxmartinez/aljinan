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

const BUILDING_TYPES = [
  { value: 'OFFICE', label: 'Office' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'EDUCATIONAL', label: 'Educational' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'MALL', label: 'Mall' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'MOSQUE', label: 'Mosque' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'DATA_CENTER', label: 'Data Center' },
  { value: 'OTHER', label: 'Other' },
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
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BranchProfileForm({ branch, open, onOpenChange }: BranchProfileFormProps) {
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
      alert('Failed to update branch profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Facility Profile</DialogTitle>
          <DialogDescription>
            Update facility information and Civil Defense details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipality">Municipality / CD Region</Label>
                <Input
                  id="municipality"
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  placeholder="Civil Defense region"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Facility Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floorCount">Number of Floors</Label>
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
              <Label htmlFor="areaSize">Area Size (sqm)</Label>
              <Input
                id="areaSize"
                type="number"
                min="0"
                step="0.01"
                value={formData.areaSize}
                onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                placeholder="Area in square meters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional notes about this facility"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Civil Defense Certificate
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cdCertificateNumber">Certificate Number</Label>
                <Input
                  id="cdCertificateNumber"
                  value={formData.cdCertificateNumber}
                  onChange={(e) => setFormData({ ...formData, cdCertificateNumber: e.target.value })}
                  placeholder="CD certificate number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdCertificateExpiry">Expiry Date</Label>
                <Input
                  id="cdCertificateExpiry"
                  type="date"
                  value={formData.cdCertificateExpiry}
                  onChange={(e) => setFormData({ ...formData, cdCertificateExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdCertificateUrl">Certificate URL</Label>
              <Input
                id="cdCertificateUrl"
                value={formData.cdCertificateUrl}
                onChange={(e) => setFormData({ ...formData, cdCertificateUrl: e.target.value })}
                placeholder="Link to uploaded certificate"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
