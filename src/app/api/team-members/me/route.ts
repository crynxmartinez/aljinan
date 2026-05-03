import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update own profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only team members can update their profile
    if (session.user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Only team members can update their profile' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, address, jobTitle } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Get team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId: session.user.id }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Update user and team member in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update user name and email
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name,
          email,
        }
      })

      // Update team member details
      const updatedTeamMember = await tx.teamMember.update({
        where: { id: teamMember.id },
        data: {
          phone: phone || null,
          address: address || null,
          jobTitle: jobTitle || null,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      })

      return updatedTeamMember
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating team member profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
