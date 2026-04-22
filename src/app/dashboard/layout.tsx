import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { NotificationPopup } from '@/components/notifications/notification-popup'
import { getCached, CACHE_TAGS } from '@/lib/cache'

async function getClientsForContractor(userId: string) {
  return getCached(CACHE_TAGS.CONTRACTOR_CLIENTS(userId), async () => {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      select: {  // Use select instead of include for better performance
        clients: {
          where: {
            user: {
              status: { not: 'ARCHIVED' }
            }
          },
          select: {  // Only select what's needed
            id: true,
            slug: true,
            companyName: true,
            displayName: true,
            branches: {
              where: { isActive: true },
              select: {  // Only select what's needed
                id: true,
                slug: true,
                name: true,
                address: true,
                displayName: true
              },
              orderBy: { createdAt: 'asc' },
              take: 100  // Limit branches per client
            }
          },
          orderBy: { companyName: 'asc' },
          take: 200  // Limit total clients
        }
      }
    })

    return contractor?.clients.map(client => ({
      id: client.id,
      slug: client.slug,
      companyName: client.companyName,
      displayName: client.displayName,
      branches: client.branches
    })) || []
  }, 300) // Cache for 5 minutes
}

async function getClientsForTeamMember(assignedBranchIds: string[]) {
  // Get branches the team member has access to
  const branches = await prisma.branch.findMany({
    where: {
      id: { in: assignedBranchIds },
      isActive: true
    },
    include: {
      client: {
        include: {
          user: {
            select: { status: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Group branches by client
  const clientMap = new Map<string, {
    id: string
    slug: string | null
    companyName: string
    displayName?: string | null
    branches: { id: string; slug: string | null; name: string; address: string; displayName?: string | null }[]
  }>()

  branches.forEach(branch => {
    // Skip if client is archived
    if (branch.client.user.status === 'ARCHIVED') return

    if (!clientMap.has(branch.client.id)) {
      clientMap.set(branch.client.id, {
        id: branch.client.id,
        slug: branch.client.slug,
        companyName: branch.client.companyName,
        displayName: branch.client.displayName,
        branches: []
      })
    }
    clientMap.get(branch.client.id)!.branches.push({
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      address: branch.address,
      displayName: branch.displayName
    })
  })

  // Sort clients by company name
  return Array.from(clientMap.values()).sort((a, b) =>
    a.companyName.localeCompare(b.companyName)
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Redirect CLIENT role to portal
  if (session.user.role === 'CLIENT') {
    redirect('/portal')
  }

  // Redirect ADMIN role to admin dashboard
  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  // Get clients based on user role
  let clients
  if (session.user.role === 'TEAM_MEMBER' && session.user.assignedBranchIds) {
    clients = await getClientsForTeamMember(session.user.assignedBranchIds)
  } else {
    clients = await getClientsForContractor(session.user.id)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        clients={clients}
        userRole={session.user.role}
        teamMemberRole={session.user.teamMemberRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userName={session.user.name} />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
      {session.user.role === 'CONTRACTOR' && <NotificationPopup userRole="CONTRACTOR" />}
    </div>
  )
}
