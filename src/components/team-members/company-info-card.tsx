'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  User,
  Briefcase,
} from 'lucide-react'

interface CompanyInfoCardProps {
  contractor: {
    companyName: string | null
    companyEmail: string | null
    companyPhone: string | null
    companyAddress: string | null
    contactPersonName: string | null
    contactPersonPhone: string | null
    contactPersonEmail: string | null
    crNumber: string | null
    vatNumber: string | null
    businessType: string | null
    website: string | null
  }
}

export function CompanyInfoCard({ contractor }: CompanyInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          View your company's profile details
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <h3 className="text-2xl font-bold">{contractor.companyName || 'Company Name Not Set'}</h3>
          {contractor.businessType && (
            <p className="text-sm text-muted-foreground mt-1">{contractor.businessType}</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className={`text-sm ${contractor.companyEmail ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.companyEmail || 'Not set'}
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
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">CR Number</p>
              <p className={`text-sm ${contractor.crNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.crNumber || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">VAT Number</p>
              <p className={`text-sm ${contractor.vatNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.vatNumber || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className={`text-sm ${contractor.companyAddress ? 'font-medium whitespace-pre-line' : 'text-muted-foreground italic'}`}>
              {contractor.companyAddress || 'Not set'}
            </p>
          </div>
        </div>

        {/* Website */}
        {contractor.website && (
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Website</p>
              <a
                href={contractor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {contractor.website}
              </a>
            </div>
          </div>
        )}

        {/* Contact Person */}
        {(contractor.contactPersonName || contractor.contactPersonPhone || contractor.contactPersonEmail) && (
          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Person
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {contractor.contactPersonName && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{contractor.contactPersonName}</p>
                  </div>
                </div>
              )}

              {contractor.contactPersonPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{contractor.contactPersonPhone}</p>
                  </div>
                </div>
              )}

              {contractor.contactPersonEmail && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{contractor.contactPersonEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
