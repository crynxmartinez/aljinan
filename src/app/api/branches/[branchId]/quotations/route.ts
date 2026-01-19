import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all quotations for a branch
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

    // For clients, only show SENT, APPROVED, REJECTED quotations (not DRAFT)
    const whereClause = session.user.role === 'CLIENT' 
      ? { branchId, status: { not: 'DRAFT' as const } }
      : { branchId }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        items: true,
        project: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  }
}

// POST - Create a new quotation (contractor only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can create quotations
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create quotations' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { title, description, items, taxRate, validUntil, requestId, projectId } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate totals
    const parsedItems = items || []
    const subtotal = parsedItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
    const tax = taxRate || 0
    const taxAmount = subtotal * (tax / 100)
    const total = subtotal + taxAmount

    const quotation = await prisma.quotation.create({
      data: {
        branchId,
        projectId: projectId || null,
        requestId: requestId || null,
        title,
        description,
        subtotal,
        taxRate: tax,
        taxAmount,
        total,
        validUntil: validUntil ? new Date(validUntil) : null,
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
      include: {
        items: true
      }
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation' },
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
