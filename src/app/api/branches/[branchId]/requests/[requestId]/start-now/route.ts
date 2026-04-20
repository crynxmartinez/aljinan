import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get the request
    const currentRequest = await prisma.request.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Find the active project
    const activeProject = await prisma.project.findFirst({
      where: {
        branchId,
        status: 'ACTIVE'
      }
    })

    if (!activeProject) {
      return NextResponse.json({ error: 'No active project found' }, { status: 400 })
    }

    // Find or create checklist for the active project
    let checklist = await prisma.checklist.findFirst({
      where: {
        branchId,
        projectId: activeProject.id,
        status: 'IN_PROGRESS'
      }
    })

    if (!checklist) {
      checklist = await prisma.checklist.create({
        data: {
          branchId,
          projectId: activeProject.id,
          title: `${activeProject.title} - Work Orders`,
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

    return NextResponse.json({
      success: true,
      workOrderId: workOrder.id,
      checklistId: checklist.id,
      projectId: activeProject.id,
      stage: 'IN_PROGRESS',
      message: 'Work order created and moved to IN PROGRESS'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to create work order',
      details: error.message
    }, { status: 500 })
  }
}
