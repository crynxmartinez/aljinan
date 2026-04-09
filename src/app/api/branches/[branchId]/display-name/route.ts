import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
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

    // Verify branch belongs to contractor's client
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        client: {
          contractorId,
        },
      },
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found or access denied' },
        { status: 404 }
      )
    }

    // Update display name
    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: {
        displayName: displayName?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        displayName: true,
      },
    })

    return NextResponse.json({
      success: true,
      branch: updatedBranch,
    })
  } catch (error) {
    console.error('Error updating branch display name:', error)
    return NextResponse.json(
      { error: 'Failed to update display name' },
      { status: 500 }
    )
  }
}
