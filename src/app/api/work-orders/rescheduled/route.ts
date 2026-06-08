import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch rescheduled work orders that client hasn't acknowledged
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only clients see reschedule notifications
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json([])
    }

    // Get client's branches
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        branches: {
          select: { id: true, name: true }
        }
      }
    })

    if (!client || client.branches.length === 0) {
      return NextResponse.json([])
    }

    const branchIds = client.branches.map(b => b.id)
    const branchMap = Object.fromEntries(client.branches.map(b => [b.id, b.name]))

    // Find rescheduled work orders that haven't been acknowledged
    const rescheduledWorkOrders = await prisma.checklistItem.findMany({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        rescheduledAt: { not: null },
        rescheduledNotifiedAt: null, // Not yet acknowledged
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        previousScheduledDate: true,
        scheduledDate: true,
        rescheduledAt: true,
        rescheduledReason: true,
        checklist: {
          select: {
            branchId: true
          }
        }
      },
      orderBy: {
        rescheduledAt: 'desc'
      }
    })

    // Map to response format
    const result = rescheduledWorkOrders.map(wo => ({
      id: wo.id,
      description: wo.description,
      previousScheduledDate: wo.previousScheduledDate?.toISOString() || '',
      scheduledDate: wo.scheduledDate?.toISOString() || '',
      rescheduledAt: wo.rescheduledAt?.toISOString() || '',
      rescheduledReason: wo.rescheduledReason,
      branchId: wo.checklist.branchId,
      branchName: branchMap[wo.checklist.branchId] || 'Unknown Branch',
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching rescheduled work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rescheduled work orders' },
      { status: 500 }
    )
  }
}

// POST - Acknowledge rescheduled work orders
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only clients can acknowledge
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Only clients can acknowledge reschedules' }, { status: 403 })
    }

    const body = await request.json()
    const { workOrderIds } = body

    if (!workOrderIds || !Array.isArray(workOrderIds) || workOrderIds.length === 0) {
      return NextResponse.json({ error: 'Work order IDs required' }, { status: 400 })
    }

    // Get client's branches to verify access
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      include: {
        branches: {
          select: { id: true }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const branchIds = client.branches.map(b => b.id)

    // Update all specified work orders that belong to client's branches
    await prisma.checklistItem.updateMany({
      where: {
        id: { in: workOrderIds },
        checklist: {
          branchId: { in: branchIds }
        },
        rescheduledAt: { not: null },
        rescheduledNotifiedAt: null,
      },
      data: {
        rescheduledNotifiedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error acknowledging rescheduled work orders:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge' },
      { status: 500 }
    )
  }
}
