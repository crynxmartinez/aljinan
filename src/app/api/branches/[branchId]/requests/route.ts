import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all requests for a branch
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

    const requests = await prisma.request.findMany({
      where: { branchId },
      include: {
        project: { select: { id: true, title: true, status: true } },
        photos: true,
        equipment: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST - Create a new request
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
      title, 
      description, 
      priority, 
      dueDate,
      workOrderType,
      recurringType,
      needsCertificate,
      preferredDate,
      preferredTimeSlot,
      photoUrls, // Array of photo URLs already uploaded
      // Contractor-created request fields (already quoted)
      quotedPrice,
      quotedDate,
      status, // Can be 'QUOTED' for contractor-created requests
      // Equipment for sticker inspections
      equipment,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Determine if this is a contractor-created request (already quoted)
    const isContractorCreated = session.user.role === 'CONTRACTOR' && status === 'QUOTED' && quotedPrice && quotedDate

    // Create request with photos and equipment
    const newRequest = await prisma.request.create({
      data: {
        branchId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: isContractorCreated ? 'QUOTED' : 'REQUESTED',
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
        dueDate: dueDate ? new Date(dueDate) : null,
        workOrderType: workOrderType || null,
        recurringType: recurringType || 'ONCE',
        needsCertificate: needsCertificate || false,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTimeSlot: preferredTimeSlot || null,
        // Contractor quote fields (for contractor-created requests)
        quotedPrice: isContractorCreated ? quotedPrice : null,
        quotedDate: isContractorCreated ? new Date(quotedDate) : null,
        quotedById: isContractorCreated ? session.user.id : null,
        quotedAt: isContractorCreated ? new Date() : null,
        photos: photoUrls && photoUrls.length > 0 ? {
          create: photoUrls.map((url: string) => ({ url }))
        } : undefined,
        // Equipment for sticker inspections - linked to branch for permanent records
        equipment: equipment && equipment.length > 0 ? {
          create: equipment.map((eq: { equipmentNumber: string; equipmentType: string; location?: string; dateAdded?: string; expectedExpiry?: string; notes?: string; brand?: string; model?: string; serialNumber?: string }) => ({
            branchId: branchId, // Link to branch for permanent equipment records
            equipmentNumber: eq.equipmentNumber,
            equipmentType: eq.equipmentType as 'FIRE_EXTINGUISHER' | 'FIRE_ALARM_PANEL' | 'SPRINKLER_SYSTEM' | 'EMERGENCY_LIGHTING' | 'EXIT_SIGN' | 'FIRE_DOOR' | 'SMOKE_DETECTOR' | 'HEAT_DETECTOR' | 'GAS_DETECTOR' | 'KITCHEN_HOOD_SUPPRESSION' | 'FIRE_PUMP' | 'FIRE_HOSE_REEL' | 'OTHER',
            brand: eq.brand || null,
            model: eq.model || null,
            serialNumber: eq.serialNumber || null,
            location: eq.location || null,
            dateAdded: eq.dateAdded ? new Date(eq.dateAdded) : new Date(),
            expectedExpiry: eq.expectedExpiry ? new Date(eq.expectedExpiry) : null,
            notes: eq.notes || null,
          }))
        } : undefined
      },
      include: {
        photos: true,
        equipment: true
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
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
