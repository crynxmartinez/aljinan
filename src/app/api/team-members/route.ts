import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - List all team members for the contractor
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can view team members' }, { status: 403 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: {
        teamMembers: {
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
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(contractor?.teamMembers || [])
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// POST - Create a new team member
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create team members' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, teamRole, jobTitle, phone, branchIds } = body

    if (!name || !email || !teamRole) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    if (!['SUPERVISOR', 'TECHNICIAN'].includes(teamRole)) {
      return NextResponse.json(
        { error: 'Invalid team role. Must be SUPERVISOR or TECHNICIAN' },
        { status: 400 }
      )
    }

    if (!branchIds || branchIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one branch must be assigned' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Get contractor
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
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      )
    }

    // Verify all branch IDs belong to this contractor's clients
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

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user and team member in a transaction
    const teamMember = await prisma.teamMember.create({
      data: {
        teamRole,
        jobTitle,
        phone,
        contractor: {
          connect: { id: contractor.id }
        },
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: 'TEAM_MEMBER',
            status: 'ACTIVE',
          }
        },
        branchAccess: {
          create: branchIds.map((branchId: string) => ({
            branchId
          }))
        }
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

    return NextResponse.json({ 
      ...teamMember, 
      tempPassword // Include temp password in response for display
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
