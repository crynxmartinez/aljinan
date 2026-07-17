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

async function getClient(clientSlugOrId: string, userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId }
  })

  if (!contractor) return null

  // Try to find by slug first, then by ID (for backwards compatibility)
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { slug: clientSlugOrId },
        { id: clientSlugOrId }
      ],
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

async function getClientForTeamMember(clientSlugOrId: string, userId: string, assignedBranchIds: string[]) {
  // Try to find by slug first, then by ID (for backwards compatibility)
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { slug: clientSlugOrId },
        { id: clientSlugOrId }
      ],
      branches: {
        some: {
          id: { in: assignedBranchIds }
        }
      }
    },
    include: {
      user: {
        select: {
          email: true,
          status: true,
        }
      },
      branches: {
        where: {
          id: { in: assignedBranchIds },
          isActive: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return client
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { clientSlug } = await params

  // Get client based on user role
  let client
  if (session.user.role === 'TEAM_MEMBER' && session.user.assignedBranchIds) {
    client = await getClientForTeamMember(clientSlug, session.user.id, session.user.assignedBranchIds)
  } else {
    client = await getClient(clientSlug, session.user.id)
  }

  if (!client) {
    notFound()
  }

  const isTeamMember = session.user.role === 'TEAM_MEMBER'

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
              {isTeamMember ? 'Assigned branches: ' : ''}{client.branches.length} branch{client.branches.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        {!isTeamMember && (
          <Link href={`/dashboard/clients/${client.slug || client.id}/branches/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>
                {isTeamMember ? 'Your assigned locations' : 'All locations for this client'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.branches.length === 0 ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">
                    {isTeamMember ? 'No branches assigned' : 'No branches yet'}
                  </p>
                  {!isTeamMember && (
                    <Link href={`/dashboard/clients/${client.slug || client.id}/branches/new`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Branch
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {client.branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.displayName || branch.clientNickname || branch.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.address}{branch.city ? `, ${branch.city}` : ''}
                          </p>
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
            canEdit={!isTeamMember}
          />
        </div>
      </div>
    </div>
  )
}
