import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single contract
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, contractId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, branchId }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

// PATCH - Update a contract (contractor can update, client can sign)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, contractId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle client signing
    if (body.action === 'sign') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can sign contracts' }, { status: 403 })
      }

      const { signatureUrl } = body
      if (!signatureUrl) {
        return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
      }

      const updated = await prisma.contract.update({
        where: { id: contractId },
        data: {
          signatureUrl,
          signedById: session.user.id,
          signedAt: new Date(),
          status: 'SIGNED'
        }
      })

      return NextResponse.json(updated)
    }

    // Regular update (contractor only)
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can update contracts' }, { status: 403 })
    }

    const { title, description, startDate, endDate, status, fileName, fileUrl, fileSize } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (status !== undefined) updateData.status = status
    if (fileName !== undefined) updateData.fileName = fileName
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl
    if (fileSize !== undefined) updateData.fileSize = fileSize

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a contract (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete contracts' }, { status: 403 })
    }

    const { branchId, contractId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.contract.delete({
      where: { id: contractId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Failed to delete contract' },
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
