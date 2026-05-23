import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

// PATCH - Update a contract payment (submit proof or verify)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, paymentId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify payment belongs to a contract in this branch
    const payment = await prisma.contractPayment.findFirst({
      where: {
        id: paymentId,
        contract: { branchId }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Client submitting payment proof
    if (body.action === 'submit_proof') {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can submit payment proof' }, { status: 403 })
      }

      const { paymentProofUrl, paymentProofType, paymentProofFileName } = body

      if (!paymentProofUrl) {
        return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 })
      }

      const updated = await prisma.contractPayment.update({
        where: { id: paymentId },
        data: {
          paymentProofUrl,
          paymentProofType: paymentProofType || 'TRANSFER',
          paymentProofFileName: paymentProofFileName || null,
          paymentSubmittedAt: new Date(),
          status: 'PENDING_VERIFICATION'
        }
      })

      return NextResponse.json(updated)
    }

    // Contractor verifying payment
    if (body.action === 'verify') {
      if (session.user.role !== 'CONTRACTOR') {
        return NextResponse.json({ error: 'Only contractors can verify payments' }, { status: 403 })
      }

      const { approved } = body

      if (approved) {
        const updated = await prisma.contractPayment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        })
        return NextResponse.json(updated)
      } else {
        // Rejected - reset to pending
        const updated = await prisma.contractPayment.update({
          where: { id: paymentId },
          data: {
            status: 'PENDING',
            paymentProofUrl: null,
            paymentProofType: null,
            paymentProofFileName: null,
            paymentSubmittedAt: null
          }
        })
        return NextResponse.json(updated)
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating contract payment:', error)
    return NextResponse.json(
      { error: 'Failed to update contract payment' },
      { status: 500 }
    )
  }
}
