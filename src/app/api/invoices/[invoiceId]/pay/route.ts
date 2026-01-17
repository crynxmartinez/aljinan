import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Mark an invoice as PAID
// This triggers: Project DONE -> CLOSED (if project is DONE)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId } = await params

    // Get the invoice with its project
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      )
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update invoice to PAID
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })

      // 2. If project is DONE, move it to CLOSED
      let updatedProject = null
      if (invoice.project && invoice.project.status === 'DONE') {
        updatedProject = await tx.project.update({
          where: { id: invoice.project.id },
          data: {
            status: 'CLOSED'
          }
        })

        // Add activity
        await tx.activity.create({
          data: {
            projectId: invoice.project.id,
            type: 'STATUS_CHANGE',
            content: `Invoice paid. Project closed.`,
            createdById: session.user.id,
            createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
          }
        })
      } else if (invoice.projectId) {
        // Add activity for payment
        await tx.activity.create({
          data: {
            projectId: invoice.projectId,
            type: 'UPDATED',
            content: `Invoice marked as paid.`,
            createdById: session.user.id,
            createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
          }
        })
      }

      return {
        invoice: updatedInvoice,
        project: updatedProject
      }
    })

    return NextResponse.json({
      success: true,
      message: result.project ? 'Invoice paid and project closed' : 'Invoice marked as paid',
      invoice: result.invoice,
      project: result.project
    })
  } catch (error) {
    console.error('Error paying invoice:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
