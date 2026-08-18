import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'

// GET - Fetch all checklists for a branch
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

    // For clients, only show COMPLETED checklists (reports)
    const whereClause = session.user.role === 'CLIENT'
      ? { branchId, status: 'COMPLETED' as const }
      : { branchId }

    const checklists = await prisma.checklist.findMany({
      where: whereClause,
      include: {
        items: { orderBy: { order: 'asc' } },
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(checklists)
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    )
  }
}

// POST - Create a new checklist (contractor only)
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
      return NextResponse.json({ error: 'Only contractors can create checklists' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { title, description, items, contractId } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const checklist = await prisma.checklist.create({
      data: {
        branchId,
        contractId: contractId || null,
        title,
        description,
        createdById: session.user.id,
        items: {
          create: (items || []).map((item: { description: string }, index: number) => ({
            description: item.description,
            order: index,
          }))
        }
      },
      include: { items: { orderBy: { order: 'asc' } } }
    })

    return NextResponse.json(checklist, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    )
  }
}