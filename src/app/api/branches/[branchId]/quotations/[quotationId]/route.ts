import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single quotation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; quotationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, quotationId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, branchId },
      include: { items: true }
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error fetching quotation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    )
  }
}

// PATCH - Update a quotation (contractor) or approve/reject (client)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; quotationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, quotationId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current quotation
    const currentQuotation = await prisma.quotation.findFirst({
      where: { id: quotationId, branchId }
    })

    if (!currentQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Handle client approval/rejection
    if (session.user.role === 'CLIENT') {
      const { action, rejectionNote } = body

      if (action === 'approve') {
        if (currentQuotation.status !== 'SENT') {
          return NextResponse.json({ error: 'Can only approve sent quotations' }, { status: 400 })
        }

        const updated = await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: session.user.id,
          },
          include: { items: true }
        })

        return NextResponse.json(updated)
      } else if (action === 'reject') {
        if (currentQuotation.status !== 'SENT') {
          return NextResponse.json({ error: 'Can only reject sent quotations' }, { status: 400 })
        }

        const updated = await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectedById: session.user.id,
            rejectionNote: rejectionNote || null,
          },
          include: { items: true }
        })

        return NextResponse.json(updated)
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle contractor updates
    if (session.user.role === 'CONTRACTOR') {
      const { title, description, items, taxRate, validUntil, status } = body

      // Build update data
      const updateData: Record<string, unknown> = {}
      
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
      
      // Handle status change (send quotation)
      if (status === 'SENT' && currentQuotation.status === 'DRAFT') {
        updateData.status = 'SENT'
        updateData.sentAt = new Date()
      }

      // Handle items update
      if (items !== undefined) {
        // Delete existing items and create new ones
        await prisma.quotationItem.deleteMany({
          where: { quotationId }
        })

        const parsedItems = items || []
        const subtotal = parsedItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
          return sum + (item.quantity * item.unitPrice)
        }, 0)
        const tax = taxRate !== undefined ? taxRate : currentQuotation.taxRate
        const taxAmount = subtotal * (tax / 100)
        const total = subtotal + taxAmount

        updateData.subtotal = subtotal
        updateData.taxRate = tax
        updateData.taxAmount = taxAmount
        updateData.total = total

        // Create new items
        await prisma.quotationItem.createMany({
          data: parsedItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            quotationId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        })
      } else if (taxRate !== undefined) {
        // Just update tax rate
        const subtotal = currentQuotation.subtotal
        const taxAmount = subtotal * (taxRate / 100)
        const total = subtotal + taxAmount

        updateData.taxRate = taxRate
        updateData.taxAmount = taxAmount
        updateData.total = total
      }

      const updated = await prisma.quotation.update({
        where: { id: quotationId },
        data: updateData,
        include: { items: true }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to update quotation' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a quotation (contractor only, draft only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; quotationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete quotations' }, { status: 403 })
    }

    const { branchId, quotationId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, branchId }
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete draft quotations' }, { status: 400 })
    }

    await prisma.quotation.delete({
      where: { id: quotationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
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
            branches: {
              where: { id: branchId }
            }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        branches: {
          where: { id: branchId }
        }
      }
    })
    return (client?.branches.length || 0) > 0
  }
  return false
}
