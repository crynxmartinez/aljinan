import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json({ error: 'branchId required' }, { status: 400 })
    }

    // Get ALL checklist items for this branch with full details
    const items = await prisma.checklistItem.findMany({
      where: {
        checklist: {
          branchId
        },
        deletedAt: null
      },
      include: {
        checklist: {
          select: {
            id: true,
            contractId: true,
            branchId: true,
            title: true,
            contract: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Get all contracts for this branch
    const contracts = await prisma.contract.findMany({
      where: { branchId },
      select: {
        id: true,
        title: true,
        status: true
      }
    })

    return NextResponse.json({
      branchId,
      totalItems: items.length,
      contracts,
      items: items.map(item => ({
        id: item.id.slice(0, 8),
        description: item.description,
        stage: item.stage,
        checklistId: item.checklistId.slice(0, 8),
        checklistTitle: item.checklist.title,
        checklistContractId: item.checklist.contractId?.slice(0, 8) || 'NULL',
        contractTitle: item.checklist.contract?.title || 'NULL',
        contractStatus: item.checklist.contract?.status || 'NULL',
        linkedRequestId: item.linkedRequestId?.slice(0, 8) || 'NULL',
        createdAt: item.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 })
  }
}
