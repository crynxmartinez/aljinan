'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, Phone, Building2, FileText, Users, Edit,
  AlertTriangle
} from 'lucide-react'
import { ClientProfileForm } from './client-profile-form'

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
  const [editOpen, setEditOpen] = useState(false)

  const contacts = client.contacts as ContactPerson[] | null

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Profile</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{client.user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className={`text-sm ${client.companyPhone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {client.companyPhone || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">CR Number</p>
                <p className={`text-sm ${client.crNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {client.crNumber || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">VAT Number</p>
                <p className={`text-sm ${client.vatNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                  {client.vatNumber || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="flex items-start gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Billing Address</p>
              <p className={`text-sm ${client.billingAddress ? 'font-medium whitespace-pre-line' : 'text-muted-foreground italic'}`}>
                {client.billingAddress || 'Not set'}
              </p>
            </div>
          </div>

          {/* Contact Persons */}
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Persons
            </h4>
            {contacts && contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">{contact.name || `Contact ${index + 1}`}</p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {contact.phone && <p>📞 {contact.phone}</p>}
                      {contact.email && <p>✉️ {contact.email}</p>}
                      {contact.whatsapp && <p>💬 {contact.whatsapp}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No contacts added</p>
            )}
          </div>

          {/* Edit prompt if profile is incomplete */}
          {canEdit && (!client.crNumber || !client.vatNumber || !client.billingAddress) && (
            <div className="pt-4 border-t">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Profile Incomplete</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Complete your company profile to ensure smooth operations and compliance.
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

      <ClientProfileForm
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
