import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single branch request
export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params

    const branchRequest = await prisma.branchRequest.findUnique({
      where: { id: requestId },
      include: {
        client: {
          select: {
            companyName: true,
            user: { select: { name: true, email: true } }
          }
        }
      }
    })

    if (!branchRequest) {
      return NextResponse.json({ error: 'Branch request not found' }, { status: 404 })
    }

    return NextResponse.json(branchRequest)
  } catch (error) {
    console.error('Error fetching branch request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branch request' },
      { status: 500 }
    )
  }
}

// PATCH - Update branch request (approve/reject by contractor)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can approve/reject branch requests' }, { status: 403 })
    }

    const { requestId } = await params
    const body = await request.json()
    const { action, rejectionNote } = body

    const branchRequest = await prisma.branchRequest.findUnique({
      where: { id: requestId },
      include: { client: true }
    })

    if (!branchRequest) {
      return NextResponse.json({ error: 'Branch request not found' }, { status: 404 })
    }

    // Verify contractor owns this client
    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: { clients: { where: { id: branchRequest.clientId } } }
    })

    if (!contractor || contractor.clients.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (action === 'approve') {
      // Create the actual branch
      const branch = await prisma.branch.create({
        data: {
          clientId: branchRequest.clientId,
          name: branchRequest.name,
          address: branchRequest.address,
          city: branchRequest.city,
          state: branchRequest.state,
          zipCode: branchRequest.zipCode,
          country: branchRequest.country,
          phone: branchRequest.phone,
          notes: branchRequest.notes,
          latitude: branchRequest.latitude,
          longitude: branchRequest.longitude,
        }
      })

      // Update the request status
      const updated = await prisma.branchRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: session.user.id,
        }
      })

      return NextResponse.json({ branchRequest: updated, branch })
    } else if (action === 'reject') {
      const updated = await prisma.branchRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedById: session.user.id,
          rejectionNote: rejectionNote || null,
        }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating branch request:', error)
    return NextResponse.json(
      { error: 'Failed to update branch request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a branch request (client can delete their own pending requests)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params

    const branchRequest = await prisma.branchRequest.findUnique({
      where: { id: requestId }
    })

    if (!branchRequest) {
      return NextResponse.json({ error: 'Branch request not found' }, { status: 404 })
    }

    // Only allow deletion of pending requests by the creator
    if (branchRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only delete pending requests' }, { status: 400 })
    }

    if (branchRequest.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.branchRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting branch request:', error)
    return NextResponse.json(
      { error: 'Failed to delete branch request' },
      { status: 500 }
    )
  }
}
