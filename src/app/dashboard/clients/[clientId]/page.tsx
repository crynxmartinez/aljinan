import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Plus, Building2 } from 'lucide-react'
import { ClientProfileCard } from '@/components/clients/client-profile-card'

async function getClient(clientId: string, userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId }
  })

  if (!contractor) return null

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      contractorId: contractor.id,
    },
    include: {
      user: {
        select: {
          email: true,
          status: true,
        }
      },
      branches: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return client
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { clientId } = await params
  const client = await getClient(clientId, session.user.id)

  if (!client) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Archived</Badge>
      default:
        return null
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.companyName}</h1>
              {getStatusBadge(client.user.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              {client.branches.length} branch{client.branches.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/clients/${clientId}/branches/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>
                All locations for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.branches.length === 0 ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">No branches yet</p>
                  <Link href={`/dashboard/clients/${clientId}/branches/new`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Branch
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/dashboard/clients/${clientId}/branches/${branch.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.address}</p>
                          {branch.city && (
                            <p className="text-sm text-muted-foreground">{branch.city}</p>
                          )}
                        </div>
                      </div>
                      {!branch.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ClientProfileCard 
            client={{
              ...client,
              contacts: client.contacts as { name: string; phone: string; email: string; whatsapp: string }[] | null,
            }} 
            canEdit={true} 
          />
        </div>
      </div>
    </div>
  )
}
