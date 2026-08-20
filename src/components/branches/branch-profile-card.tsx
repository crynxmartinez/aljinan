'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Phone, Building2, FileText, Calendar, Edit,
  AlertTriangle, Layers, Ruler, User, Mail
} from 'lucide-react'
import { BranchProfileForm } from './branch-profile-form'
import { useTranslation } from '@/lib/i18n/use-translation'

interface BranchProfileCardProps {
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
  canEdit: boolean
}

export function BranchProfileCard({ branch, canEdit }: BranchProfileCardProps) {
  const { t } = useTranslation()
  const tb = t.dashboard.branchProfileCard
  const [editOpen, setEditOpen] = useState(false)

  const BUILDING_TYPE_LABELS: Record<string, string> = {
    OFFICE: tb.buildingTypeOffice,
    RETAIL: tb.buildingTypeRetail,
    WAREHOUSE: tb.buildingTypeWarehouse,
    INDUSTRIAL: tb.buildingTypeIndustrial,
    RESIDENTIAL: tb.buildingTypeResidential,
    HOSPITAL: tb.buildingTypeHospital,
    EDUCATIONAL: tb.buildingTypeEducational,
    HOTEL: tb.buildingTypeHotel,
    RESTAURANT: tb.buildingTypeRestaurant,
    MALL: tb.buildingTypeMall,
    MIXED_USE: tb.buildingTypeMixedUse,
    PARKING: tb.buildingTypeParking,
    MOSQUE: tb.buildingTypeMosque,
    GOVERNMENT: tb.buildingTypeGovernment,
    SPORTS: tb.buildingTypeSports,
    DATA_CENTER: tb.buildingTypeDataCenter,
    OTHER: tb.buildingTypeOther,
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isCertificateExpiringSoon = () => {
    if (!branch.cdCertificateExpiry) return false
    const expiry = new Date(branch.cdCertificateExpiry)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isCertificateExpired = () => {
    if (!branch.cdCertificateExpiry) return false
    return new Date(branch.cdCertificateExpiry) < new Date()
  }

  const getFullAddress = () => {
    const parts = [branch.address]
    if (branch.city) parts.push(branch.city)
    if (branch.state) parts.push(branch.state)
    if (branch.zipCode) parts.push(branch.zipCode)
    if (branch.country) parts.push(branch.country)
    return parts.join(', ')
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{tb.facilityProfile}</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 me-1" />
              {tb.edit}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Location Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{tb.address}</p>
                <p className="text-sm font-medium">{getFullAddress()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{tb.phone}</p>
                <p className={`text-sm ${branch.phone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.phone || tb.notSet}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{tb.municipality}</p>
                <p className={`text-sm ${branch.municipality ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.municipality || tb.notSet}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{tb.buildingType}</p>
                <p className={`text-sm ${branch.buildingType ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.buildingType ? (BUILDING_TYPE_LABELS[branch.buildingType] || branch.buildingType) : tb.notSet}
                </p>
              </div>
            </div>
          </div>

          {/* Facility Details */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {tb.facilityDetails}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.floorCount}</p>
                  <p className={`text-sm ${branch.floorCount ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.floorCount || tb.notSet}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.areaSize}</p>
                  <p className={`text-sm ${branch.areaSize ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.areaSize ? `${branch.areaSize.toLocaleString()} ${tb.sqm}` : tb.notSet}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Civil Defense Certificate */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {tb.civilDefenseCertificate}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.certificateNumber}</p>
                  <p className={`text-sm ${branch.cdCertificateNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.cdCertificateNumber || tb.notSet}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.expiryDate}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${branch.cdCertificateExpiry ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {formatDate(branch.cdCertificateExpiry) || tb.notSet}
                    </span>
                    {isCertificateExpired() && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 me-1" />
                        {tb.expired}
                      </Badge>
                    )}
                    {isCertificateExpiringSoon() && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                        <AlertTriangle className="h-3 w-3 me-1" />
                        {tb.expiringSoon}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {branch.cdCertificateUrl && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.certificateDocument}</p>
                  <a
                    href={branch.cdCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {tb.viewCertificate}
                  </a>
                </div>
              </div>
            )}
          </div>


          {/* Contact Person */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {tb.contactPerson}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.name}</p>
                  <p className={`text-sm ${branch.contactPersonName ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.contactPersonName || tb.notSet}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.phone}</p>
                  <p className={`text-sm ${branch.contactPersonPhone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.contactPersonPhone || tb.notSet}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3col-span-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{tb.email}</p>
                  <p className={`text-sm ${branch.contactPersonEmail ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.contactPersonEmail || tb.notSet}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {tb.notes}
            </h4>
            <p className={`text-sm ${branch.notes ? 'whitespace-pre-line' : 'text-muted-foreground italic'}`}>
              {branch.notes || tb.noNotes}
            </p>
          </div>

          {/* Edit prompt if profile is incomplete */}
          {canEdit && (!branch.municipality || !branch.buildingType || !branch.cdCertificateNumber) && (
            <div className="pt-4 border-t">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">{tb.profileIncomplete}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {tb.completeProfileDesc}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-white"
                    onClick={() => setEditOpen(true)}
                  >
                    <Edit className="h-4 w-4 me-1" />
                    {tb.completeProfile}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BranchProfileForm
        branch={branch}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
