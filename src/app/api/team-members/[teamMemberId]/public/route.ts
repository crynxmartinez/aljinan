import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get public technician details (for clients)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamMemberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { teamMemberId } = await params

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only clients can access this endpoint
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Only clients can view technician details' }, { status: 403 })
    }

    // Get the client
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        branches: {
          select: {
            id: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get the team member with branch access
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      select: {
        id: true,
        teamRole: true,
        jobTitle: true,
        phone: true,
        address: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        branchAccess: {
          select: {
            branchId: true
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Verify that this technician has access to at least one of the client's branches
    const clientBranchIds = client.branches.map(b => b.id)
    const technicianBranchIds = teamMember.branchAccess.map(ba => ba.branchId)
    const hasAccess = technicianBranchIds.some(branchId => clientBranchIds.includes(branchId))

    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have permission to view this technician' }, { status: 403 })
    }

    // Return only public-facing information
    return NextResponse.json({
      id: teamMember.id,
      name: teamMember.user.name,
      email: teamMember.user.email,
      phone: teamMember.phone,
      address: teamMember.address,
      jobTitle: teamMember.jobTitle,
      teamRole: teamMember.teamRole,
    })
  } catch (error) {
    console.error('Error fetching technician details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch technician details' },
      { status: 500 }
    )
  }
}
