import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch expiring equipment across all branches for contractor
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get branches the user has access to
    let branchIds: string[] = []

    if (session.user.role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id },
        include: {
          clients: {
            include: {
              branches: {
                where: { isActive: true },
                select: { id: true, name: true, client: { select: { companyName: true } } }
              }
            }
          }
        }
      })

      if (contractor) {
        branchIds = contractor.clients.flatMap(client => 
          client.branches.map(branch => branch.id)
        )
      }
    } else if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        include: {
          branches: {
            where: { isActive: true },
            select: { id: true, name: true }
          }
        }
      })

      if (client) {
        branchIds = client.branches.map(branch => branch.id)
      }
    } else if (session.user.role === 'TEAM_MEMBER') {
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId: session.user.id },
        include: {
          branchAccess: {
            include: {
              branch: {
                select: { id: true, name: true, client: { select: { companyName: true } } }
              }
            }
          }
        }
      })

      if (teamMember) {
        branchIds = teamMember.branchAccess.map(access => access.branch.id)
      }
    }

    if (branchIds.length === 0) {
      return NextResponse.json([])
    }

    // Calculate date thresholds
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Fetch equipment that is expired or expiring soon
    const equipment = await prisma.equipment.findMany({
      where: {
        branchId: { in: branchIds },
        OR: [
          // Expired
          {
            expectedExpiry: { lt: now }
          },
          // Expiring within 30 days
          {
            expectedExpiry: {
              gte: now,
              lte: thirtyDaysFromNow
            }
          }
        ]
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { expectedExpiry: 'asc' }
    })

    // Transform and calculate status
    const transformedEquipment = equipment.map(eq => {
      let calculatedStatus = 'ACTIVE'
      if (eq.expectedExpiry) {
        if (eq.expectedExpiry < now) {
          calculatedStatus = 'EXPIRED'
        } else if (eq.expectedExpiry <= thirtyDaysFromNow) {
          calculatedStatus = 'EXPIRING_SOON'
        }
      }

      return {
        id: eq.id,
        equipmentNumber: eq.equipmentNumber,
        equipmentType: eq.equipmentType,
        location: eq.location,
        expectedExpiry: eq.expectedExpiry?.toISOString() || null,
        status: eq.status,
        calculatedStatus,
        branchId: eq.branchId,
        branchName: eq.branch.name,
        clientName: eq.branch.client.companyName,
      }
    })

    return NextResponse.json(transformedEquipment)
  } catch (error) {
    console.error('Error fetching expiring equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expiring equipment' },
      { status: 500 }
    )
  }
}
