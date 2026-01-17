import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all work orders for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Get project with its checklists and items
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        checklists: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Flatten all checklist items as work orders
    const workOrders = project.checklists.flatMap(checklist =>
      checklist.items.map(item => ({
        id: item.id,
        checklistId: item.checklistId,
        checklistTitle: checklist.title,
        description: item.description,
        notes: item.notes,
        stage: item.stage,
        type: item.type,
        scheduledDate: item.scheduledDate,
        price: item.price,
        isCompleted: item.isCompleted,
        order: item.order,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    )

    return NextResponse.json(workOrders)
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}

// POST - Add a new work order to a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { description, notes, scheduledDate, price, type } = body

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        checklists: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Find or create a default checklist for the project
    let checklist = project.checklists[0]
    
    if (!checklist) {
      checklist = await prisma.checklist.create({
        data: {
          branchId: project.branchId,
          projectId: project.id,
          title: `Work Orders - ${project.title}`,
          description: 'Work orders for this project',
          status: 'DRAFT',
          createdById: session.user.id,
        }
      })
    }

    // Get the next order number
    const maxOrder = await prisma.checklistItem.aggregate({
      where: { checklistId: checklist.id },
      _max: { order: true }
    })

    // Create the work order (checklist item)
    const workOrder = await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        description,
        notes: notes || null,
        stage: 'REQUESTED',
        type: type || (session.user.role === 'CLIENT' ? 'ADHOC' : 'SCHEDULED'),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        price: price ? parseFloat(price) : null,
        order: (maxOrder._max.order || 0) + 1,
      }
    })

    // Add activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'CREATED',
        content: `Work order added: ${description}`,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
      }
    })

    return NextResponse.json({
      id: workOrder.id,
      checklistId: workOrder.checklistId,
      checklistTitle: checklist.title,
      description: workOrder.description,
      notes: workOrder.notes,
      stage: workOrder.stage,
      type: workOrder.type,
      scheduledDate: workOrder.scheduledDate,
      price: workOrder.price,
      isCompleted: workOrder.isCompleted,
      order: workOrder.order,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating work order:', error)
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    )
  }
}
