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

// GET - Fetch all contract payments for a branch
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

    // Fetch all contracts with their payments for this branch
    const contracts = await prisma.contract.findMany({
      where: { branchId },
      include: {
        payments: {
          orderBy: { paymentNo: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to flat payment list with contract info
    const payments = contracts.flatMap(contract =>
      contract.payments.map(payment => ({
        id: payment.id,
        contractId: contract.id,
        contractTitle: contract.title,
        paymentNo: payment.paymentNo,
        dueDate: payment.dueDate?.toISOString() || null,
        amount: payment.amount,
        status: payment.status,
        paymentProofUrl: payment.paymentProofUrl,
        paymentProofType: payment.paymentProofType,
        paymentProofFileName: payment.paymentProofFileName,
        paymentSubmittedAt: payment.paymentSubmittedAt?.toISOString() || null,
        paidAt: payment.paidAt?.toISOString() || null
      }))
    )

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching contract payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract payments' },
      { status: 500 }
    )
  }
}
