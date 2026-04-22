import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = await params

    // Fetch work order with all related data
    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId },
      include: {
        checklist: {
          include: {
            branch: {
              include: {
                client: {
                  include: {
                    user: {
                      select: { name: true }
                    },
                    contractor: {
                      include: {
                        user: {
                          select: { name: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Verify access
    const hasAccess = await verifyWorkOrderAccess(workOrder, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch equipment linked to this work order or its request
    const equipment = await prisma.equipment.findMany({
      where: {
        OR: [
          { workOrderId: workOrder.id },
          { requestId: workOrder.linkedRequestId || '' }
        ]
      },
      orderBy: { equipmentNumber: 'asc' }
    })

    // Fetch assigned technician name
    let technicianName = null
    if (workOrder.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: workOrder.assignedTo },
        select: { name: true }
      })
      technicianName = assignedUser?.name || null
    }

    // Fetch who actually signed (if different from assigned)
    let technicianSignedByName = null
    if (workOrder.technicianSignedById) {
      const signedByUser = await prisma.user.findUnique({
        where: { id: workOrder.technicianSignedById },
        select: { name: true }
      })
      technicianSignedByName = signedByUser?.name || null
    }

    let supervisorSignedByName = null
    if (workOrder.supervisorSignedById) {
      const signedByUser = await prisma.user.findUnique({
        where: { id: workOrder.supervisorSignedById },
        select: { name: true }
      })
      supervisorSignedByName = signedByUser?.name || null
    }

    let clientSignedByName = null
    if (workOrder.clientSignedById) {
      const signedByUser = await prisma.user.findUnique({
        where: { id: workOrder.clientSignedById },
        select: { name: true }
      })
      clientSignedByName = signedByUser?.name || null
    }

    // Format response
    const printData = {
      id: workOrder.id,
      workOrderNumber: workOrder.workOrderNumber || 0,
      description: workOrder.description,
      notes: workOrder.notes,
      stage: workOrder.stage,
      workOrderType: workOrder.workOrderType || 'SERVICE',
      scheduledDate: workOrder.scheduledDate?.toISOString() || null,
      price: workOrder.price,
      recurringType: workOrder.recurringType,
      occurrenceIndex: workOrder.occurrenceIndex,
      clientName: workOrder.checklist.branch.client.companyName,
      branchName: workOrder.checklist.branch.name,
      branchAddress: workOrder.checklist.branch.address,
      branchPhone: workOrder.checklist.branch.phone,
      inspectionDate: workOrder.inspectionDate?.toISOString() || null,
      systemsChecked: workOrder.systemsChecked,
      findings: workOrder.findings,
      deficiencies: workOrder.deficiencies,
      recommendations: workOrder.recommendations,
      technicianName: technicianSignedByName || technicianName,
      technicianSignature: workOrder.technicianSignature,
      technicianSignedAt: workOrder.technicianSignedAt?.toISOString() || null,
      supervisorName: supervisorSignedByName || workOrder.checklist.branch.client.contractor.user.name,
      supervisorSignature: workOrder.supervisorSignature,
      supervisorSignedAt: workOrder.supervisorSignedAt?.toISOString() || null,
      clientSignedByName: clientSignedByName || workOrder.checklist.branch.client.user.name,
      clientSignature: workOrder.clientSignature,
      clientSignedAt: workOrder.clientSignedAt?.toISOString() || null,
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
    console.error('Error fetching work order print data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order data' },
      { status: 500 }
    )
  }
}

async function verifyWorkOrderAccess(
  workOrder: any,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'ADMIN') return true

  const contractorId = workOrder.checklist.branch.client.contractorId

  if (userRole === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      select: { id: true }
    })
    return contractor?.id === contractorId
  }

  if (userRole === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: { contractor: { select: { id: true } } }
    })
    return teamMember?.contractor.id === contractorId
  }

  if (userRole === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      select: { id: true }
    })
    return client?.id === workOrder.checklist.branch.clientId
  }

  return false
}
