import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TeamList } from './team-list'

async function getTeamMembers(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
              status: true,
            }
          },
          branchAccess: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  client: {
                    select: {
                      id: true,
                      companyName: true,
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      clients: {
        include: {
          branches: {
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { companyName: 'asc' }
      }
    }
  })

  return {
    teamMembers: contractor?.teamMembers || [],
    clients: contractor?.clients || []
  }
}

export default async function TeamPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'CONTRACTOR') {
    redirect('/dashboard')
  }

  const { teamMembers, clients } = await getTeamMembers(session.user.id)

  return (
    <div className="p-8">
      <TeamList teamMembers={teamMembers} clients={clients} />
    </div>
  )
}
