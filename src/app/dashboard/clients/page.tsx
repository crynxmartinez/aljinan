import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientsList } from './clients-list'

async function getClients(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      clients: {
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
        },
        orderBy: { companyName: 'asc' }
      }
    }
  })

  return contractor?.clients || []
}

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const clients = await getClients(session.user.id)

  return (
    <div className="p-8">
      <ClientsList clients={clients} />
    </div>
  )
}
