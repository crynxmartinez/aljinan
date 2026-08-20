import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mail, Phone, Building2 } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from '@/lib/i18n/server'

async function getClientAndContractor(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      user: true,
      contractor: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }
    }
  })

  return client
}

export default async function ArchivedNoticePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Only show this page for archived clients
  if (session.user.role !== 'CLIENT' || session.user.status !== 'ARCHIVED') {
    redirect('/portal')
  }

  const client = await getClientAndContractor(session.user.id)

  if (!client) {
    redirect('/login')
  }

  const t = await getTranslations()
  const ta = t.dashboard.portalArchivedPage

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-2xl w-full border-amber-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-100 p-4">
              <AlertTriangle className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-amber-900">{ta.accountArchived}</CardTitle>
          <CardDescription className="text-base mt-2">
            {ta.accountArchivedDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 text-center">
              {ta.archivedMessage}
            </p>
          </div>

          {/* Contractor Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              {ta.yourContractor}
            </h3>

            <div className="bg-white border rounded-lg p-4 space-y-3">
              {client.contractor.user.name && (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {client.contractor.user.name}
                    </p>
                  </div>
                </div>
              )}

              {client.contractor.user.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{ta.email}</p>
                    <a
                      href={`mailto:${client.contractor.user.email}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {client.contractor.user.email}
                    </a>
                  </div>
                </div>
              )}

              {client.contractor.companyPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{ta.phone}</p>
                    <a
                      href={`tel:${client.contractor.companyPhone}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {client.contractor.companyPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            {client.contractor.user.email && (
              <Button asChild className="w-full">
                <a href={`mailto:${client.contractor.user.email}?subject=Account Reactivation Request - ${client.companyName}`}>
                  <Mail className="h-4 w-4 me-2" />
                  {ta.contactContractorEmail}
                </a>
              </Button>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/signout">
                {ta.signOut}
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              {ta.errorNotice}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
