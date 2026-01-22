import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all equipment for a branch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const expiringSoon = searchParams.get('expiringSoon') === 'true'

    // Build where clause
    const where: any = { branchId }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.equipmentType = type
    }
    
    // Filter for equipment expiring within 30 days
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expectedExpiry = {
        lte: thirtyDaysFromNow,
        gte: new Date()
      }
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        request: {
          select: { id: true, title: true, status: true }
        }
      },
      orderBy: [
        { expectedExpiry: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate status based on expiry date for each equipment
    const equipmentWithCalculatedStatus = equipment.map(eq => {
      let calculatedStatus = eq.status
      if (eq.expectedExpiry) {
        const now = new Date()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        
        if (eq.expectedExpiry < now) {
          calculatedStatus = 'EXPIRED'
        } else if (eq.expectedExpiry <= thirtyDaysFromNow) {
          calculatedStatus = 'EXPIRING_SOON'
        } else if (eq.inspectionResult === 'FAIL' || eq.inspectionResult === 'NEEDS_REPAIR') {
          calculatedStatus = 'NEEDS_ATTENTION'
        } else {
          calculatedStatus = 'ACTIVE'
        }
      }
      return { ...eq, calculatedStatus }
    })

    return NextResponse.json(equipmentWithCalculatedStatus)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}

// POST - Create new equipment for a branch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const body = await request.json()
    const {
      equipmentNumber,
      equipmentType,
      brand,
      model,
      serialNumber,
      location,
      dateAdded,
      expectedExpiry,
      notes,
      requestId,
      workOrderId,
    } = body

    if (!equipmentNumber || !equipmentType) {
      return NextResponse.json(
        { error: 'Equipment number and type are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        branchId,
        equipmentNumber,
        equipmentType,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        location: location || null,
        dateAdded: dateAdded ? new Date(dateAdded) : new Date(),
        expectedExpiry: expectedExpiry ? new Date(expectedExpiry) : null,
        notes: notes || null,
        requestId: requestId || null,
        workOrderId: workOrderId || null,
      }
    })

    return NextResponse.json(newEquipment, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    )
  }
}

// Helper function to verify branch access
async function verifyBranchAccess(branchId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            branches: { where: { id: branchId } }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        branches: { where: { id: branchId } }
      }
    })
    return (client?.branches.length || 0) > 0
  } else if (role === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: {
        branchAccess: { where: { branchId } }
      }
    })
    return (teamMember?.branchAccess.length || 0) > 0
  }
  return false
}
