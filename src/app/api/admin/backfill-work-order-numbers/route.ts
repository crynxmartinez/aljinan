import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admins to run this
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      contractorsProcessed: 0,
      workOrdersUpdated: 0,
      details: [] as any[]
    }

    // Get all contractors
    const contractors = await prisma.contractor.findMany({
      select: {
        id: true,
        companyName: true,
        nextWorkOrderNumber: true,
      }
    })

    for (const contractor of contractors) {
      // Get all work orders for this contractor's clients that have null workOrderNumber
      const workOrdersWithoutNumbers = await prisma.checklistItem.findMany({
        where: {
          workOrderNumber: null,
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
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc' // Assign numbers in chronological order
        }
      })

      if (workOrdersWithoutNumbers.length === 0) {
        continue // Skip contractors with no work orders needing numbers
      }

      // Start numbering from current counter
      let currentNumber = contractor.nextWorkOrderNumber

      const updatedWorkOrders = []

      // Assign numbers to each work order
      for (const workOrder of workOrdersWithoutNumbers) {
        await prisma.checklistItem.update({
          where: { id: workOrder.id },
          data: { workOrderNumber: currentNumber }
        })

        updatedWorkOrders.push({
          id: workOrder.id,
          description: workOrder.description,
          assignedNumber: currentNumber,
          clientName: workOrder.checklist.branch.client.companyName,
          branchName: workOrder.checklist.branch.name
        })

        currentNumber++
        results.workOrdersUpdated++
      }

      // Update contractor's counter to next available number
      await prisma.contractor.update({
        where: { id: contractor.id },
        data: { nextWorkOrderNumber: currentNumber }
      })

      results.contractorsProcessed++
      results.details.push({
        contractorName: contractor.companyName,
        workOrdersAssigned: workOrdersWithoutNumbers.length,
        numberRange: `${contractor.nextWorkOrderNumber} - ${currentNumber - 1}`,
        newCounter: currentNumber,
        workOrders: updatedWorkOrders
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Work order numbers backfilled successfully',
      ...results
    })
  } catch (error) {
    console.error('Error backfilling work order numbers:', error)
    return NextResponse.json(
      { error: 'Failed to backfill work order numbers' },
      { status: 500 }
    )
  }
}
