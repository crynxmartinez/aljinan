import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, invoiceId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, branchId },
      include: { items: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PATCH - Update an invoice
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, invoiceId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const currentInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, branchId }
    })

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only contractors can update invoices
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can update invoices' }, { status: 403 })
    }

    const { title, description, items, taxRate, dueDate, status, amountPaid } = body

    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    
    // Handle status changes
    if (status !== undefined) {
      updateData.status = status
      if (status === 'SENT' && currentInvoice.status === 'DRAFT') {
        updateData.sentAt = new Date()
      }
      if (status === 'PAID') {
        updateData.paidAt = new Date()
        updateData.amountPaid = currentInvoice.total
        
        // Auto-update project status to CLOSED if invoice is linked to a project and project is DONE
        if (currentInvoice.projectId) {
          const project = await prisma.project.findUnique({
            where: { id: currentInvoice.projectId }
          })
          
          if (project && project.status === 'DONE') {
            await prisma.project.update({
              where: { id: currentInvoice.projectId },
              data: { 
                status: 'CLOSED',
                completedAt: new Date()
              }
            })
            // Add activity
            await prisma.activity.create({
              data: {
                projectId: currentInvoice.projectId,
                type: 'STATUS_CHANGE',
                content: 'Project closed - invoice payment received',
                createdById: session.user.id,
                createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
              }
            })
          }
        }
      }
    }

    // Handle partial payment
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid
      if (amountPaid >= currentInvoice.total) {
        updateData.status = 'PAID'
        updateData.paidAt = new Date()
      } else if (amountPaid > 0) {
        updateData.status = 'PARTIAL'
      }
    }

    // Handle items update
    if (items !== undefined) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId }
      })

      const parsedItems = items || []
      const subtotal = parsedItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)
      const tax = taxRate !== undefined ? taxRate : currentInvoice.taxRate
      const taxAmount = subtotal * (tax / 100)
      const total = subtotal + taxAmount

      updateData.subtotal = subtotal
      updateData.taxRate = tax
      updateData.taxAmount = taxAmount
      updateData.total = total

      await prisma.invoiceItem.createMany({
        data: parsedItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }))
      })
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: { items: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an invoice (contractor only, draft only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete invoices' }, { status: 403 })
    }

    const { branchId, invoiceId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, branchId }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete draft invoices' }, { status: 400 })
    }

    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
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
  } else if (role === 'MANAGER') {
    const manager = await prisma.manager.findUnique({
      where: { userId },
      include: { branchAccess: { where: { branchId } } }
    })
    return (manager?.branchAccess.length || 0) > 0
  }
  return false
}
