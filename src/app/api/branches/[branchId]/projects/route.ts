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
      // Calculate total value from checklist items (work orders)
      const workOrders = project.checklists.flatMap(checklist => 
        checklist.items.map(item => ({
          id: item.id,
          title: item.description,
          description: item.notes,
          scheduledDate: null, // Will be updated when we add scheduling
          status: item.isCompleted ? 'COMPLETED' : 'SCHEDULED',
          type: 'scheduled' as const,
          price: null // Will be updated when we add pricing
        }))
      )

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.createdAt,
        endDate: project.completedAt,
        totalValue: 0, // Will be calculated from quotations
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

// POST - Create a new project
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
    const { title, description, priority, requestId, startDate, endDate, autoRenew } = body

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

    // Create the project
    const project = await prisma.project.create({
      data: {
        branchId,
        title,
        description,
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        autoRenew: autoRenew || false,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
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
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })
    } else {
      // Auto-generate a Request for client review (Project Proposal)
      await prisma.request.create({
        data: {
          branchId,
          projectId: project.id,
          title: `Project Proposal: ${title}`,
          description: description || `New project proposal for review. Please review the work orders and pricing, then proceed to quotation when ready.`,
          priority: priority || 'MEDIUM',
          status: 'OPEN',
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      // Add activity
      await prisma.activity.create({
        data: {
          projectId: project.id,
          type: 'CREATED',
          content: `Project created with proposal request for client review`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
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
  } else if (role === 'MANAGER') {
    const manager = await prisma.manager.findUnique({
      where: { userId },
      include: { branchAccess: { where: { branchId } } }
    })
    return (manager?.branchAccess.length || 0) > 0
  }
  return false
}
