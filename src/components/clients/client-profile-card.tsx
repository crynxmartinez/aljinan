'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, Phone, Building2, FileText, Calendar, Users, Edit,
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
    contractStartDate: string | null
    contractExpiryDate: string | null
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isContractExpiringSoon = () => {
    if (!client.contractExpiryDate) return false
    const expiry = new Date(client.contractExpiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isContractExpired = () => {
    if (!client.contractExpiryDate) return false
    return new Date(client.contractExpiryDate) < new Date()
  }

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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.user.email}</p>
              </div>
            </div>

            {client.companyPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.companyPhone}</p>
                </div>
              </div>
            )}

            {client.crNumber && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">CR Number</p>
                  <p className="font-medium">{client.crNumber}</p>
                </div>
              </div>
            )}

            {client.vatNumber && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">VAT Number</p>
                  <p className="font-medium">{client.vatNumber}</p>
                </div>
              </div>
            )}

            {client.billingAddress && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Billing Address</p>
                  <p className="font-medium whitespace-pre-line">{client.billingAddress}</p>
                </div>
              </div>
            )}
          </div>

          {(client.contractStartDate || client.contractExpiryDate) && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contract Period
              </h4>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {formatDate(client.contractStartDate) || 'Not set'} 
                      {' → '}
                      {formatDate(client.contractExpiryDate) || 'Not set'}
                    </span>
                    {isContractExpired() && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {isContractExpiringSoon() && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {contacts && contacts.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contact Persons
              </h4>
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{contact.name || `Contact ${index + 1}`}</p>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {contact.phone && <p>📞 {contact.phone}</p>}
                      {contact.email && <p>✉️ {contact.email}</p>}
                      {contact.whatsapp && <p>💬 {contact.whatsapp}</p>}
                    </div>
                  </div>
                ))}
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
