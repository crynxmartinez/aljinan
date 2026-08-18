import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params

    // Mirrors the 'start_immediately' action on the request route: this is a client
    // choosing to begin work without waiting for a quotation.
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can start work immediately' },
        { status: 403 }
      )
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Scope the lookup to the branch: a request id alone must not be enough to reach it.
    const currentRequest = await prisma.request.findFirst({
      where: { id: requestId, branchId }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Without this, a completed request can be restarted and re-numbered repeatedly.
    if (currentRequest.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Can only start immediately from requested status' },
        { status: 400 }
      )
    }

    // Find or create adhoc checklist (no contract)
    let checklist = await prisma.checklist.findFirst({
      where: {
        branchId,
        contractId: null, // Adhoc checklist has no contract
        status: 'IN_PROGRESS'
      }
    })

    if (!checklist) {
      checklist = await prisma.checklist.create({
        data: {
          branchId,
          contractId: null, // Adhoc - no contract
          title: 'Adhoc Work Orders',
          description: 'Work orders from client requests',
          status: 'IN_PROGRESS',
          createdById: session.user.id,
        }
      })
    }

    // Get contractor for WO number
    const branchData = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { client: { select: { contractorId: true } } }
    })

    let workOrderNumber = 1
    if (branchData) {
      const contractor = await prisma.contractor.update({
        where: { id: branchData.client.contractorId },
        data: { nextWorkOrderNumber: { increment: 1 } },
        select: { nextWorkOrderNumber: true }
      })
      workOrderNumber = contractor.nextWorkOrderNumber - 1
    }

    // Create the work order with IN_PROGRESS stage
    const workOrder = await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        description: currentRequest.title,
        notes: currentRequest.description,
        stage: 'IN_PROGRESS',
        type: 'ADHOC',
        workOrderType: currentRequest.workOrderType,
        recurringType: 'ONCE',
        occurrenceIndex: 1,
        workOrderNumber: workOrderNumber,
        scheduledDate: new Date(), // Today
        price: null,
        linkedRequestId: requestId,
        assignedTo: currentRequest.assignedTo || null,
      }
    })

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'SCHEDULED',
        quotedDate: new Date(),
        acceptedAt: new Date(),
        acceptedById: session.user.id,
        workOrderId: workOrder.id
      }
    })

    // Create notification for contractor
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        client: {
          select: {
            contractorId: true,
            contractor: { select: { userId: true } },
          },
        },
      },
    })

    if (branch?.client?.contractor?.userId) {
      await prisma.notification.create({
        data: {
          userId: branch.client.contractor.userId,
          type: 'WORK_ORDER_STARTED',
          title: '🚨 Work Started Immediately',
          message: `Client started work immediately: "${currentRequest.title}" - Now in IN PROGRESS`,
          link: `/dashboard/clients/${branch.clientId}/branches/${branchId}`,
          isRead: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      workOrderId: workOrder.id,
      checklistId: checklist.id,
      stage: 'IN_PROGRESS',
      message: 'Work order created and moved to IN PROGRESS'
    })
  } catch (error) {
    console.error('Error creating work order from request:', error)
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
  }
}
