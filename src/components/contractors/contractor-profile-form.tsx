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
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

const BUSINESS_TYPES = [
  { value: 'LLC', labelKey: 'llc' as const },
  { value: 'CORPORATION', labelKey: 'corporation' as const },
  { value: 'SOLE_PROPRIETOR', labelKey: 'soleProprietor' as const },
  { value: 'PARTNERSHIP', labelKey: 'partnership' as const },
  { value: 'JOINT_VENTURE', labelKey: 'jointVenture' as const },
  { value: 'GOVERNMENT', labelKey: 'government' as const },
  { value: 'NON_PROFIT', labelKey: 'nonProfit' as const },
  { value: 'OTHER', labelKey: 'other' as const },
]

interface ContractorProfileFormProps {
  contractor: {
    id: string
    companyName: string | null
    companyPhone: string | null
    companyEmail: string | null
    companyAddress: string | null
    contactPersonName: string | null
    contactPersonPhone: string | null
    contactPersonEmail: string | null
    logoUrl: string | null
    website: string | null
    businessType: string | null
    yearEstablished: number | null
    crNumber: string | null
    vatNumber: string | null
    licenseNumber: string | null
    licenseExpiry: string | null
    insuranceCertUrl: string | null
    insuranceExpiry: string | null
    serviceAreas: string[] | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractorProfileForm({ contractor, open, onOpenChange }: ContractorProfileFormProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.contractorProfileForm
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: contractor.companyName || '',
    companyPhone: contractor.companyPhone || '',
    companyEmail: contractor.companyEmail || '',
    companyAddress: contractor.companyAddress || '',
    contactPersonName: contractor.contactPersonName || '',
    contactPersonPhone: contractor.contactPersonPhone || '',
    contactPersonEmail: contractor.contactPersonEmail || '',
    logoUrl: contractor.logoUrl || '',
    website: contractor.website || '',
    businessType: contractor.businessType || '',
    yearEstablished: contractor.yearEstablished?.toString() || '',
    crNumber: contractor.crNumber || '',
    vatNumber: contractor.vatNumber || '',
    licenseNumber: contractor.licenseNumber || '',
    licenseExpiry: contractor.licenseExpiry ? contractor.licenseExpiry.split('T')[0] : '',
    insuranceCertUrl: contractor.insuranceCertUrl || '',
    insuranceExpiry: contractor.insuranceExpiry ? contractor.insuranceExpiry.split('T')[0] : '',
  })
  const [serviceAreas, setServiceAreas] = useState<string[]>(contractor.serviceAreas || [])
  const [newServiceArea, setNewServiceArea] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contractor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearEstablished: formData.yearEstablished || null,
          licenseExpiry: formData.licenseExpiry || null,
          insuranceExpiry: formData.insuranceExpiry || null,
          serviceAreas: serviceAreas.length > 0 ? serviceAreas : null,
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        router.refresh()
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const addServiceArea = () => {
    if (newServiceArea.trim() && !serviceAreas.includes(newServiceArea.trim())) {
      setServiceAreas([...serviceAreas, newServiceArea.trim()])
      setNewServiceArea('')
    }
  }

  const removeServiceArea = (area: string) => {
    setServiceAreas(serviceAreas.filter(a => a !== area))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ta.editCompanyProfile}</DialogTitle>
          <DialogDescription>
            {ta.updateCompanyInfoCompliance}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.basicInformation}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">{ta.companyName}</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder={ta.yourCompanyName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">{ta.businessType}</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ta.selectBusinessType} />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {ta.businessTypes[type.labelKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">{ta.companyEmail}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">{ta.companyPhone}</Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="+966 xxx xxx xxxx"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companyAddress">{ta.companyAddress}</Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  placeholder={ta.fullCompanyAddress}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.contactPerson}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">{ta.contactPersonName}</Label>
                <Input
                  id="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonPhone">{ta.contactPersonPhone}</Label>
                <Input
                  id="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                  placeholder="+966 xxx xxx xxxx"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactPersonEmail">{ta.contactPersonEmail}</Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  value={formData.contactPersonEmail}
                  onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.additionalInformation}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">{ta.website}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearEstablished">{ta.yearEstablished}</Label>
                <Input
                  id="yearEstablished"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.yearEstablished}
                  onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                  placeholder="2010"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="logoUrl">{ta.logoUrl}</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Registration & Tax */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.registrationTax}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crNumber">{ta.crBusinessLicense}</Label>
                <Input
                  id="crNumber"
                  value={formData.crNumber}
                  onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                  placeholder={ta.commercialRegistrationLicense}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">{ta.vatTaxId}</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  placeholder={ta.vatNumberEin}
                />
              </div>
            </div>
          </div>

          {/* Licensing */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.contractorLicense}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{ta.licenseNumber}</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder={ta.civilDefenseStateLicense}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">{ta.licenseExpiryDate}</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.insurance}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insuranceCertUrl">{ta.insuranceCertificateUrl}</Label>
                <Input
                  id="insuranceCertUrl"
                  value={formData.insuranceCertUrl}
                  onChange={(e) => setFormData({ ...formData, insuranceCertUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">{ta.insuranceExpiryDate}</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {ta.serviceAreas}
            </h4>
            <div className="flex gap-2">
              <Input
                value={newServiceArea}
                onChange={(e) => setNewServiceArea(e.target.value)}
                placeholder={ta.addCityOrRegion}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addServiceArea()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addServiceArea}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {serviceAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-2">
                    {area}
                    <button
                      type="button"
                      onClick={() => removeServiceArea(area)}
                      className="ms-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {ta.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? ta.saving : ta.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
