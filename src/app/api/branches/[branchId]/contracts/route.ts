import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContractSystemFrequency } from '@prisma/client'

// GET - Fetch all contracts for a branch
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

    // For clients, only show ACTIVE contracts (not DRAFT)
    const whereClause = session.user.role === 'CLIENT'
      ? { branchId, status: { not: 'DRAFT' as const } }
      : { branchId }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        checklist: {
          include: {
            items: true
          }
        },
        systems: {
          orderBy: { order: 'asc' }
        },
        payments: {
          orderBy: { paymentNo: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

// Type for system input
interface SystemInput {
  name: string
  description?: string
  frequency: ContractSystemFrequency
  visitDates: string[]
  dateMode?: 'MANUAL' | 'AUTOMATIC'
  paymentDueDates?: string[]
  paymentDateMode?: 'AUTOMATIC' | 'MANUAL'
}

// Type for payment input
interface PaymentInput {
  paymentNo: number
  dueDate?: string
  amount?: number
}

// POST - Create a new contract (contractor only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create contracts' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()
    const {
      title,
      description,
      fileName,
      fileUrl,
      fileSize,
      startDate,
      endDate,
      autoRenew,
      status,
      systems,
      payments
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create contract with systems and payments in a transaction
    const contract = await prisma.$transaction(async (tx) => {
      // Create the contract
      const newContract = await tx.contract.create({
        data: {
          branchId,
          title,
          description: description || null,
          fileName: fileName || null,
          fileUrl: fileUrl || null,
          fileSize: fileSize || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          autoRenew: autoRenew || false,
          status: status || 'DRAFT',
          createdById: session.user.id,
        }
      })

      // Create systems if provided
      if (systems && Array.isArray(systems) && systems.length > 0) {
        await tx.contractSystem.createMany({
          data: systems.map((system: SystemInput, index: number) => ({
            contractId: newContract.id,
            name: system.name,
            description: system.description || null,
            frequency: system.frequency,
            visitDates: system.visitDates || [],
            dateMode: system.dateMode || 'MANUAL',
            paymentDueDates: system.paymentDueDates || [],
            paymentDateMode: system.paymentDateMode || 'AUTOMATIC',
            order: index
          }))
        })
      }

      // Create payments if provided
      if (payments && Array.isArray(payments) && payments.length > 0) {
        await tx.contractPayment.createMany({
          data: payments.map((payment: PaymentInput, index: number) => ({
            contractId: newContract.id,
            paymentNo: payment.paymentNo || index + 1,
            dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
            amount: payment.amount || null,
            order: index
          }))
        })
      }

      // Fetch the complete contract with relations
      return tx.contract.findUnique({
        where: { id: newContract.id },
        include: {
          systems: { orderBy: { order: 'asc' } },
          payments: { orderBy: { paymentNo: 'asc' } }
        }
      })
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
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
