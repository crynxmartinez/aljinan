import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractors = await prisma.contractor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
        clients: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                status: true,
              },
            },
            branches: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Gather stats for each contractor
    const contractorsWithStats = await Promise.all(
      contractors.map(async (contractor) => {
        const clientIds = contractor.clients.map((c) => c.id)
        const branchIds = contractor.clients.flatMap((c) =>
          c.branches.map((b) => b.id)
        )

        const [requestCount, workOrderCount, openRequestCount, activeWoCount] =
          await Promise.all([
            branchIds.length > 0
              ? prisma.request.count({
                  where: { branchId: { in: branchIds } },
                })
              : Promise.resolve(0),
            branchIds.length > 0
              ? prisma.checklistItem.count({
                  where: {
                    checklist: {
                      project: { branchId: { in: branchIds } },
                    },
                  },
                })
              : Promise.resolve(0),
            branchIds.length > 0
              ? prisma.request.count({
                  where: {
                    branchId: { in: branchIds },
                    status: { in: ['REQUESTED', 'QUOTED'] },
                  },
                })
              : Promise.resolve(0),
            branchIds.length > 0
              ? prisma.checklistItem.count({
                  where: {
                    checklist: {
                      project: { branchId: { in: branchIds } },
                    },
                    stage: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                  },
                })
              : Promise.resolve(0),
          ])

        return {
          id: contractor.id,
          userId: contractor.user.id,
          companyName: contractor.companyName,
          companyPhone: contractor.companyPhone,
          companyEmail: contractor.companyEmail,
          email: contractor.user.email,
          name: contractor.user.name,
          status: contractor.user.status,
          createdAt: contractor.user.createdAt.toISOString(),
          clients: contractor.clients.map((client) => ({
            id: client.id,
            userId: client.user.id,
            companyName: client.companyName,
            email: client.user.email,
            name: client.user.name,
            status: client.user.status,
            branchCount: client.branches.length,
            branches: client.branches,
          })),
          stats: {
            clientCount: contractor.clients.length,
            branchCount: branchIds.length,
            totalRequests: requestCount,
            openRequests: openRequestCount,
            totalWorkOrders: workOrderCount,
            activeWorkOrders: activeWoCount,
          },
        }
      })
    )

    return NextResponse.json(contractorsWithStats)
  } catch (error) {
    console.error('Error fetching contractors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contractors' },
      { status: 500 }
    )
  }
}
