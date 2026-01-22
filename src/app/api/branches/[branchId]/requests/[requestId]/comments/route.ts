import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/branches/[branchId]/requests/[requestId]/comments - Get all comments for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params

    // Verify the request exists and belongs to this branch
    const serviceRequest = await prisma.request.findFirst({
      where: {
        id: requestId,
        branchId,
      },
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get all comments for this request
    const comments = await prisma.requestComment.findMany({
      where: {
        requestId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/branches/[branchId]/requests/[requestId]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, requestId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify the request exists and belongs to this branch
    const serviceRequest = await prisma.request.findFirst({
      where: {
        id: requestId,
        branchId,
      },
      include: {
        branch: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Create the comment
    const comment = await prisma.requestComment.create({
      data: {
        requestId,
        content: content.trim(),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // Create notification for the other party
    const isContractor = session.user.role === 'CONTRACTOR' || session.user.role === 'SUPERVISOR'
    
    if (isContractor) {
      // Notify the client
      const clientUserId = serviceRequest.branch.client?.userId
      if (clientUserId) {
        await prisma.notification.create({
          data: {
            userId: clientUserId,
            type: 'REQUEST_COMMENT',
            title: 'New Comment on Request',
            message: `New comment on "${serviceRequest.title}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            relatedId: requestId,
            relatedType: 'REQUEST',
            link: `/portal/branches/${branchId}?tab=requests`,
          },
        })
      }
    } else {
      // Notify the contractor (branch owner)
      // Find contractor user through branch -> client -> contractor relation
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          client: {
            include: {
              contractor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })
      
      const contractorUserId = branch?.client?.contractor?.userId
      if (contractorUserId) {
        await prisma.notification.create({
          data: {
            userId: contractorUserId,
            type: 'REQUEST_COMMENT',
            title: 'New Comment on Request',
            message: `New comment on "${serviceRequest.title}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            relatedId: requestId,
            relatedType: 'REQUEST',
            link: `/dashboard/clients/${serviceRequest.branch.clientId}/branches/${branchId}?tab=requests`,
          },
        })
      }
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// PATCH /api/branches/[branchId]/requests/[requestId]/comments - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params
    const body = await request.json()
    const { commentId, content } = body

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Find the comment and verify ownership
    const existingComment = await prisma.requestComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.createdById !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 })
    }

    if (existingComment.requestId !== requestId) {
      return NextResponse.json({ error: 'Comment does not belong to this request' }, { status: 400 })
    }

    // Update the comment
    const updatedComment = await prisma.requestComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
