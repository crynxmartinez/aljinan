import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateProjectCache, invalidateBranchCache } from '@/lib/cache'
import { canEditWorkOrder, canDeleteWorkOrder, permissionDeniedError } from '@/lib/permissions'
import { sanitizePlainText } from '@/lib/sanitize'
import { validatePrice } from '@/lib/validation'
import { logResourceUpdated, logWorkOrderArchive, logPermissionDenied } from '@/lib/audit-log'

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

    // Check permissions
    const hasPermission = await canEditWorkOrder(session.user.id, session.user.role as any, workOrderId)
    if (!hasPermission) {
      await logPermissionDenied(session.user.id, session.user.role as any, 'edit work order', 'work_order', workOrderId)
      const error = permissionDeniedError('edit this work order')
      return NextResponse.json({ error: error.error }, { status: error.status })
    }

    // Build update data
    const updateData: {
      description?: string
      notes?: string | null
      scheduledDate?: Date | null
      price?: number | null
      stage?: 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED' | 'ARCHIVED'
      type?: 'SCHEDULED' | 'ADHOC'
      isCompleted?: boolean
      completedAt?: Date | null
      deletedAt?: Date | null
      deletedBy?: string | null
      deletedReason?: string | null
    } = {}

    if (description !== undefined) updateData.description = sanitizePlainText(description)
    if (notes !== undefined) updateData.notes = notes ? sanitizePlainText(notes) : null
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    if (price !== undefined) {
      const priceNum = price ? parseFloat(price) : null
      if (priceNum !== null) {
        const priceValidation = validatePrice(priceNum)
        if (!priceValidation.valid) {
          return NextResponse.json({ error: priceValidation.error }, { status: 400 })
        }
      }
      updateData.price = priceNum
    }
    // Get current work order to track previous stage
    const currentWorkOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId },
      select: { stage: true }
    })
    const previousStage = currentWorkOrder?.stage

    if (stage !== undefined) {
      updateData.stage = stage
      if (stage === 'COMPLETED') {
        updateData.isCompleted = true
        updateData.completedAt = new Date() // Track when completed for auto-archive
      }
      if (stage === 'ARCHIVED') {
        updateData.deletedAt = new Date()
        updateData.deletedBy = session.user.id
        updateData.deletedReason = 'MANUAL' // Manual archive by contractor
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

      // Get project with client and contractor info for notifications
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          branch: {
            include: {
              client: {
                include: { 
                  user: true,
                  contractor: { include: { user: true } }
                }
              }
            }
          }
        }
      })

      // NOTIFICATION 1: Contractor starts work (IN_PROGRESS)
      if (stage === 'IN_PROGRESS' && previousStage === 'SCHEDULED' && session.user.role === 'CONTRACTOR') {
        if (project?.branch?.client?.user) {
          await prisma.notification.create({
            data: {
              userId: project.branch.client.user.id,
              type: 'WORK_ORDER_STARTED',
              title: 'Work Started',
              message: `Work has started on "${workOrder.description}"`,
              link: `/portal/branches/${project.branchId}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })
        }
      }

      // NOTIFICATION 2: Work ready for review (FOR_REVIEW)
      if (stage === 'FOR_REVIEW' && session.user.role === 'CONTRACTOR') {
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

      // NOTIFICATION 3: Client approves work (COMPLETED)
      if (stage === 'COMPLETED' && previousStage === 'FOR_REVIEW' && session.user.role === 'CLIENT') {
        const contractorUserId = project?.branch?.client?.contractor?.user?.id
        if (contractorUserId) {
          await prisma.notification.create({
            data: {
              userId: contractorUserId,
              type: 'WORK_ORDER_APPROVED',
              title: 'Work Order Approved',
              message: `Client approved "${workOrder.description}"`,
              link: `/dashboard/clients/${project.branch.client.slug}/branches/${project.branch.slug}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })
        }
      }

      // NOTIFICATION 4: Client rejects work (FOR_REVIEW → IN_PROGRESS)
      if (stage === 'IN_PROGRESS' && previousStage === 'FOR_REVIEW' && session.user.role === 'CLIENT') {
        const contractorUserId = project?.branch?.client?.contractor?.user?.id
        if (contractorUserId) {
          await prisma.notification.create({
            data: {
              userId: contractorUserId,
              type: 'WORK_ORDER_REJECTED',
              title: 'Work Order Needs Revision',
              message: `Client requested changes to "${workOrder.description}"`,
              link: `/dashboard/clients/${project.branch.client.slug}/branches/${project.branch.slug}?tab=checklist`,
              relatedId: workOrder.id,
              relatedType: 'ChecklistItem'
            }
          })
        }
      }

      // NOTIFICATION 5: Contractor manually archives work (COMPLETED → ARCHIVED)
      if (stage === 'ARCHIVED' && previousStage === 'COMPLETED' && session.user.role === 'CONTRACTOR') {
        if (project?.branch?.client?.user) {
          // Get contractor name
          const contractorName = project.branch.client.contractor?.user?.name || 'Contractor'
          
          await prisma.notification.create({
            data: {
              userId: project.branch.client.user.id,
              type: 'WORK_ORDER_COMPLETED',
              title: 'Work Order Archived',
              message: `"${workOrder.description}" was archived by ${contractorName}`,
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
                fileUrl: null,
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

    // Log the update
    await logResourceUpdated(
      session.user.id,
      session.user.role as any,
      'work_order',
      workOrderId,
      updateData
    )

    // Invalidate cache after work order update
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { branchId: true }
    })
    if (project) {
      invalidateProjectCache(projectId, project.branchId)
      invalidateBranchCache(project.branchId)
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

// DELETE - Soft delete (archive) a work order
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

    // Check permissions
    const hasPermission = await canDeleteWorkOrder(session.user.id, session.user.role as any, workOrderId)
    if (!hasPermission) {
      await logPermissionDenied(session.user.id, session.user.role as any, 'delete work order', 'work_order', workOrderId)
      const error = permissionDeniedError('delete this work order')
      return NextResponse.json({ error: error.error }, { status: error.status })
    }

    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Soft delete: Move to ARCHIVED stage instead of deleting
    await prisma.checklistItem.update({
      where: { id: workOrderId },
      data: {
        stage: 'ARCHIVED',
        deletedAt: new Date(),
        deletedBy: session.user.id,
      }
    })

    // Add activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'UPDATED',
        content: `Work order archived: ${workOrder.description}`,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
      }
    })

    // Invalidate cache after work order deletion
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { branchId: true }
    })
    if (project) {
      invalidateProjectCache(projectId, project.branchId)
      invalidateBranchCache(project.branchId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error archiving work order:', error)
    return NextResponse.json(
      { error: 'Failed to archive work order' },
      { status: 500 }
    )
  }
}
