import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single project with all related items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, projectId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, branchId },
      include: {
        requests: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { date: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        contracts: { orderBy: { createdAt: 'desc' } },
        checklists: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, projectId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { title, description, status, priority } = body

    const currentProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE' || status === 'CLOSED') {
        updateData.completedAt = new Date()
      }

      // Log status change activity
      if (currentProject.status !== status) {
        await prisma.activity.create({
          data: {
            projectId,
            type: 'STATUS_CHANGE',
            content: `Status changed from ${currentProject.status} to ${status}`,
            createdById: session.user.id,
            createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
          }
        })
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        _count: {
          select: {
            requests: true,
            quotations: true,
            appointments: true,
            invoices: true,
            checklists: true,
            contracts: true,
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a project (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete projects' }, { status: 403 })
    }

    const { branchId, projectId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Unlink all related items before deleting (set projectId to null)
    await prisma.request.updateMany({ where: { projectId }, data: { projectId: null } })
    await prisma.quotation.updateMany({ where: { projectId }, data: { projectId: null } })
    await prisma.appointment.updateMany({ where: { projectId }, data: { projectId: null } })
    await prisma.invoice.updateMany({ where: { projectId }, data: { projectId: null } })
    await prisma.contract.updateMany({ where: { projectId }, data: { projectId: null } })
    await prisma.checklist.updateMany({ where: { projectId }, data: { projectId: null } })

    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
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
