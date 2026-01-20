import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientProfileCard } from '@/components/clients/client-profile-card'

async function getClientProfile(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          email: true,
          status: true,
        }
      }
    }
  })
  return client
}

export default async function ClientSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const client = await getClientProfile(session.user.id)

  if (!client) {
    redirect('/portal')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your company information
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
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
