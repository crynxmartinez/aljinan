import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'

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
            branch: {
              include: {
                client: {
                  include: {
                    contractor: {
                      include: { user: { select: { email: true, name: true } } }
                    }
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

    if (!workOrder.checklist.branch) {
      return NextResponse.json({ error: 'Work order has no associated branch' }, { status: 404 })
    }

    const hasAccess = await verifyBranchAccess(
      workOrder.checklist.branchId,
      session.user.id,
      session.user.role
    )
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // The contractor named on the report is the one who owns the branch — not whoever
    // requested it. Looking it up by session id meant every client-requested report
    // fell back to a hardcoded company name.
    const contractor = workOrder.checklist.branch.client.contractor

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
        name: workOrder.checklist.branch.client.companyName,
        branch: workOrder.checklist.branch.name,
        address: workOrder.checklist.branch.address || '',
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
