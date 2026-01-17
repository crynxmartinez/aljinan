import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all checklist items for a branch (for Kanban view)
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
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build the where clause
    const whereClause: {
      checklist: {
        branchId: string
        projectId?: string
      }
    } = {
      checklist: {
        branchId,
      }
    }

    if (projectId) {
      whereClause.checklist.projectId = projectId
    }

    const items = await prisma.checklistItem.findMany({
      where: whereClause,
      include: {
        checklist: {
          include: {
            project: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { stage: 'asc' },
        { scheduledDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform to flat structure for Kanban
    const transformedItems = items.map(item => ({
      id: item.id,
      description: item.description,
      notes: item.notes,
      stage: item.stage,
      type: item.type,
      scheduledDate: item.scheduledDate?.toISOString() || null,
      price: item.price,
      isCompleted: item.isCompleted,
      checklistId: item.checklistId,
      checklistTitle: item.checklist.title,
      projectTitle: item.checklist.project?.title || null
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist items' },
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
