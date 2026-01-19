import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Calendar, DollarSign, Receipt, Building2, Phone, Mail, 
  ArrowRight, ChevronRight, Edit, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { BranchRequestForm } from './branch-request-form'

async function getClientDashboardData(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      contractor: {
        select: {
          companyName: true,
          companyPhone: true,
          companyEmail: true,
        }
      },
      branches: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return client
}

export default async function PortalDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const client = await getClientDashboardData(session.user.id)

  if (!client) {
    redirect('/login')
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

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.companyName}</h1>
            <p className="text-muted-foreground">
              Managed by {client.contractor.companyName || 'your contractor'}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Expiry Alert */}
      {(isContractExpired() || isContractExpiringSoon()) && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          isContractExpired() 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertTriangle className={`h-5 w-5 ${isContractExpired() ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <p className={`font-medium ${isContractExpired() ? 'text-red-800' : 'text-amber-800'}`}>
              {isContractExpired() ? 'Contract Expired' : 'Contract Expiring Soon'}
            </p>
            <p className={`text-sm ${isContractExpired() ? 'text-red-600' : 'text-amber-600'}`}>
              {isContractExpired() 
                ? `Your contract expired on ${formatDate(client.contractExpiryDate)}. Please contact your contractor.`
                : `Your contract expires on ${formatDate(client.contractExpiryDate)}.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Branches</p>
                <p className="text-3xl font-bold">{client.branches.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Quotes</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Branches - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Branches</CardTitle>
                <CardDescription>Manage your facility locations</CardDescription>
              </div>
              <BranchRequestForm />
            </CardHeader>
            <CardContent>
              {client.branches.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No branches yet</p>
                  <p className="text-sm text-muted-foreground">
                    Request a new branch to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/portal/branches/${branch.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.name || branch.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.city}{branch.state ? `, ${branch.state}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!branch.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Company Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Company Profile</CardTitle>
              <Link href="/portal/settings">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.crNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">CR Number</p>
                  <p className="text-sm font-medium">{client.crNumber}</p>
                </div>
              )}
              {client.vatNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">VAT Number</p>
                  <p className="text-sm font-medium">{client.vatNumber}</p>
                </div>
              )}
              {client.contractStartDate && client.contractExpiryDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Contract Period</p>
                  <p className="text-sm font-medium">
                    {formatDate(client.contractStartDate)} - {formatDate(client.contractExpiryDate)}
                  </p>
                </div>
              )}
              {!client.crNumber && !client.vatNumber && !client.contractStartDate && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Profile not complete</p>
                  <Link href="/portal/settings">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contractor Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Contractor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{client.contractor.companyName || 'Not specified'}</p>
                  <p className="text-xs text-muted-foreground">Service Provider</p>
                </div>
              </div>
              {client.contractor.companyEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.contractor.companyEmail}</span>
                </div>
              )}
              {client.contractor.companyPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.contractor.companyPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
