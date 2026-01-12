import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single checklist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; checklistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, checklistId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const checklist = await prisma.checklist.findFirst({
      where: { id: checklistId, branchId },
      include: { items: { orderBy: { order: 'asc' } } }
    })

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    )
  }
}

// PATCH - Update a checklist (contractor only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; checklistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can update checklists' }, { status: 403 })
    }

    const { branchId, checklistId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { title, description, status, notes, items } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes
    
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.completedById = session.user.id
      }
    }

    // Update items if provided
    if (items !== undefined) {
      // Delete existing items and recreate
      await prisma.checklistItem.deleteMany({
        where: { checklistId }
      })

      await prisma.checklistItem.createMany({
        data: items.map((item: { description: string; isCompleted: boolean; notes?: string }, index: number) => ({
          checklistId,
          description: item.description,
          isCompleted: item.isCompleted || false,
          notes: item.notes || null,
          order: index,
        }))
      })
    }

    const updated = await prisma.checklist.update({
      where: { id: checklistId },
      data: updateData,
      include: { items: { orderBy: { order: 'asc' } } }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a checklist (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; checklistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete checklists' }, { status: 403 })
    }

    const { branchId, checklistId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.checklist.delete({
      where: { id: checklistId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist:', error)
    return NextResponse.json(
      { error: 'Failed to delete checklist' },
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
