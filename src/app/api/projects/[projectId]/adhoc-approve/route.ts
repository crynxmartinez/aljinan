import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Approve an ad-hoc work order request
// This adds the work order to the existing contract, checklist, calendar, and invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { workOrderId } = body

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 })
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        invoices: {
          where: { status: { in: ['DRAFT', 'SENT'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        contracts: {
          where: { status: 'SIGNED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Project must be ACTIVE to approve ad-hoc requests' },
        { status: 400 }
      )
    }

    // Get the work order
    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId },
      include: {
        checklist: true
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.type !== 'ADHOC') {
      return NextResponse.json(
        { error: 'This is not an ad-hoc work order' },
        { status: 400 }
      )
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update work order stage to SCHEDULED (now visible in Kanban/Calendar)
      const updatedWorkOrder = await tx.checklistItem.update({
        where: { id: workOrderId },
        data: {
          stage: 'SCHEDULED'
        }
      })

      // 2. Update project total value
      const newTotalValue = (project.totalValue || 0) + (workOrder.price || 0)
      await tx.project.update({
        where: { id: projectId },
        data: {
          totalValue: newTotalValue
        }
      })

      // 3. Update existing invoice if there is one
      if (project.invoices.length > 0) {
        const invoice = project.invoices[0]
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            total: (invoice.total || 0) + (workOrder.price || 0),
            subtotal: (invoice.subtotal || 0) + (workOrder.price || 0)
          }
        })

        // Add invoice item
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: `Ad-hoc: ${workOrder.description}`,
            quantity: 1,
            unitPrice: workOrder.price || 0,
            total: workOrder.price || 0
          }
        })
      }

      // 4. Update contract value if there is one
      if (project.contracts.length > 0) {
        const contract = project.contracts[0]
        await tx.contract.update({
          where: { id: contract.id },
          data: {
            totalValue: (contract.totalValue || 0) + (workOrder.price || 0)
          }
        })
      }

      // 5. Add activity
      await tx.activity.create({
        data: {
          projectId,
          type: 'APPROVED',
          content: `Ad-hoc work order approved: ${workOrder.description}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
        }
      })

      return updatedWorkOrder
    })

    return NextResponse.json({
      success: true,
      message: 'Ad-hoc work order approved and added to contract',
      workOrder: result
    })
  } catch (error) {
    console.error('Error approving ad-hoc work order:', error)
    return NextResponse.json(
      { error: 'Failed to approve ad-hoc work order' },
      { status: 500 }
    )
  }
}
