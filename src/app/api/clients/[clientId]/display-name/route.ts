import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const { displayName } = await request.json()

    // Validate displayName (allow null to clear, or string up to 100 chars)
    if (displayName !== null && displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return NextResponse.json(
          { error: 'Display name must be a string' },
          { status: 400 }
        )
      }
      if (displayName.length > 100) {
        return NextResponse.json(
          { error: 'Display name must be 100 characters or less' },
          { status: 400 }
        )
      }
    }

    // Get contractor ID from session
    let contractorId: string | undefined
    if (session.user.role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      contractorId = contractor?.id
    } else if (session.user.role === 'TEAM_MEMBER') {
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId: session.user.id },
        include: { contractor: { select: { id: true } } },
      })
      contractorId = teamMember?.contractor.id
    }

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    // Verify client belongs to contractor
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        contractorId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Update display name
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        displayName: displayName?.trim() || null,
      },
      select: {
        id: true,
        companyName: true,
        displayName: true,
      },
    })

    return NextResponse.json({
      success: true,
      client: updatedClient,
    })
  } catch (error) {
    console.error('Error updating client display name:', error)
    return NextResponse.json(
      { error: 'Failed to update display name' },
      { status: 500 }
    )
  }
}
