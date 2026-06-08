'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Phone, Mail, MapPin, Globe, FileText, Calendar, Edit,
  AlertTriangle, Shield, Briefcase, Users, CreditCard, CheckCircle,
  Clock, ExternalLink
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

  const getTimeRemaining = (dateString: string | null) => {
    if (!dateString) return null
    const expiry = new Date(dateString)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return '1 day left'
    if (diffDays < 30) return `${diffDays} days left`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months left`
    return `${Math.floor(diffDays / 365)} years left`
  }

  const isProfileIncomplete = !contractor.crNumber || !contractor.vatNumber || !contractor.licenseNumber

  return (
    <>
      {/* Header Banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl bg-white shadow-sm border flex items-center justify-center">
                {contractor.logoUrl ? (
                  <img src={contractor.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg" />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {contractor.companyName || 'Company Name'}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {contractor.businessType && (
                    <span>{BUSINESS_TYPE_LABELS[contractor.businessType] || contractor.businessType}</span>
                  )}
                  {contractor.yearEstablished && (
                    <>
                      <span>•</span>
                      <span>Est. {contractor.yearEstablished}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  {contractor.companyAddress && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {contractor.companyAddress}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {contractor.companyEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {contractor.companyEmail}
                    </span>
                  )}
                  {contractor.companyPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {contractor.companyPhone}
                    </span>
                  )}
                  {contractor.website && (
                    <a
                      href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {contractor.website}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Subscription Card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Subscription</h3>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional Plan • Next billing: Jul 15, 2026
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-1" />
                View History
              </Button>
              <Button size="sm">
                <CreditCard className="h-4 w-4 mr-1" />
                Pay My Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Person Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Contact Person
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">
                  {contractor.contactPersonName || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-medium">
                  {contractor.contactPersonPhone || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">
                  {contractor.contactPersonEmail || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration & Tax Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Registration & Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">CR / Business License</span>
                <span className="text-sm font-medium">
                  {contractor.crNumber || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">VAT / Tax ID</span>
                <span className="text-sm font-medium">
                  {contractor.vatNumber || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contractor License Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Contractor License
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">License Number</span>
                <span className="text-sm font-medium">
                  {contractor.licenseNumber || <span className="text-muted-foreground italic">Not set</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Expiry Date</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatDate(contractor.licenseExpiry) || <span className="text-muted-foreground italic">Not set</span>}
                  </span>
                  {contractor.licenseExpiry && (
                    <>
                      {isExpired(contractor.licenseExpiry) ? (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      ) : isExpiringSoon(contractor.licenseExpiry) ? (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                          {getTimeRemaining(contractor.licenseExpiry)}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          {getTimeRemaining(contractor.licenseExpiry)}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Certificate</span>
                {contractor.insuranceCertUrl ? (
                  <a
                    href={contractor.insuranceCertUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    View Certificate
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not uploaded</span>
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Expiry Date</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatDate(contractor.insuranceExpiry) || <span className="text-muted-foreground italic">Not set</span>}
                  </span>
                  {contractor.insuranceExpiry && (
                    <>
                      {isExpired(contractor.insuranceExpiry) ? (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      ) : isExpiringSoon(contractor.insuranceExpiry) ? (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                          {getTimeRemaining(contractor.insuranceExpiry)}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          {getTimeRemaining(contractor.insuranceExpiry)}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Areas - Full Width */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractor.serviceAreas && contractor.serviceAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contractor.serviceAreas.map((area, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {area}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No service areas defined</p>
          )}
        </CardContent>
      </Card>

      {/* Profile Incomplete Warning */}
      {isProfileIncomplete && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Profile Incomplete</p>
                <p className="text-sm text-amber-600 mt-1">
                  Complete your company profile for compliance and credibility.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ContractorProfileForm
        contractor={contractor}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
