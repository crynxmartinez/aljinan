import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params

    // Fetch request with all related data
    const serviceRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        branch: {
          include: {
            client: {
              select: {
                companyName: true,
              }
            }
          }
        }
      }
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (serviceRequest.branchId !== branchId) {
      return NextResponse.json({ error: 'Request does not belong to this branch' }, { status: 400 })
    }

    // Verify access
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch equipment linked to this request
    const equipment = await prisma.equipment.findMany({
      where: { requestId: serviceRequest.id },
      orderBy: { equipmentNumber: 'asc' }
    })

    // Format response
    const printData = {
      id: serviceRequest.id,
      requestNumber: serviceRequest.requestNumber,
      title: serviceRequest.title,
      description: serviceRequest.description,
      priority: serviceRequest.priority,
      status: serviceRequest.status,
      workOrderType: serviceRequest.workOrderType,
      recurringType: serviceRequest.recurringType,
      needsCertificate: serviceRequest.needsCertificate,
      preferredDate: serviceRequest.preferredDate?.toISOString() || null,
      preferredTimeSlot: serviceRequest.preferredTimeSlot,
      quotedPrice: serviceRequest.quotedPrice,
      quotedDate: serviceRequest.quotedDate?.toISOString() || null,
      quotedAt: serviceRequest.quotedAt?.toISOString() || null,
      clientName: serviceRequest.branch.client.companyName,
      branchName: serviceRequest.branch.name,
      branchAddress: serviceRequest.branch.address,
      branchPhone: serviceRequest.branch.phone,
      createdAt: serviceRequest.createdAt.toISOString(),
      equipment: equipment.map(eq => ({
        id: eq.id,
        equipmentNumber: eq.equipmentNumber,
        equipmentType: eq.equipmentType,
        location: eq.location,
        expectedExpiry: eq.expectedExpiry?.toISOString() || null,
      }))
    }

    return NextResponse.json(printData)
  } catch (error) {
    console.error('Error fetching request print data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request data' },
      { status: 500 }
    )
  }
}

async function verifyBranchAccess(
  branchId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'ADMIN') return true

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      client: {
        select: {
          userId: true,
          contractorId: true,
        }
      }
    }
  })

  if (!branch) return false

  if (userRole === 'CLIENT') {
    return branch.client.userId === userId
  }

  if (userRole === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      select: { id: true }
    })
    return contractor?.id === branch.client.contractorId
  }

  if (userRole === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      select: { 
        id: true,
        contractorId: true
      }
    })
    
    if (!teamMember) return false
    
    // Check if contractor owns this client
    return teamMember.contractorId === branch.client.contractorId
  }

  return false
}
