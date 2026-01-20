'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, Phone, Mail, MapPin, Globe, FileText, Calendar, Edit,
  AlertTriangle, Shield, Briefcase
} from 'lucide-react'
import { ContractorProfileForm } from './contractor-profile-form'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  LLC: 'LLC',
  CORPORATION: 'Corporation',
  SOLE_PROPRIETOR: 'Sole Proprietor',
  PARTNERSHIP: 'Partnership',
  JOINT_VENTURE: 'Joint Venture',
  GOVERNMENT: 'Government',
  NON_PROFIT: 'Non-Profit',
  OTHER: 'Other',
}

interface ContractorProfileCardProps {
  contractor: {
    id: string
    companyName: string | null
    companyPhone: string | null
    companyEmail: string | null
    companyAddress: string | null
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
    user: {
      email: string
      name: string | null
    }
  }
}

export function ContractorProfileCard({ contractor }: ContractorProfileCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false
    const expiry = new Date(dateString)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  const isProfileIncomplete = !contractor.crNumber || !contractor.vatNumber || !contractor.licenseNumber

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Profile</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Company Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Company Name</p>
                <p className={`text-sm ${contractor.companyName ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.companyName || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Business Type</p>
                <p className={`text-sm ${contractor.businessType ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.businessType ? (BUSINESS_TYPE_LABELS[contractor.businessType] || contractor.businessType) : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className={`text-sm ${contractor.companyEmail ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.companyEmail || contractor.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className={`text-sm ${contractor.companyPhone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.companyPhone || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className={`text-sm ${contractor.companyAddress ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.companyAddress || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                {contractor.website ? (
                  <a 
                    href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {contractor.website}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not set</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Year Established</p>
                <p className={`text-sm ${contractor.yearEstablished ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {contractor.yearEstablished || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Registration & Tax */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Registration & Tax
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">CR / Business License Number</p>
                  <p className={`text-sm ${contractor.crNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {contractor.crNumber || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">VAT / Tax ID</p>
                  <p className={`text-sm ${contractor.vatNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {contractor.vatNumber || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Licensing */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contractor License
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">License Number</p>
                  <p className={`text-sm ${contractor.licenseNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {contractor.licenseNumber || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">License Expiry</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${contractor.licenseExpiry ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {formatDate(contractor.licenseExpiry) || 'Not set'}
                    </span>
                    {isExpired(contractor.licenseExpiry) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {isExpiringSoon(contractor.licenseExpiry) && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Insurance
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Insurance Certificate</p>
                  {contractor.insuranceCertUrl ? (
                    <a 
                      href={contractor.insuranceCertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View Certificate
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not uploaded</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Insurance Expiry</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${contractor.insuranceExpiry ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {formatDate(contractor.insuranceExpiry) || 'Not set'}
                    </span>
                    {isExpired(contractor.insuranceExpiry) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {isExpiringSoon(contractor.insuranceExpiry) && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Service Areas
            </h4>
            {contractor.serviceAreas && contractor.serviceAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contractor.serviceAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No service areas defined</p>
            )}
          </div>

          {/* Edit prompt if profile is incomplete */}
          {isProfileIncomplete && (
            <div className="pt-4 border-t">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Profile Incomplete</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Complete your company profile for compliance and credibility.
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

      <ContractorProfileForm
        contractor={contractor}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
