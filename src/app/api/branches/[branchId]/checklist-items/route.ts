import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all checklist items for a branch (for Kanban view)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const stage = searchParams.get('stage')

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build the where clause
    const whereClause: Record<string, unknown> = {
      checklist: {
        branchId,
      }
    }

    if (projectId) {
      (whereClause.checklist as Record<string, string>).projectId = projectId
    }

    if (stage) {
      whereClause.stage = stage
    }

    const items = await prisma.checklistItem.findMany({
      where: whereClause,
      include: {
        checklist: {
          include: {
            project: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { stage: 'asc' },
        { scheduledDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform to flat structure for Kanban
    const transformedItems = items.map(item => ({
      id: item.id,
      description: item.description,
      notes: item.notes,
      stage: item.stage,
      type: item.type,
      scheduledDate: item.scheduledDate?.toISOString() || null,
      price: item.price,
      isCompleted: item.isCompleted,
      checklistId: item.checklistId,
      checklistTitle: item.checklist.title,
      projectTitle: item.checklist.project?.title || null,
      // Payment fields
      paymentStatus: item.paymentStatus,
      paymentProofUrl: item.paymentProofUrl,
      paymentProofType: item.paymentProofType,
      paymentProofFileName: item.paymentProofFileName,
      paymentSubmittedAt: item.paymentSubmittedAt?.toISOString() || null,
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist items' },
      { status: 500 }
    )
  }
}

// PATCH - Handle payment submission and verification
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { action, workOrderIds, paymentProofUrl, paymentProofType, paymentProofFileName, signature } = body

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!workOrderIds || !Array.isArray(workOrderIds) || workOrderIds.length === 0) {
      return NextResponse.json({ error: 'Work order IDs required' }, { status: 400 })
    }

    // Verify all work orders belong to this branch
    const workOrders = await prisma.checklistItem.findMany({
      where: {
        id: { in: workOrderIds },
        checklist: { branchId }
      },
      include: {
        checklist: {
          include: {
            project: {
              include: {
                contracts: true
              }
            }
          }
        }
      }
    })

    if (workOrders.length !== workOrderIds.length) {
      return NextResponse.json({ error: 'Invalid work order IDs' }, { status: 400 })
    }

    if (action === 'submit_payment') {
      // Client submitting payment proof
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can submit payment proof' }, { status: 403 })
      }

      if (!paymentProofUrl) {
        return NextResponse.json({ error: 'Payment proof URL required' }, { status: 400 })
      }

      // Update all work orders with payment proof
      await prisma.checklistItem.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          paymentStatus: 'PENDING_VERIFICATION',
          paymentProofUrl,
          paymentProofType: paymentProofType || 'file',
          paymentProofFileName: paymentProofFileName || null,
          paymentSubmittedAt: new Date(),
          paymentSubmittedById: session.user.id,
        }
      })

      // Create notification for contractor
      const firstWorkOrder = workOrders[0]
      const contracts = firstWorkOrder.checklist.project?.contracts || []
      if (contracts.length > 0) {
        const contract = contracts[0]
        
        // Get contractor user ID
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          include: {
            client: {
              include: {
                contractor: {
                  include: { user: true }
                }
              }
            }
          }
        })

        if (branch?.client?.contractor?.userId) {
          await prisma.notification.create({
            data: {
              userId: branch.client.contractor.userId,
              type: 'PAYMENT_SUBMITTED',
              title: 'Payment Proof Submitted',
              message: `Payment proof submitted for ${workOrderIds.length} work order${workOrderIds.length > 1 ? 's' : ''} in ${contract.title}`,
              link: `/dashboard/clients/${branch.client.id}/branches/${branchId}?tab=billing`,
            }
          })
        }
      }

      return NextResponse.json({ success: true, message: 'Payment proof submitted' })

    } else if (action === 'verify_payment') {
      // Contractor verifying payment
      if (session.user.role !== 'CONTRACTOR') {
        return NextResponse.json({ error: 'Only contractors can verify payments' }, { status: 403 })
      }

      // Signature is required for verification
      if (!signature) {
        return NextResponse.json({ error: 'Signature is required to verify payment' }, { status: 400 })
      }

      // Update all work orders as paid with signature
      await prisma.checklistItem.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          paymentStatus: 'PAID',
          paymentVerifiedAt: new Date(),
          paymentVerifiedById: session.user.id,
          paymentVerifiedSignature: signature,
        }
      })

      // Create notification for client
      const verifyFirstWorkOrder = workOrders[0]
      const verifyContracts = verifyFirstWorkOrder.checklist.project?.contracts || []
      if (verifyContracts.length > 0) {
        const verifyContract = verifyContracts[0]
        
        // Get client user ID
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          include: {
            client: {
              include: { user: true }
            }
          }
        })

        if (branch?.client?.userId) {
          await prisma.notification.create({
            data: {
              userId: branch.client.userId,
              type: 'PAYMENT_VERIFIED',
              title: 'Payment Verified',
              message: `Payment verified for ${workOrderIds.length} work order${workOrderIds.length > 1 ? 's' : ''} in ${verifyContract.title}`,
              link: `/portal/branches/${branchId}?tab=billing`,
            }
          })
        }
      }

      return NextResponse.json({ success: true, message: 'Payment verified' })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating checklist items:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist items' },
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
  }
  return false
}
