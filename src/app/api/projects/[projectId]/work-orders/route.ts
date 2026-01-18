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
    const { description, notes, scheduledDate, price, type, recurringType, name } = body

    // Support both 'description' and 'name' for work order title
    const workOrderName = description || name
    if (!workOrderName) {
      return NextResponse.json({ error: 'Description/name is required' }, { status: 400 })
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
    let orderIndex = (maxOrder._max.order || 0) + 1

    const createdWorkOrders: Array<{
      id: string
      checklistId: string
      description: string
      notes: string | null
      stage: string
      type: string
      scheduledDate: Date | null
      price: number | null
      isCompleted: boolean
      order: number
      createdAt: Date
      updatedAt: Date
    }> = []

    // Handle recurring work orders
    const recType = recurringType || 'ONCE'
    
    if (recType === 'ONCE') {
      // Single work order
      const workOrder = await prisma.checklistItem.create({
        data: {
          checklistId: checklist.id,
          description: workOrderName,
          notes: notes || null,
          stage: 'REQUESTED',
          type: type || (session.user.role === 'CLIENT' ? 'ADHOC' : 'SCHEDULED'),
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          price: price ? parseFloat(price) : null,
          recurringType: 'ONCE',
          order: orderIndex,
        }
      })
      createdWorkOrders.push(workOrder)
    } else {
      // Recurring work orders - calculate occurrences based on project dates
      const baseDate = scheduledDate ? new Date(scheduledDate) : (project.startDate || new Date())
      const projectEndDate = project.endDate || new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      
      const monthsBetween = Math.max(1, Math.ceil((projectEndDate.getTime() - baseDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
      const interval = recType === 'MONTHLY' ? 1 : 3
      const occurrences = Math.ceil(monthsBetween / interval)

      for (let i = 0; i < occurrences; i++) {
        const occurrenceDate = new Date(baseDate)
        occurrenceDate.setMonth(occurrenceDate.getMonth() + (i * interval))
        
        // Don't create if past end date
        if (occurrenceDate > projectEndDate) break

        const workOrder = await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            description: `${workOrderName} (${recType === 'MONTHLY' ? 'Month' : 'Q'}${i + 1})`,
            notes: notes || null,
            stage: 'REQUESTED',
            type: type || (session.user.role === 'CLIENT' ? 'ADHOC' : 'SCHEDULED'),
            scheduledDate: occurrenceDate,
            price: price ? parseFloat(price) : null,
            recurringType: recType,
            occurrenceIndex: i + 1,
            order: orderIndex++,
          }
        })
        createdWorkOrders.push(workOrder)
      }
    }

    // Add activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'CREATED',
        content: `Work order${createdWorkOrders.length > 1 ? 's' : ''} added: ${workOrderName}${createdWorkOrders.length > 1 ? ` (${createdWorkOrders.length} occurrences)` : ''}`,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
      }
    })

    // Return first work order for backwards compatibility, but include count
    const firstWorkOrder = createdWorkOrders[0]
    return NextResponse.json({
      id: firstWorkOrder.id,
      checklistId: firstWorkOrder.checklistId,
      checklistTitle: checklist.title,
      description: firstWorkOrder.description,
      notes: firstWorkOrder.notes,
      stage: firstWorkOrder.stage,
      type: firstWorkOrder.type,
      scheduledDate: firstWorkOrder.scheduledDate,
      price: firstWorkOrder.price,
      isCompleted: firstWorkOrder.isCompleted,
      order: firstWorkOrder.order,
      createdAt: firstWorkOrder.createdAt,
      updatedAt: firstWorkOrder.updatedAt,
      totalCreated: createdWorkOrders.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating work order:', error)
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    )
  }
}
