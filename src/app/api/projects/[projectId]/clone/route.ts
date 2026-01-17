import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new project from an existing project template
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
    const { title, startDate, endDate, autoRenew } = body

    // Get the template project with its work orders
    const templateProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        checklists: {
          include: {
            items: true
          }
        }
      }
    })

    if (!templateProject) {
      return NextResponse.json({ error: 'Template project not found' }, { status: 404 })
    }

    // Check for existing ACTIVE project on this branch
    const activeProject = await prisma.project.findFirst({
      where: {
        branchId: templateProject.branchId,
        status: 'ACTIVE'
      }
    })

    if (activeProject) {
      return NextResponse.json(
        { error: 'This branch already has an active project. Complete or close the existing project before creating a new one.' },
        { status: 400 }
      )
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the new project
      const newProject = await tx.project.create({
        data: {
          branchId: templateProject.branchId,
          title: title || `${templateProject.title} (Renewal)`,
          description: templateProject.description,
          priority: templateProject.priority,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          autoRenew: autoRenew !== undefined ? autoRenew : templateProject.autoRenew,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      // 2. Clone checklists and work orders
      for (const checklist of templateProject.checklists) {
        const newChecklist = await tx.checklist.create({
          data: {
            branchId: templateProject.branchId,
            projectId: newProject.id,
            title: checklist.title,
            description: checklist.description,
            status: 'DRAFT',
            createdById: session.user.id,
          }
        })

        // Clone work orders (only scheduled ones, not ad-hoc)
        for (const item of checklist.items) {
          if (item.type === 'SCHEDULED') {
            await tx.checklistItem.create({
              data: {
                checklistId: newChecklist.id,
                description: item.description,
                notes: item.notes,
                stage: 'REQUESTED',
                type: 'SCHEDULED',
                price: item.price,
                order: item.order,
              }
            })
          }
        }
      }

      // 3. Create a request for client review
      await tx.request.create({
        data: {
          branchId: templateProject.branchId,
          projectId: newProject.id,
          title: `Project Renewal: ${newProject.title}`,
          description: `Renewal of previous contract. Please review the work orders and pricing.`,
          priority: templateProject.priority,
          status: 'OPEN',
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      // 4. Add activity
      await tx.activity.create({
        data: {
          projectId: newProject.id,
          type: 'CREATED',
          content: `Project created from template: ${templateProject.title}`,
          createdById: session.user.id,
          createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
        }
      })

      return newProject
    })

    return NextResponse.json({
      success: true,
      message: 'Project created from template',
      project: result
    }, { status: 201 })
  } catch (error) {
    console.error('Error cloning project:', error)
    return NextResponse.json(
      { error: 'Failed to create project from template' },
      { status: 500 }
    )
  }
}
