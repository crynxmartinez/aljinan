import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'

async function getClients(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      clients: {
        where: {
          user: {
            status: { not: 'ARCHIVED' }
          }
        },
        include: {
          branches: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { companyName: 'asc' }
      }
    }
  })

  return contractor?.clients.map(client => ({
    id: client.id,
    companyName: client.companyName,
    branches: client.branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address
    }))
  })) || []
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

  const clients = await getClients(session.user.id)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar clients={clients} />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
