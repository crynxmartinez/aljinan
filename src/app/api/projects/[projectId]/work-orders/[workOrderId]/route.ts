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
          content: `Price set for work order "${workOrder.description}": SAR ${price}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
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
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
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

      // Auto-generate certificate when work order is completed
      if (stage === 'COMPLETED') {
        // Get the linked request to check if certificate is needed
        const fullWorkOrder = await prisma.checklistItem.findUnique({
          where: { id: workOrderId },
          include: {
            checklist: {
              include: {
                project: true
              }
            }
          }
        })

        // Check if there's a linked request with needsCertificate flag
        let needsCertificate = false
        if (fullWorkOrder?.linkedRequestId) {
          const linkedRequest = await prisma.request.findUnique({
            where: { id: fullWorkOrder.linkedRequestId }
          })
          needsCertificate = linkedRequest?.needsCertificate || false
        }

        // Also check work order type - inspections and maintenance typically need certificates
        const workOrderType = fullWorkOrder?.workOrderType
        if (workOrderType === 'INSPECTION' || workOrderType === 'MAINTENANCE') {
          needsCertificate = true
        }

        if (needsCertificate && fullWorkOrder?.checklist?.project?.branchId) {
          // Check if certificate already exists for this work order
          const existingCert = await prisma.certificate.findFirst({
            where: { workOrderId: workOrderId }
          })

          if (!existingCert) {
            // Determine certificate type based on work order type
            let certType: 'PREVENTIVE_MAINTENANCE' | 'COMPLETION' | 'COMPLIANCE' | 'INSPECTION' | 'CIVIL_DEFENSE' = 'COMPLETION'
            if (workOrderType === 'INSPECTION') certType = 'INSPECTION'
            else if (workOrderType === 'MAINTENANCE') certType = 'PREVENTIVE_MAINTENANCE'
            else certType = 'COMPLETION'

            // Calculate expiry date based on recurring type
            let expiryDate: Date | null = null
            const recurringType = fullWorkOrder.recurringType
            if (recurringType === 'MONTHLY') {
              expiryDate = new Date()
              expiryDate.setMonth(expiryDate.getMonth() + 1)
            } else if (recurringType === 'QUARTERLY') {
              expiryDate = new Date()
              expiryDate.setMonth(expiryDate.getMonth() + 3)
            } else {
              // Default 1 year expiry for one-time work
              expiryDate = new Date()
              expiryDate.setFullYear(expiryDate.getFullYear() + 1)
            }

            // Create the certificate
            await prisma.certificate.create({
              data: {
                branchId: fullWorkOrder.checklist.project.branchId,
                projectId: fullWorkOrder.checklist.projectId,
                workOrderId: workOrderId,
                type: certType,
                title: `${certType.charAt(0) + certType.slice(1).toLowerCase()} Certificate - ${fullWorkOrder.description}`,
                description: fullWorkOrder.findings || fullWorkOrder.recommendations || `Certificate for completed ${workOrderType?.toLowerCase() || 'work'}: ${fullWorkOrder.description}`,
                fileUrl: '', // Will be generated/uploaded later
                issueDate: new Date(),
                expiryDate: expiryDate,
                issuedBy: session.user.name || 'System',
                issuedById: session.user.id,
              }
            })

            // Create activity for certificate generation
            await prisma.activity.create({
              data: {
                projectId,
                type: 'UPDATED',
                content: `Certificate auto-generated for work order "${fullWorkOrder.description}"`,
                createdById: session.user.id,
                createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
              }
            })
          }
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
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
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
