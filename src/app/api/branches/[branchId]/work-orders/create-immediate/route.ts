import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create immediate work orders' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()

    const {
      title,
      description,
      workOrderType,
      recurringType,
      price,
      scheduledDate,
      assignedTo,
      notes,
      occurrences, // For recurring: [{ order, visitDate, price }]
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!workOrderType) {
      return NextResponse.json({ error: 'Work order type is required' }, { status: 400 })
    }

    // Verify branch access
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        client: {
          select: {
            id: true,
            contractorId: true,
            userId: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Find or create adhoc checklist (no contract)
    let checklist = await prisma.checklist.findFirst({
      where: {
        branchId,
        contractId: null,
        status: 'IN_PROGRESS'
      }
    })

    if (!checklist) {
      checklist = await prisma.checklist.create({
        data: {
          branchId,
          contractId: null,
          title: 'Adhoc Work Orders',
          description: 'Work orders created directly by contractor',
          status: 'IN_PROGRESS',
          createdById: session.user.id,
        }
      })
    }

    // Get contractor for work order number
    const contractor = await prisma.contractor.findUnique({
      where: { id: branch.client.contractorId }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const createdWorkOrders = []

    // Handle recurring vs one-time
    if (recurringType && recurringType !== 'ONCE' && occurrences && occurrences.length > 0) {
      // Recurring: Create multiple work orders
      for (const occurrence of occurrences) {
        const woNumber = await prisma.contractor.update({
          where: { id: contractor.id },
          data: { nextWorkOrderNumber: { increment: 1 } },
          select: { nextWorkOrderNumber: true }
        })

        const workOrder = await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            description: title,
            notes: description || notes || null,
            stage: 'IN_PROGRESS',
            type: 'ADHOC',
            workOrderType: workOrderType,
            recurringType: recurringType,
            occurrenceIndex: occurrence.order,
            workOrderNumber: woNumber.nextWorkOrderNumber - 1,
            scheduledDate: occurrence.visitDate ? new Date(occurrence.visitDate) : new Date(),
            price: occurrence.price ? parseFloat(occurrence.price) : null,
            assignedTo: assignedTo && assignedTo !== 'unassigned' ? assignedTo : null,
          }
        })

        createdWorkOrders.push(workOrder)
      }
    } else {
      // One-time: Create single work order
      const woNumber = await prisma.contractor.update({
        where: { id: contractor.id },
        data: { nextWorkOrderNumber: { increment: 1 } },
        select: { nextWorkOrderNumber: true }
      })

      const workOrder = await prisma.checklistItem.create({
        data: {
          checklistId: checklist.id,
          description: title,
          notes: description || notes || null,
          stage: 'IN_PROGRESS',
          type: 'ADHOC',
          workOrderType: workOrderType,
          recurringType: 'ONCE',
          occurrenceIndex: 1,
          workOrderNumber: woNumber.nextWorkOrderNumber - 1,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
          price: price ? parseFloat(price) : null,
          assignedTo: assignedTo && assignedTo !== 'unassigned' ? assignedTo : null,
        }
      })

      createdWorkOrders.push(workOrder)
    }

    // Create notification for client
    if (branch.client.userId) {
      const workOrderCount = createdWorkOrders.length
      const notificationMessage = workOrderCount > 1
        ? `${workOrderCount} work orders have been started: "${title}"`
        : `Work order started: "${title}"`

      await prisma.notification.create({
        data: {
          userId: branch.client.userId,
          type: 'WORK_ORDER_STARTED',
          title: '🔧 Work Order Started',
          message: notificationMessage,
          link: `/portal/branches/${branchId}?tab=work-orders`,
          isRead: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      workOrders: createdWorkOrders.map(wo => ({
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        description: wo.description,
        stage: wo.stage,
      })),
      count: createdWorkOrders.length,
      message: `${createdWorkOrders.length} work order(s) created and started`
    })
  } catch (error: any) {
    console.error('Error creating immediate work order:', error)
    return NextResponse.json({
      error: 'Failed to create work order',
      details: error.message
    }, { status: 500 })
  }
}
