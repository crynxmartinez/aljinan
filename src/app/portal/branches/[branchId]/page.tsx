import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { ClientBranchWorkspace } from './client-branch-workspace'

async function getBranch(branchId: string, userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      branches: {
        where: { id: branchId, isActive: true }
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

export default async function ClientBranchPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { branchId } = await params
  const data = await getBranch(branchId, session.user.id)

  if (!data) {
    notFound()
  }

  const { branch } = data

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/portal"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{branch.name}</h1>
          <p className="text-muted-foreground">
            {branch.address}
            {branch.city ? `, ${branch.city}` : ''}
            {branch.state ? `, ${branch.state}` : ''}
          </p>
        </div>
      </div>

      <ClientBranchWorkspace 
        branchId={branchId} 
        branch={{
          ...branch,
          cdCertificateExpiry: branch.cdCertificateExpiry?.toISOString() || null,
        }} 
      />
    </div>
  )
}
