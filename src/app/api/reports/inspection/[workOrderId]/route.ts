import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PDF generation endpoint - returns JSON data for now
// Full PDF generation will be implemented when schema is synced
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workOrderId } = await params

    // Fetch the work order with related data
    const workOrder = await prisma.checklistItem.findUnique({
      where: { id: workOrderId },
      include: {
        checklist: {
          include: {
            project: {
              include: {
                branch: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (!workOrder.checklist.project) {
      return NextResponse.json({ error: 'Work order has no associated project' }, { status: 404 })
    }

    // Get contractor info
    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    // Return report data as JSON (PDF generation to be added)
    const reportData = {
      reportNumber: `INS-${workOrder.id.slice(0, 8).toUpperCase()}`,
      generatedDate: new Date().toISOString(),
      contractor: {
        name: contractor?.companyName || 'Al Jinan Fire & Safety',
        address: contractor?.companyAddress || '',
        phone: contractor?.companyPhone || '',
        email: contractor?.companyEmail || contractor?.user?.email || '',
      },
      client: {
        name: workOrder.checklist.project.branch.client.companyName,
        branch: workOrder.checklist.project.branch.name,
        address: workOrder.checklist.project.branch.address || '',
      },
      workOrder: {
        id: workOrder.id,
        description: workOrder.description,
        scheduledDate: workOrder.scheduledDate?.toISOString() || null,
        notes: workOrder.notes,
        stage: workOrder.stage,
      },
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating inspection report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
