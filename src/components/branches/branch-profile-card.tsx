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
  activeProject?: {
    title: string
    startDate: string | null
    endDate: string | null
  } | null
  canEdit: boolean
}

export function BranchProfileCard({ branch, activeProject, canEdit }: BranchProfileCardProps) {
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
          {/* Basic Location Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{getFullAddress()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className={`text-sm ${branch.phone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.phone || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Municipality / CD Region</p>
                <p className={`text-sm ${branch.municipality ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.municipality || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Building Type</p>
                <p className={`text-sm ${branch.buildingType ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {branch.buildingType ? (BUILDING_TYPE_LABELS[branch.buildingType] || branch.buildingType) : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Facility Details */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Facility Details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Floor Count</p>
                  <p className={`text-sm ${branch.floorCount ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.floorCount || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Area Size</p>
                  <p className={`text-sm ${branch.areaSize ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.areaSize ? `${branch.areaSize.toLocaleString()} sqm` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Civil Defense Certificate */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Civil Defense Certificate
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Certificate Number</p>
                  <p className={`text-sm ${branch.cdCertificateNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {branch.cdCertificateNumber || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${branch.cdCertificateExpiry ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {formatDate(branch.cdCertificateExpiry) || 'Not set'}
                    </span>
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
            </div>

            {branch.cdCertificateUrl && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Certificate Document</p>
                  <a 
                    href={branch.cdCertificateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View Certificate
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Active Project / Contract Period */}
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Active Contract
            </h4>
            {activeProject ? (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{activeProject.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeProject.startDate || activeProject.endDate ? (
                      <>
                        {formatDate(activeProject.startDate) || 'Not set'} → {formatDate(activeProject.endDate) || 'Not set'}
                      </>
                    ) : (
                      'No dates set'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No active contract</p>
            )}
          </div>

          {/* Notes */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Notes
            </h4>
            <p className={`text-sm ${branch.notes ? 'whitespace-pre-line' : 'text-muted-foreground italic'}`}>
              {branch.notes || 'No notes'}
            </p>
          </div>

          {/* Edit prompt if profile is incomplete */}
          {canEdit && (!branch.municipality || !branch.buildingType || !branch.cdCertificateNumber) && (
            <div className="pt-4 border-t">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Profile Incomplete</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Complete your facility profile for Civil Defense compliance.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 bg-white"
                    onClick={() => setEditOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Complete Profile
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
