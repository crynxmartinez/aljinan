import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddBranchForm } from './add-branch-form'

async function getClient(clientId: string, userId: string) {
  const contractor = await prisma.contractor.findUnique({
    where: { userId }
  })

  if (!contractor) return null

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      contractorId: contractor.id,
    }
  })

  return client
}

export default async function AddBranchPage({
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Branch</h1>
        <p className="text-muted-foreground mt-1">
          Add a new location for {client.companyName}
        </p>
      </div>

      <AddBranchForm clientId={clientId} />
    </div>
  )
}
