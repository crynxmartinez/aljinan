import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSidebar } from '@/components/layout/client-sidebar'

async function getClientData(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      contractor: {
        select: {
          companyName: true,
        }
      },
      branches: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return client
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Only CLIENT and MANAGER roles can access portal
  if (session.user.role !== 'CLIENT' && session.user.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  const client = await getClientData(session.user.id)

  if (!client) {
    redirect('/login')
  }

  const clientData = {
    id: client.id,
    companyName: client.companyName,
    contractor: {
      companyName: client.contractor.companyName,
    },
    branches: client.branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
    }))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientSidebar client={clientData} />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
