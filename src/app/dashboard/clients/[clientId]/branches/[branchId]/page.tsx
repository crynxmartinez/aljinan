import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { BranchWorkspace } from './branch-workspace'

async function getBranchForContractor(clientId: string, branchId: string, userId: string) {
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
      branches: {
        where: { id: branchId }
      }
    }
  })

  if (!client || client.branches.length === 0) return null

  return {
    client: {
      id: client.id,
      companyName: client.companyName,
    },
    branch: client.branches[0],
  }
}

async function getBranchForTeamMember(clientId: string, branchId: string, assignedBranchIds: string[]) {
  // Check if team member has access to this branch
  if (!assignedBranchIds.includes(branchId)) return null

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      clientId: clientId,
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
        }
      }
    }
  })

  if (!branch) return null

  return {
    client: {
      id: branch.client.id,
      companyName: branch.client.companyName,
    },
    branch: branch,
  }
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ clientId: string; branchId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { clientId, branchId } = await params
  
  // Get branch data based on user role
  let data
  if (session.user.role === 'TEAM_MEMBER' && session.user.assignedBranchIds) {
    data = await getBranchForTeamMember(clientId, branchId, session.user.assignedBranchIds)
  } else {
    data = await getBranchForContractor(clientId, branchId, session.user.id)
  }

  if (!data) {
    notFound()
  }

  const { client, branch } = data

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {client.companyName}
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{client.companyName}</p>
          <h1 className="text-2xl font-bold">{branch.address}</h1>
          {branch.city && (
            <p className="text-muted-foreground">{branch.city}{branch.state ? `, ${branch.state}` : ''}</p>
          )}
        </div>
      </div>

      <BranchWorkspace 
        clientId={clientId} 
        branchId={branchId} 
        branch={branch}
        userRole={session.user.role}
        teamMemberRole={session.user.teamMemberRole}
      />
    </div>
  )
}
