'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mail, Phone, Building2, FileText, Users, Edit,
  AlertTriangle, MapPin, MessageCircle
} from 'lucide-react'
import { ClientProfileForm } from './client-profile-form'
import { useTranslation } from '@/lib/i18n/use-translation'

interface ContactPerson {
  name: string
  phone: string
  email: string
  whatsapp: string
}

interface ClientProfileCardProps {
  client: {
    id: string
    companyName: string
    companyPhone: string | null
    companyEmail: string | null
    contactPersonName: string | null
    contactPersonPhone: string | null
    contactPersonEmail: string | null
    crNumber: string | null
    vatNumber: string | null
    billingAddress: string | null
    contacts: ContactPerson[] | null
    user: {
      email: string
      status: string
    }
  }
  canEdit: boolean
}

export function ClientProfileCard({ client, canEdit }: ClientProfileCardProps) {
  const { t } = useTranslation()
  const tc = t.dashboard.clientProfileCard
  const [editOpen, setEditOpen] = useState(false)

  const contacts = client.contacts as ContactPerson[] | null
  const isProfileIncomplete = !client.crNumber || !client.vatNumber || !client.billingAddress || !client.contactPersonName || !client.contactPersonPhone || !client.contactPersonEmail

  return (
    <>
      {/* Header Banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl bg-white shadow-sm border flex items-center justify-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {client.companyName || tc.companyName}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  {client.billingAddress && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {client.billingAddress}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {client.user.email}
                  </span>
                  {client.companyPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {client.companyPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 me-1" />
                {tc.editProfile}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Primary Contact Person Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {tc.primaryContactPerson}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{tc.name}</span>
                <span className="text-sm font-medium">
                  {client.contactPersonName || <span className="text-muted-foreground italic">{tc.notSet}</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{tc.phone}</span>
                <span className="text-sm font-medium">
                  {client.contactPersonPhone || <span className="text-muted-foreground italic">{tc.notSet}</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{tc.email}</span>
                <span className="text-sm font-medium">
                  {client.contactPersonEmail || <span className="text-muted-foreground italic">{tc.notSet}</span>}
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
              {tc.registrationTax}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{tc.crBusinessLicense}</span>
                <span className="text-sm font-medium">
                  {client.crNumber || <span className="text-muted-foreground italic">{tc.notSet}</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{tc.vatTaxId}</span>
                <span className="text-sm font-medium">
                  {client.vatNumber || <span className="text-muted-foreground italic">{tc.notSet}</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Contact Persons - Full Width */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {tc.additionalContacts}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg border">
                  <p className="font-medium text-sm mb-2">{contact.name || `${tc.contact} ${index + 1}`}</p>
                  <div className="space-y-1.5">
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </div>
                    )}
                    {contact.whatsapp && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {contact.whatsapp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">{tc.noAdditionalContacts}</p>
          )}
        </CardContent>
      </Card>

      {/* Profile Incomplete Warning */}
      {canEdit && isProfileIncomplete && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">{tc.profileIncomplete}</p>
                <p className="text-sm text-amber-600 mt-1">
                  {tc.completeProfileDesc}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4 me-1" />
                {tc.completeProfile}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ClientProfileForm
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
