'use client'
import { enumLabel } from '@/lib/i18n/enum-labels'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  User,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t, locale } = useTranslation()
  const tc = t.dashboard.companyInfoCard
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {tc.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {tc.subtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <h3 className="text-2xl font-bold">{contractor.companyName || tc.companyNameNotSet}</h3>
          {contractor.businessType && (
            <p className="text-sm text-muted-foreground mt-1">{enumLabel(contractor.businessType, locale)}</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{tc.emailLabel}</p>
              <p className={`text-sm ${contractor.companyEmail ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.companyEmail || tc.notSet}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{tc.phoneLabel}</p>
              <p className={`text-sm ${contractor.companyPhone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.companyPhone || tc.notSet}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{tc.crNumberLabel}</p>
              <p className={`text-sm ${contractor.crNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.crNumber || tc.notSet}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{tc.vatNumberLabel}</p>
              <p className={`text-sm ${contractor.vatNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                {contractor.vatNumber || tc.notSet}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{tc.addressLabel}</p>
            <p className={`text-sm ${contractor.companyAddress ? 'font-medium whitespace-pre-line' : 'text-muted-foreground italic'}`}>
              {contractor.companyAddress || tc.notSet}
            </p>
          </div>
        </div>

        {/* Website */}
        {contractor.website && (
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{tc.websiteLabel}</p>
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
              {tc.contactPersonTitle}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {contractor.contactPersonName && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tc.nameLabel}</p>
                    <p className="text-sm font-medium">{contractor.contactPersonName}</p>
                  </div>
                </div>
              )}

              {contractor.contactPersonPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tc.phoneLabel}</p>
                    <p className="text-sm font-medium">{contractor.contactPersonPhone}</p>
                  </div>
                </div>
              )}

              {contractor.contactPersonEmail && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tc.emailLabel}</p>
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
