import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch activities for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    const activities = await prisma.activity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Fetch user names for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await prisma.user.findUnique({
          where: { id: activity.createdById },
          select: { name: true, email: true }
        })
        return {
          ...activity,
          createdByName: user?.name || user?.email || 'Unknown User'
        }
      })
    )

    return NextResponse.json(activitiesWithUsers)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST - Add a comment/activity to a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const activity = await prisma.activity.create({
      data: {
        projectId,
        type: 'COMMENT',
        content,
        createdById: session.user.id,
        createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'MANAGER',
      }
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
