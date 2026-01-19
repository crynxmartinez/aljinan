'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Phone, Building2, FileText, Calendar, Edit,
  AlertTriangle, Layers, Ruler
} from 'lucide-react'
import { BranchProfileForm } from './branch-profile-form'

const BUILDING_TYPE_LABELS: Record<string, string> = {
  OFFICE: 'Office',
  RETAIL: 'Retail',
  WAREHOUSE: 'Warehouse',
  INDUSTRIAL: 'Industrial',
  RESIDENTIAL: 'Residential',
  HOSPITAL: 'Hospital',
  EDUCATIONAL: 'Educational',
  HOTEL: 'Hotel',
  RESTAURANT: 'Restaurant',
  MALL: 'Mall',
  MIXED_USE: 'Mixed Use',
  PARKING: 'Parking',
  MOSQUE: 'Mosque',
  GOVERNMENT: 'Government',
  SPORTS: 'Sports',
  DATA_CENTER: 'Data Center',
  OTHER: 'Other',
}

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
  }
  canEdit: boolean
}

export function BranchProfileCard({ branch, canEdit }: BranchProfileCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <CardTitle>Facility Profile</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{getFullAddress()}</p>
              </div>
            </div>

            {branch.municipality && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Municipality / CD Region</p>
                  <p className="font-medium">{branch.municipality}</p>
                </div>
              </div>
            )}

            {branch.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{branch.phone}</p>
                </div>
              </div>
            )}
          </div>

          {(branch.buildingType || branch.floorCount || branch.areaSize) && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Facility Details
              </h4>

              {branch.buildingType && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Building Type</p>
                    <p className="font-medium">{BUILDING_TYPE_LABELS[branch.buildingType] || branch.buildingType}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {branch.floorCount && (
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floors</p>
                      <p className="font-medium">{branch.floorCount}</p>
                    </div>
                  </div>
                )}

                {branch.areaSize && (
                  <div className="flex items-center gap-3">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-medium">{branch.areaSize.toLocaleString()} sqm</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(branch.cdCertificateNumber || branch.cdCertificateExpiry) && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Civil Defense Certificate
              </h4>

              {branch.cdCertificateNumber && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="font-medium">{branch.cdCertificateNumber}</p>
                  </div>
                </div>
              )}

              {branch.cdCertificateExpiry && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDate(branch.cdCertificateExpiry)}</span>
                      {isCertificateExpired() && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {isCertificateExpiringSoon() && (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {branch.cdCertificateUrl && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Document</p>
                    <a 
                      href={branch.cdCertificateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      View Certificate
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {branch.notes && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Notes
              </h4>
              <p className="text-sm whitespace-pre-line">{branch.notes}</p>
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
