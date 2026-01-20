import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContractorProfileCard } from '@/components/contractors/contractor-profile-card'

async function getContractorProfile(userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    }
  })

  return contractor
}

export default async function CompanyProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const contractor = await getContractorProfile(session.user.id)

  if (!contractor) {
    redirect('/dashboard')
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
          <ContractorProfileCard 
            contractor={{
              ...contractor,
              licenseExpiry: contractor.licenseExpiry?.toISOString() || null,
              insuranceExpiry: contractor.insuranceExpiry?.toISOString() || null,
              serviceAreas: contractor.serviceAreas as string[] | null,
            }} 
          />
        </div>
      </div>
    </div>
  )
}
