import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        contractorId: contractor.id,
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Unarchive client and reactivate all branches
    await prisma.$transaction([
      // Set user status to ACTIVE
      prisma.user.update({
        where: { id: client.userId },
        data: { status: 'ACTIVE' }
      }),
      // Clear archivedAt timestamp
      prisma.client.update({
        where: { id: clientId },
        data: { archivedAt: null }
      }),
      // Reactivate all branches
      prisma.branch.updateMany({
        where: { clientId },
        data: { isActive: true }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unarchiving client:', error)
    return NextResponse.json(
      { error: 'Failed to unarchive client' },
      { status: 500 }
    )
  }
}
