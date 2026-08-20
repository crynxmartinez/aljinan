import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'
import { roundMoney } from '@/lib/money'

// GET - Fetch all invoices for a branch
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

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For clients, only show SENT, PAID, PARTIAL, OVERDUE invoices (not DRAFT)
    const whereClause = session.user.role === 'CLIENT'
      ? { branchId, status: { not: 'DRAFT' as const } }
      : { branchId }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST - Create a new invoice (contractor only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create invoices' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { title, description, items, taxRate, dueDate, quotationId, contractId } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the contractor for this branch (Branch → Client → Contractor)
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { client: { select: { contractorId: true } } }
    })
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Calculate totals
    const parsedItems = items || []

    // Validate items have numeric quantity and unitPrice
    for (const item of parsedItems) {
      if (typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number' ||
        isNaN(item.quantity) || isNaN(item.unitPrice)) {
        return NextResponse.json(
          { error: 'Each invoice item must have numeric quantity and unitPrice' },
          { status: 400 }
        )
      }
    }

    const subtotal = roundMoney(parsedItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0))
    const tax = taxRate || 0
    const taxAmount = roundMoney(subtotal * (tax / 100))
    const total = roundMoney(subtotal + taxAmount)

    // Generate invoice number using atomic counter
    const invoice = await prisma.$transaction(async (tx) => {
      const contractor = await tx.contractor.update({
        where: { id: branch.client.contractorId },
        data: { nextInvoiceNumber: { increment: 1 } },
        select: { nextInvoiceNumber: true }
      })
      const invoiceNumber = `INV-${String(contractor.nextInvoiceNumber - 1).padStart(5, '0')}`

      return tx.invoice.create({
        data: {
          branchId,
          contractId: contractId || null,
          quotationId: quotationId || null,
          invoiceNumber,
          title,
          description,
          subtotal,
          taxRate: tax,
          taxAmount,
          total,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdById: session.user.id,
          items: {
            create: parsedItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            }))
          }
        },
        include: { items: true }
      })
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}