import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContractSystemFrequency } from '@prisma/client'

// Type for system input
interface SystemInput {
  id?: string
  name: string
  description?: string
  frequency: ContractSystemFrequency
  visitDates: string[]
  dateMode?: 'MANUAL' | 'AUTOMATIC'
  paymentDueDates?: string[]
  paymentAmounts?: string[]
  paymentDateMode?: 'AUTOMATIC' | 'MANUAL'
}

// Type for payment input
interface PaymentInput {
  id?: string
  paymentNo: number
  dueDate?: string
  amount?: number
}

// GET - Fetch a single contract
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, contractId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, branchId },
      include: {
        checklist: {
          include: {
            items: true
          }
        },
        systems: {
          orderBy: { order: 'asc' }
        },
        payments: {
          orderBy: { paymentNo: 'asc' }
        }
      }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

// PATCH - Update a contract (contractor can update, client can sign)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, contractId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle client start signature (when accepting contract)
    if (body.action === 'start_sign') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can sign contracts' }, { status: 403 })
      }

      const { signatureUrl } = body
      if (!signatureUrl) {
        return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
      }

      // Use transaction to update contract and generate work orders
      const result = await prisma.$transaction(async (tx) => {
        // Update contract with signature
        const updated = await tx.contract.update({
          where: { id: contractId },
          data: {
            startSignatureUrl: signatureUrl,
            startSignedById: session.user.id,
            startSignedAt: new Date(),
            status: 'SIGNED'
          },
          include: {
            systems: true,
            checklist: true
          }
        })

        // Only generate work orders if contract has systems and no existing checklist
        if (updated.systems.length > 0 && !updated.checklist) {
          // Get the next work order number
          const lastWorkOrder = await tx.checklistItem.findFirst({
            orderBy: { workOrderNumber: 'desc' },
            select: { workOrderNumber: true }
          })
          let nextWorkOrderNumber = (lastWorkOrder?.workOrderNumber || 0) + 1

          // Create a checklist for this contract
          const checklist = await tx.checklist.create({
            data: {
              branchId,
              title: `${updated.title} - Maintenance Schedule`,
              description: `Auto-generated maintenance work orders for contract: ${updated.title}`,
              status: 'IN_PROGRESS',
              contractId: updated.id,
              createdById: session.user.id
            }
          })

          // Generate work orders for each system's visit dates
          const workOrdersToCreate: {
            checklistId: string
            description: string
            notes: string
            stage: 'SCHEDULED'
            type: 'SCHEDULED'
            workOrderType: 'MAINTENANCE'
            scheduledDate: Date
            contractSystemId: string
            workOrderNumber: number
            order: number
            price: number | null
            visitIndex: number
            paymentDueDate: Date | null
          }[] = []

          let orderIndex = 0
          for (const system of updated.systems) {
            const visitDates = system.visitDates as string[]
            const paymentDueDates = (system.paymentDueDates as string[]) || []
            const frequencyLabel = {
              'MONTHLY': 'Monthly',
              'QUARTERLY': 'Quarterly',
              'SEMI_ANNUALLY': 'Semi-Annual',
              'ANNUALLY': 'Annual'
            }[system.frequency] || system.frequency

            const paymentAmounts = (system.paymentAmounts as (number | null)[]) || []

            for (let i = 0; i < visitDates.length; i++) {
              const visitDate = visitDates[i]
              if (visitDate) {
                // Get payment due date - either from system or calculate as visit date + 10 days
                let paymentDueDate: Date | null = null
                if (paymentDueDates[i]) {
                  paymentDueDate = new Date(paymentDueDates[i])
                } else if (system.paymentDateMode === 'AUTOMATIC') {
                  paymentDueDate = new Date(visitDate)
                  paymentDueDate.setDate(paymentDueDate.getDate() + 10)
                }

                // Get price from payment amounts if set, otherwise null (contractor sets manually)
                const price = paymentAmounts[i] ?? null

                workOrdersToCreate.push({
                  checklistId: checklist.id,
                  description: `${system.name} - ${frequencyLabel} Visit ${i + 1}`,
                  notes: system.description || `Scheduled maintenance for ${system.name}`,
                  stage: 'SCHEDULED',
                  type: 'SCHEDULED',
                  workOrderType: 'MAINTENANCE',
                  scheduledDate: new Date(visitDate),
                  contractSystemId: system.id,
                  workOrderNumber: nextWorkOrderNumber++,
                  order: orderIndex++,
                  price,
                  visitIndex: i,
                  paymentDueDate
                })
              }
            }
          }

          // Create all work orders
          if (workOrdersToCreate.length > 0) {
            await tx.checklistItem.createMany({
              data: workOrdersToCreate
            })
          }
        }

        return updated
      })

      return NextResponse.json(result)
    }

    // Handle client end signature (when completing contract)
    if (body.action === 'end_sign') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can sign contracts' }, { status: 403 })
      }

      const { signatureUrl } = body
      if (!signatureUrl) {
        return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
      }

      // Verify all work orders are completed AND paid before allowing end signature
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          checklist: {
            include: {
              items: true
            }
          }
        }
      })

      if (contract?.checklist) {
        const allItems = contract.checklist.items
        const allCompleted = allItems.length > 0 && allItems.every(item => item.stage === 'COMPLETED')
        const allPaid = allItems.length > 0 && allItems.every(item => item.paymentStatus === 'PAID')

        if (!allCompleted) {
          return NextResponse.json({ error: 'All work orders must be completed before signing' }, { status: 400 })
        }

        if (!allPaid) {
          return NextResponse.json({ error: 'All work orders must be paid before signing' }, { status: 400 })
        }
      }

      const updated = await prisma.contract.update({
        where: { id: contractId },
        data: {
          endSignatureUrl: signatureUrl,
          endSignedById: session.user.id,
          endSignedAt: new Date(),
          status: 'COMPLETED'
        }
      })

      return NextResponse.json(updated)
    }

    // Regular update (contractor only)
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can update contracts' }, { status: 403 })
    }

    const {
      title,
      description,
      startDate,
      endDate,
      autoRenew,
      status,
      fileName,
      fileUrl,
      fileSize,
      certificateFileName,
      certificateUrl,
      systems,
      payments
    } = body

    // Check if contract was already signed - if so, editing will require re-signature
    const existingContract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        systems: {
          include: {
            workOrders: {
              select: {
                id: true,
                stage: true,
                scheduledDate: true,
                contractSystemId: true
              }
            }
          }
        }
      }
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const wasAlreadySigned = existingContract.startSignedAt !== null
    const isSubstantiveEdit = systems !== undefined || payments !== undefined ||
      title !== undefined || startDate !== undefined ||
      endDate !== undefined

    // Check for completed work orders if trying to edit systems
    if (systems !== undefined && Array.isArray(systems)) {
      // Find all completed work orders linked to this contract's systems
      const completedWorkOrders = existingContract.systems.flatMap(sys =>
        sys.workOrders.filter(wo => wo.stage === 'COMPLETED')
      )

      if (completedWorkOrders.length > 0) {
        // Get the system IDs that have completed work orders
        const lockedSystemIds = [...new Set(completedWorkOrders.map(wo => wo.contractSystemId))]
        const lockedSystems = existingContract.systems.filter(sys => lockedSystemIds.includes(sys.id))

        // Return info about locked systems
        return NextResponse.json({
          error: 'Cannot modify contract systems with completed work orders',
          lockedSystems: lockedSystems.map(sys => ({
            id: sys.id,
            name: sys.name,
            completedWorkOrderCount: sys.workOrders.filter(wo => wo.stage === 'COMPLETED').length
          })),
          message: 'Some systems have completed work orders and cannot be modified. Please contact support if you need to make changes.'
        }, { status: 400 })
      }

      // Check for in-progress work orders (warning but allow)
      const inProgressWorkOrders = existingContract.systems.flatMap(sys =>
        sys.workOrders.filter(wo => wo.stage === 'IN_PROGRESS' || wo.stage === 'FOR_REVIEW')
      )

      // If there are in-progress work orders, we need to handle them
      // For now, we'll delete scheduled work orders and keep in-progress ones
      // The new systems will generate new work orders when re-signed
    }

    // Use transaction to update contract with systems and payments
    const updated = await prisma.$transaction(async (tx) => {
      // Build update data for contract
      const updateData: Record<string, unknown> = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
      if (autoRenew !== undefined) updateData.autoRenew = autoRenew
      if (status !== undefined) updateData.status = status
      if (fileName !== undefined) updateData.fileName = fileName
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl
      if (fileSize !== undefined) updateData.fileSize = fileSize
      if (certificateFileName !== undefined) updateData.certificateFileName = certificateFileName
      if (certificateUrl !== undefined) updateData.certificateUrl = certificateUrl

      // If contract was already signed and this is a substantive edit, reset signature
      // This requires the client to re-sign the updated contract
      if (wasAlreadySigned && isSubstantiveEdit) {
        updateData.startSignedAt = null
        updateData.startSignatureUrl = null
        updateData.startSignedById = null
        updateData.status = 'PENDING_SIGNATURE'
      }

      // Update contract
      await tx.contract.update({
        where: { id: contractId },
        data: updateData
      })

      // Update systems if provided
      if (systems !== undefined && Array.isArray(systems)) {
        // Check if systems actually changed (compare names, frequencies, visitDates)
        const existingSystems = existingContract.systems
        const systemsChanged = systems.length !== existingSystems.length ||
          systems.some((newSys: SystemInput, idx: number) => {
            const oldSys = existingSystems[idx]
            if (!oldSys) return true
            return newSys.name !== oldSys.name ||
              newSys.frequency !== oldSys.frequency ||
              JSON.stringify(newSys.visitDates || []) !== JSON.stringify(oldSys.visitDates || [])
          })

        if (systemsChanged) {
          // Get existing system IDs to delete their scheduled work orders
          const existingSystemIds = existingSystems.map(s => s.id)

          // Delete only SCHEDULED work orders linked to these systems
          // (IN_PROGRESS and FOR_REVIEW work orders are kept, COMPLETED blocks the edit)
          if (existingSystemIds.length > 0) {
            await tx.checklistItem.deleteMany({
              where: {
                contractSystemId: { in: existingSystemIds },
                stage: 'SCHEDULED'
              }
            })
          }

          // Delete existing systems and recreate
          await tx.contractSystem.deleteMany({
            where: { contractId }
          })

          if (systems.length > 0) {
            await tx.contractSystem.createMany({
              data: systems.map((system: SystemInput, index: number) => ({
                contractId,
                name: system.name,
                description: system.description || null,
                frequency: system.frequency,
                visitDates: system.visitDates || [],
                dateMode: system.dateMode || 'MANUAL',
                paymentDueDates: system.paymentDueDates || [],
                paymentAmounts: system.paymentAmounts?.map(a => a ? parseFloat(a) : null) || [],
                paymentDateMode: system.paymentDateMode || 'AUTOMATIC',
                order: index
              }))
            })
          }

          // Check if the contract's checklist is now empty and delete it
          // This allows new work orders to be generated on re-signature
          const contractChecklist = await tx.checklist.findFirst({
            where: { contractId },
            include: { items: { select: { id: true } } }
          })

          if (contractChecklist && contractChecklist.items.length === 0) {
            await tx.checklist.delete({
              where: { id: contractChecklist.id }
            })
          }
        }
        // If systems didn't change, don't delete work orders or recreate systems
      }

      // Update payments if provided
      if (payments !== undefined && Array.isArray(payments)) {
        // Delete existing payments and recreate
        await tx.contractPayment.deleteMany({
          where: { contractId }
        })

        if (payments.length > 0) {
          await tx.contractPayment.createMany({
            data: payments.map((payment: PaymentInput, index: number) => ({
              contractId,
              paymentNo: payment.paymentNo || index + 1,
              dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
              amount: payment.amount || null,
              order: index
            }))
          })
        }
      }

      // Return updated contract with relations
      return tx.contract.findUnique({
        where: { id: contractId },
        include: {
          systems: { orderBy: { order: 'asc' } },
          payments: { orderBy: { paymentNo: 'asc' } }
        }
      })
    })

    // Include flag to indicate if re-signature is required
    const requiresResignature = wasAlreadySigned && isSubstantiveEdit

    return NextResponse.json({
      ...updated,
      requiresResignature
    })
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a contract (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete contracts' }, { status: 403 })
    }

    const { branchId, contractId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.contract.delete({
      where: { id: contractId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Failed to delete contract' },
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
      include: { branches: { where: { id: branchId } } }
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
