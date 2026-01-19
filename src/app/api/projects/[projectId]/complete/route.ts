import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Mark a project as DONE (when end date is reached)
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

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Project must be ACTIVE to mark as DONE' },
        { status: 400 }
      )
    }

    // Update project to DONE
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'DONE',
        completedAt: new Date()
      }
    })

    // Add activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'STATUS_CHANGE',
        content: `Project marked as DONE. Awaiting invoice payment.`,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Project marked as DONE',
      project: updatedProject
    })
  } catch (error) {
    console.error('Error completing project:', error)
    return NextResponse.json(
      { error: 'Failed to complete project' },
      { status: 500 }
    )
  }
}
