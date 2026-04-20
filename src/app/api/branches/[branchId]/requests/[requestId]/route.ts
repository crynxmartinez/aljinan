import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single request
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

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const req = await prisma.request.findFirst({
      where: { id: requestId, branchId },
      include: {
        photos: true,
        project: { select: { id: true, title: true, status: true } }
      }
    })

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(req)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// PATCH - Update a request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params
    const body = await request.json()
    const {
      title,
      description,
      priority,
      status,
      assignedTo,
      dueDate,
      // New quote fields (contractor sets these)
      quotedPrice,
      quotedDate,
      quotationUrl,
      quotationFileName,
      // Action fields
      action, // 'quote', 'accept', 'reject'
      rejectionNote,
      clientSignature, // Client signature when accepting quote
    } = body

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current request to check status change
    const currentRequest = await prisma.request.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    // Handle specific actions
    let workOrderCreated = false
    let workOrderId: string | null = null

    // ACTION: Contractor sends quote
    if (action === 'quote') {
      if (session.user.role !== 'CONTRACTOR') {
        return NextResponse.json({ error: 'Only contractors can quote' }, { status: 403 })
      }
      if (!quotedPrice || !quotedDate) {
        return NextResponse.json({ error: 'Price and date are required for quote' }, { status: 400 })
      }
      updateData.status = 'QUOTED'
      updateData.quotedPrice = quotedPrice
      updateData.quotedDate = new Date(quotedDate)
      updateData.quotedById = session.user.id
      updateData.quotedAt = new Date()
      if (quotationUrl !== undefined) updateData.quotationUrl = quotationUrl || null
      if (quotationFileName !== undefined) updateData.quotationFileName = quotationFileName || null
    }
    // ACTION: Client starts work immediately (without quotation)
    else if (action === 'start_immediately') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can start work immediately' }, { status: 403 })
      }
      if (currentRequest.status !== 'REQUESTED') {
        return NextResponse.json({ error: 'Can only start immediately from requested status' }, { status: 400 })
      }
      if (!quotedDate) {
        return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 })
      }

      updateData.status = 'SCHEDULED'
      updateData.quotedDate = new Date(quotedDate) // Store scheduled date
      updateData.quotedPrice = null // No price yet - contractor will add later
      updateData.acceptedAt = new Date()
      updateData.acceptedById = session.user.id

      // Determine projectId for the work order
      // If request has no projectId (adhoc), link to active project
      let targetProjectId = currentRequest.projectId
      if (!targetProjectId) {
        const activeProject = await prisma.project.findFirst({
          where: {
            branchId,
            status: 'ACTIVE'
          },
          select: { id: true }
        })
        targetProjectId = activeProject?.id || null
      }

      // Create work order (ChecklistItem) from request
      // First, find or create a checklist for this branch
      let checklist = await prisma.checklist.findFirst({
        where: {
          branchId,
          projectId: targetProjectId,
          status: 'IN_PROGRESS'
        }
      })

      if (!checklist) {
        checklist = await prisma.checklist.create({
          data: {
            branchId,
            projectId: targetProjectId,
            title: 'Service Requests',
            description: 'Work orders from client requests',
            status: 'IN_PROGRESS',
            createdById: session.user.id,
          }
        })
      }

      // Get contractor for WO number generation
      const branchData = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { client: { select: { contractorId: true } } }
      })

      // Determine number of work orders to create based on recurring type
      const recurringType = currentRequest.recurringType || 'ONCE'
      let occurrenceCount = 1
      if (recurringType === 'MONTHLY') occurrenceCount = 12
      else if (recurringType === 'QUARTERLY') occurrenceCount = 4

      const startDate = new Date(quotedDate)
      const createdWorkOrders: string[] = []

      // Atomically increment the contractor's WO counter for all occurrences
      let startingWoNumber = 1
      if (branchData) {
        const contractor = await prisma.contractor.update({
          where: { id: branchData.client.contractorId },
          data: { nextWorkOrderNumber: { increment: occurrenceCount } },
          select: { nextWorkOrderNumber: true }
        })
        startingWoNumber = contractor.nextWorkOrderNumber - occurrenceCount
      }

      // Create work orders for each occurrence
      for (let i = 0; i < occurrenceCount; i++) {
        // Calculate scheduled date for this occurrence
        const scheduledDate = new Date(startDate)
        if (recurringType === 'MONTHLY') {
          scheduledDate.setMonth(scheduledDate.getMonth() + i)
        } else if (recurringType === 'QUARTERLY') {
          scheduledDate.setMonth(scheduledDate.getMonth() + (i * 3))
        }

        const workOrder = await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            description: recurringType !== 'ONCE'
              ? `${currentRequest.title} (${i + 1}/${occurrenceCount})`
              : currentRequest.title,
            notes: currentRequest.description,
            stage: 'SCHEDULED',
            type: 'ADHOC',
            workOrderType: currentRequest.workOrderType,
            recurringType: recurringType,
            occurrenceIndex: i + 1,
            workOrderNumber: startingWoNumber + i,
            scheduledDate: scheduledDate,
            price: null, // Price will be added by contractor later
            linkedRequestId: requestId,
            assignedTo: currentRequest.assignedTo || null,
          }
        })
        createdWorkOrders.push(workOrder.id)
      }

      workOrderCreated = true
      workOrderId = createdWorkOrders[0] // First work order ID
      updateData.workOrderId = createdWorkOrders[0]
    }
    // ACTION: Client accepts quote
    else if (action === 'accept') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can accept quotes' }, { status: 403 })
      }
      if (currentRequest.status !== 'QUOTED') {
        return NextResponse.json({ error: 'Can only accept quoted requests' }, { status: 400 })
      }
      updateData.status = 'SCHEDULED'
      updateData.acceptedAt = new Date()
      updateData.acceptedById = session.user.id

      // Create work order (ChecklistItem) from accepted request
      // First, find or create a checklist for this branch
      let checklist = await prisma.checklist.findFirst({
        where: {
          branchId,
          projectId: currentRequest.projectId,
          status: 'IN_PROGRESS'
        }
      })

      if (!checklist) {
        checklist = await prisma.checklist.create({
          data: {
            branchId,
            projectId: currentRequest.projectId,
            title: 'Service Requests',
            description: 'Work orders from client requests',
            status: 'IN_PROGRESS',
            createdById: session.user.id,
          }
        })
      }

      // Get contractor for WO number generation
      const branchData = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { client: { select: { contractorId: true } } }
      })

      // Determine number of work orders to create based on recurring type
      const recurringType = currentRequest.recurringType || 'ONCE'
      let occurrenceCount = 1
      if (recurringType === 'MONTHLY') occurrenceCount = 12
      else if (recurringType === 'QUARTERLY') occurrenceCount = 4

      const startDate = currentRequest.quotedDate ? new Date(currentRequest.quotedDate) : new Date()
      const createdWorkOrders: string[] = []

      // Atomically increment the contractor's WO counter for all occurrences
      let startingWoNumber = 1
      if (branchData) {
        const contractor = await prisma.contractor.update({
          where: { id: branchData.client.contractorId },
          data: { nextWorkOrderNumber: { increment: occurrenceCount } },
          select: { nextWorkOrderNumber: true }
        })
        startingWoNumber = contractor.nextWorkOrderNumber - occurrenceCount
      }

      // Create work orders for each occurrence
      for (let i = 0; i < occurrenceCount; i++) {
        // Calculate scheduled date for this occurrence
        const scheduledDate = new Date(startDate)
        if (recurringType === 'MONTHLY') {
          scheduledDate.setMonth(scheduledDate.getMonth() + i)
        } else if (recurringType === 'QUARTERLY') {
          scheduledDate.setMonth(scheduledDate.getMonth() + (i * 3))
        }

        const workOrder = await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            description: recurringType !== 'ONCE'
              ? `${currentRequest.title} (${i + 1}/${occurrenceCount})`
              : currentRequest.title,
            notes: currentRequest.description,
            stage: 'SCHEDULED',
            type: 'ADHOC',
            workOrderType: currentRequest.workOrderType,
            recurringType: recurringType,
            occurrenceIndex: i + 1,
            workOrderNumber: startingWoNumber + i,
            scheduledDate: scheduledDate,
            price: currentRequest.quotedPrice,
            linkedRequestId: requestId,
            assignedTo: currentRequest.assignedTo || null,
            // Save client signature from quote acceptance
            clientSignature: clientSignature || null,
            clientSignedAt: clientSignature ? new Date() : null,
            clientSignedById: clientSignature ? session.user.id : null,
          }
        })
        createdWorkOrders.push(workOrder.id)
      }

      workOrderCreated = true
      workOrderId = createdWorkOrders[0] // First work order ID
      updateData.workOrderId = createdWorkOrders[0]
    }
    // ACTION: Client rejects quote
    else if (action === 'reject') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can reject quotes' }, { status: 403 })
      }
      if (currentRequest.status !== 'QUOTED') {
        return NextResponse.json({ error: 'Can only reject quoted requests' }, { status: 400 })
      }
      updateData.status = 'REJECTED'
      updateData.rejectedAt = new Date()
      updateData.rejectedById = session.user.id
      updateData.rejectionNote = rejectionNote || null
    }
    // Regular status update
    else if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        photos: true
      }
    })

    return NextResponse.json({
      ...updatedRequest,
      workOrderCreated,
      workOrderId,
      debug: {
        checklistId: action === 'start_immediately' || action === 'accept' ? checklist?.id : null,
        checklistProjectId: action === 'start_immediately' || action === 'accept' ? checklist?.projectId : null,
        targetProjectId: action === 'start_immediately' ? targetProjectId : null
      }
    })
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a request (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can delete requests
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete requests' }, { status: 403 })
    }

    const { branchId, requestId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.request.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
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
            branches: {
              where: { id: branchId }
            }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        branches: {
          where: { id: branchId }
        }
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
