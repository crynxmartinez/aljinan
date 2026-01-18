import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Approve a project/quotation (Client action)
// This triggers: Project PENDING -> ACTIVE, creates Contract, creates Invoice, work orders become visible
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

    // Get the project with its quotations, work orders, and requests
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        branch: true,
        quotations: {
          where: { status: { in: ['DRAFT', 'SENT'] } }
        },
        checklists: {
          include: {
            items: true
          }
        },
        requests: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Project must be in PENDING status to approve' },
        { status: 400 }
      )
    }

    // Calculate total value from work orders
    const totalValue = project.checklists.reduce((sum, checklist) => {
      return sum + checklist.items.reduce((itemSum, item) => {
        return itemSum + (item.price || 0)
      }, 0)
    }, 0)

    // Start a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update project status to ACTIVE
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'ACTIVE',
          totalValue,
        }
      })

      // 2. Update all pending quotations to APPROVED
      await tx.quotation.updateMany({
        where: {
          projectId,
          status: { in: ['DRAFT', 'SENT'] }
        },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        }
      })

      // 3. Create a Contract
      const contract = await tx.contract.create({
        data: {
          branchId: project.branchId,
          projectId,
          title: `Contract: ${project.title}`,
          description: project.description,
          status: 'SIGNED',
          totalValue,
          signedAt: new Date(),
          createdById: session.user.id,
        }
      })

      // 4. Create an Invoice (PENDING payment)
      const invoice = await tx.invoice.create({
        data: {
          branchId: project.branchId,
          projectId,
          title: `Invoice: ${project.title}`,
          description: `Invoice for project ${project.title}`,
          status: 'SENT',
          total: totalValue,
          subtotal: totalValue,
          dueDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now if no end date
          createdById: session.user.id,
        }
      })

      // 5. Update all work orders to SCHEDULED stage (now visible in Kanban/Calendar)
      for (const checklist of project.checklists) {
        await tx.checklistItem.updateMany({
          where: {
            checklistId: checklist.id,
            stage: 'REQUESTED'
          },
          data: {
            stage: 'SCHEDULED'
          }
        })

        // Update checklist status
        await tx.checklist.update({
          where: { id: checklist.id },
          data: { status: 'IN_PROGRESS' }
        })
      }

      // 6. Complete all associated requests
      if (project.requests && project.requests.length > 0) {
        await tx.request.updateMany({
          where: {
            projectId,
            status: 'OPEN'
          },
          data: {
            status: 'COMPLETED'
          }
        })
      }

      // 7. Add activity
      await tx.activity.create({
        data: {
          projectId,
          type: 'APPROVED',
          content: `Project approved by client. Contract signed, invoice created.`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      return {
        project: updatedProject,
        contract,
        invoice
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Project approved successfully',
      project: result.project,
      contractId: result.contract.id,
      invoiceId: result.invoice.id
    })
  } catch (error) {
    console.error('Error approving project:', error)
    return NextResponse.json(
      { error: 'Failed to approve project' },
      { status: 500 }
    )
  }
}
