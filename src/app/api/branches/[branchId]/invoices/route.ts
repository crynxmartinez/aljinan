import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        project: { select: { id: true, title: true, status: true } }
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
    const { title, description, items, taxRate, dueDate, quotationId, projectId } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

    // Calculate totals
    const parsedItems = items || []
    const subtotal = parsedItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
    const tax = taxRate || 0
    const taxAmount = subtotal * (tax / 100)
    const total = subtotal + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        branchId,
        projectId: projectId || null,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
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
