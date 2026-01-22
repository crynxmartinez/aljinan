import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all projects for a branch
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

    const projects = await prisma.project.findMany({
      where: { branchId },
      include: {
        checklists: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'asc' }
        },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform projects to include work orders from checklists
    const transformedProjects = projects.map(project => {
      // Get work orders from checklist items
      const workOrders = project.checklists.flatMap(checklist => 
        checklist.items.map(item => ({
          id: item.id,
          title: item.description,
          description: item.notes,
          scheduledDate: item.scheduledDate,
          status: item.stage,
          type: item.type === 'ADHOC' ? 'adhoc' as const : 'scheduled' as const,
          price: item.price,
          recurringType: item.recurringType || 'ONCE'
        }))
      )

      // Calculate total from work order prices
      const calculatedTotal = workOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.startDate || project.createdAt,
        endDate: project.endDate || project.completedAt,
        totalValue: calculatedTotal,
        workOrders,
        _count: project._count
      }
    })

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - Create a new project with work orders
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { title, description, requestId, startDate, endDate, autoRenew, workOrders } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for existing ACTIVE project on this branch
    const activeProject = await prisma.project.findFirst({
      where: {
        branchId,
        status: 'ACTIVE'
      }
    })

    if (activeProject) {
      return NextResponse.json(
        { error: 'This branch already has an active project. Complete or close the existing project before creating a new one.' },
        { status: 400 }
      )
    }

    // Build work order items first to calculate correct total (including recurring)
    type WorkOrderItem = {
      name: string
      notes: string | null
      scheduledDate: Date | null
      price: number | null
      recurringType: 'ONCE' | 'MONTHLY' | 'QUARTERLY'
      occurrenceIndex: number | null
      order: number
    }
    const generatedWorkOrders: WorkOrderItem[] = []

    if (workOrders && workOrders.length > 0) {
      let orderIndex = 0
      for (const wo of workOrders as Array<{ name: string; description?: string; scheduledDate?: string; price?: number; recurringType?: 'ONCE' | 'MONTHLY' | 'QUARTERLY' }>) {
        const recurringType = wo.recurringType || 'ONCE'
        const baseDate = wo.scheduledDate ? new Date(wo.scheduledDate) : (startDate ? new Date(startDate) : new Date())
        const projectEndDate = endDate ? new Date(endDate) : new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000) // Default 1 year

        if (recurringType === 'ONCE') {
          // Single work order
          generatedWorkOrders.push({
            name: wo.name,
            notes: wo.description || null,
            scheduledDate: wo.scheduledDate ? new Date(wo.scheduledDate) : null,
            price: wo.price || null,
            recurringType: 'ONCE',
            occurrenceIndex: null,
            order: orderIndex++,
          })
        } else {
          // Calculate number of occurrences based on contract duration
          const monthsBetween = Math.max(1, Math.ceil((projectEndDate.getTime() - baseDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
          const interval = recurringType === 'MONTHLY' ? 1 : 3
          const occurrences = Math.ceil(monthsBetween / interval)

          // Create recurring work orders
          for (let i = 0; i < occurrences; i++) {
            const occurrenceDate = new Date(baseDate)
            occurrenceDate.setMonth(occurrenceDate.getMonth() + (i * interval))
            
            // Don't create if past end date
            if (occurrenceDate > projectEndDate) break

            generatedWorkOrders.push({
              name: `${wo.name} (${recurringType === 'MONTHLY' ? 'Month' : 'Q'}${i + 1})`,
              notes: wo.description || null,
              scheduledDate: occurrenceDate,
              price: wo.price || null,
              recurringType,
              occurrenceIndex: i + 1,
              order: orderIndex++,
            })
          }
        }
      }
    }

    // Calculate total value from ALL generated work orders (including recurring)
    const totalValue = generatedWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0)

    // Create the project with correct total
    const project = await prisma.project.create({
      data: {
        branchId,
        title,
        description,
        priority: 'MEDIUM',
        totalValue,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        autoRenew: autoRenew || false,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
      },
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

    // Create checklist with work orders if we have any
    if (generatedWorkOrders.length > 0) {
      const checklist = await prisma.checklist.create({
        data: {
          branchId,
          projectId: project.id,
          title: `${title} - Work Orders`,
          description: 'Work orders for this project',
          status: 'DRAFT',
          createdById: session.user.id,
        }
      })

      // Create checklist items from generated work orders
      const checklistItems = generatedWorkOrders.map(wo => ({
        checklistId: checklist.id,
        description: wo.name,
        notes: wo.notes,
        scheduledDate: wo.scheduledDate,
        price: wo.price,
        stage: 'SCHEDULED' as const,
        type: 'SCHEDULED' as const,
        recurringType: wo.recurringType,
        parentItemId: null,
        occurrenceIndex: wo.occurrenceIndex,
        order: wo.order,
      }))

      await prisma.checklistItem.createMany({
        data: checklistItems
      })
    }

    // If created from a request, link the request to this project
    if (requestId) {
      await prisma.request.update({
        where: { id: requestId },
        data: { projectId: project.id }
      })

      // Add activity
      await prisma.activity.create({
        data: {
          projectId: project.id,
          type: 'CREATED',
          content: `Project created from request`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
        }
      })
    } else {
      // Auto-generate a Request for client review (Project Proposal)
      await prisma.request.create({
        data: {
          branchId,
          projectId: project.id,
          title: `Project Proposal: ${title}`,
          description: description || `New project proposal for review.`,
          priority: 'MEDIUM',
          status: 'REQUESTED',
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
        }
      })

      // Add activity
      await prisma.activity.create({
        data: {
          projectId: project.id,
          type: 'CREATED',
          content: `Project created with ${generatedWorkOrders.length} work orders. Total value: SAR ${totalValue.toFixed(2)}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
        }
      })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
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
