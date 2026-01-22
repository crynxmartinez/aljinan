import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all action center data (delayed work orders, expiring equipment, expiring contracts)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Get branches the user has access to
    let branchIds: string[] = []
    let branchMap: Map<string, { name: string; clientId: string; clientName: string }> = new Map()

    if (session.user.role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id },
        include: {
          clients: {
            where: {
              user: {
                status: { not: 'ARCHIVED' }
              }
            },
            include: {
              branches: {
                where: { isActive: true },
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      if (contractor) {
        contractor.clients.forEach(client => {
          client.branches.forEach(branch => {
            branchIds.push(branch.id)
            branchMap.set(branch.id, {
              name: branch.name,
              clientId: client.id,
              clientName: client.companyName
            })
          })
        })
      }
    } else if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        include: {
          branches: {
            where: { isActive: true },
            select: { id: true, name: true }
          }
        }
      })

      if (client) {
        client.branches.forEach(branch => {
          branchIds.push(branch.id)
          branchMap.set(branch.id, {
            name: branch.name,
            clientId: client.id,
            clientName: client.companyName
          })
        })
      }
    }

    if (branchIds.length === 0) {
      return NextResponse.json({
        delayedWorkOrders: [],
        expiringEquipment: [],
        expiringContracts: [],
      })
    }

    // 1. Fetch Delayed Work Orders
    // Work orders where scheduledDate < today AND stage is not COMPLETED
    const delayedWorkOrders = await prisma.checklistItem.findMany({
      where: {
        checklist: {
          branchId: { in: branchIds }
        },
        scheduledDate: { lt: now },
        stage: { notIn: ['COMPLETED', 'FOR_REVIEW'] },
      },
      include: {
        checklist: {
          select: {
            branchId: true,
            project: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    const transformedDelayedWorkOrders = delayedWorkOrders.map(wo => {
      const branchInfo = branchMap.get(wo.checklist.branchId)
      const daysOverdue = Math.floor((now.getTime() - new Date(wo.scheduledDate!).getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: wo.id,
        description: wo.description,
        scheduledDate: wo.scheduledDate?.toISOString() || '',
        daysOverdue,
        assignedTo: null, // Could be enhanced to track assigned technician
        branchId: wo.checklist.branchId,
        branchName: branchInfo?.name || 'Unknown',
        clientId: branchInfo?.clientId || '',
        clientName: branchInfo?.clientName || 'Unknown',
      }
    })

    // 2. Fetch Expiring Equipment
    const expiringEquipment = await prisma.equipment.findMany({
      where: {
        branchId: { in: branchIds },
        expectedExpiry: { lte: thirtyDaysFromNow }
      },
      orderBy: { expectedExpiry: 'asc' }
    })

    const transformedExpiringEquipment = expiringEquipment.map(eq => {
      const branchInfo = branchMap.get(eq.branchId)
      const isExpired = eq.expectedExpiry ? eq.expectedExpiry < now : false
      const daysLeft = eq.expectedExpiry 
        ? Math.ceil((eq.expectedExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: eq.id,
        equipmentNumber: eq.equipmentNumber,
        equipmentType: eq.equipmentType,
        location: eq.location,
        expectedExpiry: eq.expectedExpiry?.toISOString() || null,
        daysLeft: Math.max(0, daysLeft),
        isExpired,
        branchId: eq.branchId,
        branchName: branchInfo?.name || 'Unknown',
        clientId: branchInfo?.clientId || '',
        clientName: branchInfo?.clientName || 'Unknown',
      }
    })

    // 3. Fetch Expiring Contracts (Contractor only, but we'll return empty for clients)
    let transformedExpiringContracts: {
      id: string
      title: string
      endDate: string | null
      daysLeft: number
      isExpired: boolean
      autoRenew: boolean
      branchId: string
      branchName: string
      clientId: string
      clientName: string
    }[] = []

    if (session.user.role === 'CONTRACTOR') {
      const expiringContracts = await prisma.contract.findMany({
        where: {
          branchId: { in: branchIds },
          status: { in: ['SIGNED', 'PENDING_SIGNATURE'] },
          endDate: { lte: thirtyDaysFromNow }
        },
        include: {
          project: {
            select: {
              autoRenew: true
            }
          }
        },
        orderBy: { endDate: 'asc' }
      })

      transformedExpiringContracts = expiringContracts.map(contract => {
        const branchInfo = branchMap.get(contract.branchId)
        const isExpired = contract.endDate ? contract.endDate < now : false
        const daysLeft = contract.endDate 
          ? Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        return {
          id: contract.id,
          title: contract.title,
          endDate: contract.endDate?.toISOString() || null,
          daysLeft: Math.max(0, daysLeft),
          isExpired,
          autoRenew: contract.project?.autoRenew || false,
          branchId: contract.branchId,
          branchName: branchInfo?.name || 'Unknown',
          clientId: branchInfo?.clientId || '',
          clientName: branchInfo?.clientName || 'Unknown',
        }
      })
    }

    return NextResponse.json({
      delayedWorkOrders: transformedDelayedWorkOrders,
      expiringEquipment: transformedExpiringEquipment,
      expiringContracts: transformedExpiringContracts,
    })
  } catch (error) {
    console.error('Error fetching action center data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action center data' },
      { status: 500 }
    )
  }
}
