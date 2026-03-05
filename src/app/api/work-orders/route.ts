import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors and team members can access this endpoint
    if (session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let workOrders

    if (session.user.role === 'CONTRACTOR') {
      // First get the contractor record to get the contractor ID
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id }
      })

      if (!contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
      }

      // Get all work orders for contractor's clients
      workOrders = await prisma.checklistItem.findMany({
        where: {
          checklist: {
            branch: {
              client: {
                contractorId: contractor.id
              }
            }
          }
        },
        include: {
          checklist: {
            include: {
              branch: {
                include: {
                  client: true
                }
              },
              project: true
            }
          }
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { createdAt: 'desc' }
        ]
      })
    } else {
      // Team member - get work orders for assigned branches
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId: session.user.id },
        include: {
          branchAccess: true
        }
      })

      const branchIds = teamMember?.branchAccess.map(ba => ba.branchId) || []

      workOrders = await prisma.checklistItem.findMany({
        where: {
          checklist: {
            branchId: { in: branchIds }
          }
        },
        include: {
          checklist: {
            include: {
              branch: {
                include: {
                  client: true
                }
              },
              project: true
            }
          }
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { createdAt: 'desc' }
        ]
      })
    }

    // Transform to flat structure
    const transformedWorkOrders = workOrders.map(wo => ({
      id: wo.id,
      description: wo.description,
      stage: wo.stage,
      workOrderType: wo.workOrderType,
      scheduledDate: wo.scheduledDate?.toISOString() || null,
      price: wo.price,
      clientName: wo.checklist.branch.client.companyName,
      branchName: wo.checklist.branch.name,
      branchId: wo.checklist.branchId,
      clientId: wo.checklist.branch.clientId,
      projectTitle: wo.checklist.project?.title || null,
      isCompleted: wo.isCompleted,
      paymentStatus: wo.paymentStatus,
      recurringType: wo.recurringType,
    }))

    return NextResponse.json(transformedWorkOrders)
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}
