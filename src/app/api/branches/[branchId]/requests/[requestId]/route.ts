import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single request
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const req = await prisma.request.findFirst({
      where: { id: requestId, branchId }
    })

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(req)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// PATCH - Update a request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params
    const body = await request.json()
    const { title, description, priority, status, assignedTo, dueDate } = body

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current request to check status change
    const currentRequest = await prisma.request.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    // Auto-create project when contractor approves/starts work on request
    // Only create if: status changing to IN_PROGRESS, request has no project, and user is contractor
    const shouldCreateProject = 
      status === 'IN_PROGRESS' && 
      !currentRequest.projectId && 
      session.user.role === 'CONTRACTOR'

    let projectId: string | null = null

    if (shouldCreateProject) {
      // Create a new project from this request
      const project = await prisma.project.create({
        data: {
          branchId,
          title: currentRequest.title,
          description: currentRequest.description,
          priority: currentRequest.priority,
          status: 'PENDING',
          createdById: session.user.id,
          createdByRole: 'CONTRACTOR',
        }
      })
      projectId = project.id
      updateData.projectId = projectId

      // Add activity to the new project
      await prisma.activity.create({
        data: {
          projectId: project.id,
          type: 'CREATED',
          content: `Project created from request: ${currentRequest.title}`,
          createdById: session.user.id,
          createdByRole: 'CONTRACTOR',
        }
      })
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData
    })

    return NextResponse.json({ 
      ...updatedRequest, 
      projectCreated: shouldCreateProject,
      projectId: projectId || updatedRequest.projectId 
    })
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a request (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can delete requests
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete requests' }, { status: 403 })
    }

    const { branchId, requestId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.request.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
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
