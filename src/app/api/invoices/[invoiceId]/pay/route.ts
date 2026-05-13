import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPayInvoice, permissionDeniedError } from '@/lib/permissions'
import { logInvoicePayment, logPermissionDenied } from '@/lib/audit-log'

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

    // Check permissions - only clients can pay invoices
    const hasPermission = await canPayInvoice(session.user.id, session.user.role as any, invoiceId)
    if (!hasPermission) {
      await logPermissionDenied(session.user.id, session.user.role as any, 'pay invoice', 'invoice', invoiceId)
      const error = permissionDeniedError('pay this invoice')
      return NextResponse.json({ error: error.error }, { status: error.status })
    }

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
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

      // 2. Add activity for payment if contract exists
      if (invoice.contractId) {
        await tx.activity.create({
          data: {
            branchId: invoice.branchId,
            contractId: invoice.contractId,
            type: 'UPDATED',
            content: `Invoice marked as paid.`,
            createdById: session.user.id,
            createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
          }
        })
      }

      return {
        invoice: updatedInvoice
      }
    })

    // Log invoice payment
    await logInvoicePayment(
      session.user.id,
      session.user.role as any,
      invoiceId,
      invoice.total,
      'manual'
    )

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as paid',
      invoice: result.invoice
    })
  } catch (error) {
    console.error('Error paying invoice:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
