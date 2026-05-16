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

      const updated = await prisma.contract.update({
        where: { id: contractId },
        data: {
          startSignatureUrl: signatureUrl,
          startSignedById: session.user.id,
          startSignedAt: new Date(),
          status: 'SIGNED'
        }
      })

      return NextResponse.json(updated)
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
      select: { startSignedAt: true, status: true }
    })

    const wasAlreadySigned = existingContract?.startSignedAt !== null
    const isSubstantiveEdit = systems !== undefined || payments !== undefined ||
      title !== undefined || startDate !== undefined ||
      endDate !== undefined

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
              order: index
            }))
          })
        }
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
