import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get a single team member
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

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can view team members' }, { status: 403 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        contractorId: contractor.id
      },
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
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

// PATCH - Update a team member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamMemberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { teamMemberId } = await params

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can update team members' }, { status: 403 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: {
        clients: {
          include: {
            branches: true
          }
        }
      }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    // Verify team member belongs to this contractor
    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        contractorId: contractor.id
      }
    })

    if (!existingTeamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, teamRole, jobTitle, phone, branchIds } = body

    // Validate teamRole if provided
    if (teamRole && !['SUPERVISOR', 'TECHNICIAN'].includes(teamRole)) {
      return NextResponse.json(
        { error: 'Invalid team role. Must be SUPERVISOR or TECHNICIAN' },
        { status: 400 }
      )
    }

    // Validate branchIds if provided
    if (branchIds !== undefined) {
      if (!Array.isArray(branchIds) || branchIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one branch must be assigned' },
          { status: 400 }
        )
      }

      const validBranchIds = contractor.clients.flatMap(client => 
        client.branches.map(branch => branch.id)
      )
      
      const invalidBranches = branchIds.filter((id: string) => !validBranchIds.includes(id))
      if (invalidBranches.length > 0) {
        return NextResponse.json(
          { error: 'One or more branch IDs are invalid' },
          { status: 400 }
        )
      }
    }

    // Update in transaction
    const updatedTeamMember = await prisma.$transaction(async (tx) => {
      // Update user name if provided
      if (name) {
        await tx.user.update({
          where: { id: existingTeamMember.userId },
          data: { name }
        })
      }

      // Update team member fields
      const updateData: Record<string, unknown> = {}
      if (teamRole) updateData.teamRole = teamRole
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle
      if (phone !== undefined) updateData.phone = phone

      if (Object.keys(updateData).length > 0) {
        await tx.teamMember.update({
          where: { id: teamMemberId },
          data: updateData
        })
      }

      // Update branch access if provided
      if (branchIds !== undefined) {
        // Delete existing branch access
        await tx.teamMemberBranch.deleteMany({
          where: { teamMemberId }
        })

        // Create new branch access
        await tx.teamMemberBranch.createMany({
          data: branchIds.map((branchId: string) => ({
            teamMemberId,
            branchId
          }))
        })
      }

      // Return updated team member
      return tx.teamMember.findUnique({
        where: { id: teamMemberId },
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
        }
      })
    })

    return NextResponse.json(updatedTeamMember)
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamMemberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { teamMemberId } = await params

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete team members' }, { status: 403 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    // Verify team member belongs to this contractor
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        contractorId: contractor.id
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Delete user (cascade will delete team member and branch access)
    await prisma.user.delete({
      where: { id: teamMember.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
