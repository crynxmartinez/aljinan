import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a specific work order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = await params

    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId },
      include: {
        checklist: {
          include: {
            project: true
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: workOrder.id,
      checklistId: workOrder.checklistId,
      checklistTitle: workOrder.checklist.title,
      projectId: workOrder.checklist.projectId,
      projectTitle: workOrder.checklist.project?.title,
      description: workOrder.description,
      notes: workOrder.notes,
      stage: workOrder.stage,
      type: workOrder.type,
      scheduledDate: workOrder.scheduledDate,
      price: workOrder.price,
      isCompleted: workOrder.isCompleted,
      order: workOrder.order,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt
    })
  } catch (error) {
    console.error('Error fetching work order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    )
  }
}

// PATCH - Update a work order (add price, update stage, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, workOrderId } = await params
    const body = await request.json()
    const { description, notes, scheduledDate, price, stage, type } = body

    // Build update data
    const updateData: {
      description?: string
      notes?: string | null
      scheduledDate?: Date | null
      price?: number | null
      stage?: 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED'
      type?: 'SCHEDULED' | 'ADHOC'
      isCompleted?: boolean
    } = {}

    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null
    if (stage !== undefined) {
      updateData.stage = stage
      if (stage === 'COMPLETED') {
        updateData.isCompleted = true
      }
    }
    if (type !== undefined) updateData.type = type

    const workOrder = await prisma.checklistItem.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        checklist: true
      }
    })

    // Add activity for price update and recalculate project total
    if (price !== undefined) {
      // Recalculate project total from all work orders
      const allWorkOrders = await prisma.checklistItem.findMany({
        where: {
          checklist: {
            projectId: projectId
          }
        }
      })
      const newTotal = allWorkOrders.reduce((sum, wo) => sum + (wo.price ? Number(wo.price) : 0), 0)
      
      // Update project totalValue
      await prisma.project.update({
        where: { id: projectId },
        data: { totalValue: newTotal }
      })

      await prisma.activity.create({
        data: {
          projectId,
          type: 'UPDATED',
          content: `Price set for work order "${workOrder.description}": $${price}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })
    }

    // Add activity for stage update
    if (stage !== undefined) {
      await prisma.activity.create({
        data: {
          projectId,
          type: 'STATUS_CHANGE',
          content: `Work order "${workOrder.description}" moved to ${stage}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      // Create notification for client when work order is sent for review
      if (stage === 'FOR_REVIEW') {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            branch: {
              include: {
                client: {
                  include: { user: true }
                }
              }
            }
          }
        })

        if (project?.branch?.client?.user) {
          await prisma.notification.create({
            data: {
              userId: project.branch.client.user.id,
              type: 'WORK_ORDER_FOR_REVIEW',
              title: 'Work Order Ready for Review',
              message: `"${workOrder.description}" has been completed and is ready for your review`,
              link: `/portal/branches/${project.branchId}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })
        }
      }
    }

    return NextResponse.json({
      id: workOrder.id,
      checklistId: workOrder.checklistId,
      checklistTitle: workOrder.checklist.title,
      description: workOrder.description,
      notes: workOrder.notes,
      stage: workOrder.stage,
      type: workOrder.type,
      scheduledDate: workOrder.scheduledDate,
      price: workOrder.price,
      isCompleted: workOrder.isCompleted,
      order: workOrder.order,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt
    })
  } catch (error) {
    console.error('Error updating work order:', error)
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a work order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, workOrderId } = await params

    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    await prisma.checklistItem.delete({
      where: { id: workOrderId }
    })

    // Add activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'UPDATED',
        content: `Work order removed: ${workOrder.description}`,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting work order:', error)
    return NextResponse.json(
      { error: 'Failed to delete work order' },
      { status: 500 }
    )
  }
}
