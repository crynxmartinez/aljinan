import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Work orders for the signed-in user's whole tenant, flattened for the list views.
 *
 * Two things were wrong here. The query had no bound at all, so the response grew linearly
 * with the tenant forever. And it used `include` to pull branch, client and the *entire*
 * contractor record for every row, when the response only ever exposes a company name from
 * each — so the database returned, and the server serialised, several kilobytes per row of
 * data nobody reads.
 *
 * The response shape is unchanged. Both consumers (the contractor and portal work-order
 * pages) filter and paginate client-side over the full array, so this stays a single
 * request; the bound is a ceiling that prevents an unbounded response rather than a page
 * size. `hasMore` tells the caller the ceiling was hit.
 */

/** Ceiling on rows returned. Generous for a real tenant, finite for the server. */
const MAX_ROWS = 1000

/** Exactly the fields the flattened response exposes, and nothing else. */
const WORK_ORDER_SELECT = {
  id: true,
  description: true,
  stage: true,
  workOrderType: true,
  workOrderNumber: true,
  scheduledDate: true,
  price: true,
  isCompleted: true,
  paymentStatus: true,
  recurringType: true,
  checklist: {
    select: {
      branchId: true,
      contract: { select: { title: true } },
      branch: {
        select: {
          name: true,
          clientId: true,
          client: {
            select: {
              companyName: true,
              contractor: { select: { companyName: true } },
            },
          },
        },
      },
    },
  },
} as const

const ORDER_BY = [
  { scheduledDate: 'asc' },
  { createdAt: 'desc' },
] as const

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let workOrders

    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      workOrders = await prisma.checklistItem.findMany({
        where: {
          deletedAt: null,
          checklist: { branch: { clientId: client.id } },
        },
        select: WORK_ORDER_SELECT,
        orderBy: [...ORDER_BY],
        take: MAX_ROWS + 1,
      })
    } else if (session.user.role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
      }

      workOrders = await prisma.checklistItem.findMany({
        where: {
          deletedAt: null,
          checklist: { branch: { client: { contractorId: contractor.id } } },
        },
        select: WORK_ORDER_SELECT,
        orderBy: [...ORDER_BY],
        take: MAX_ROWS + 1,
      })
    } else if (session.user.role === 'TEAM_MEMBER') {
      // Team members see only the branches they are assigned to.
      const assignments = await prisma.teamMemberBranch.findMany({
        where: { teamMember: { userId: session.user.id } },
        select: { branchId: true },
      })

      workOrders = await prisma.checklistItem.findMany({
        where: {
          deletedAt: null,
          checklist: { branchId: { in: assignments.map(a => a.branchId) } },
        },
        select: WORK_ORDER_SELECT,
        orderBy: [...ORDER_BY],
        take: MAX_ROWS + 1,
      })
    } else {
      // Platform admins operate through the admin console, not tenant data.
      return NextResponse.json([])
    }

    // One row over the ceiling was fetched purely to detect truncation.
    const hasMore = workOrders.length > MAX_ROWS
    const page = hasMore ? workOrders.slice(0, MAX_ROWS) : workOrders

    const transformedWorkOrders = page.map(wo => ({
      id: wo.id,
      description: wo.description,
      stage: wo.stage,
      workOrderType: wo.workOrderType,
      workOrderNumber: wo.workOrderNumber,
      scheduledDate: wo.scheduledDate?.toISOString() || null,
      price: wo.price,
      clientName: wo.checklist.branch.client?.companyName || '',
      branchName: wo.checklist.branch.name,
      branchId: wo.checklist.branchId,
      clientId: wo.checklist.branch.clientId,
      contractTitle: wo.checklist.contract?.title || null,
      isCompleted: wo.isCompleted,
      paymentStatus: wo.paymentStatus,
      recurringType: wo.recurringType,
      contractorName: wo.checklist.branch.client?.contractor?.companyName || '',
    }))

    if (hasMore) {
      console.warn(
        `Work order list truncated at ${MAX_ROWS} rows for user ${session.user.id}. ` +
          'This endpoint needs real pagination before a tenant reaches this size.'
      )
    }

    // Kept as a bare array: both callers treat the response as one. The header carries the
    // truncation signal without changing the shape.
    return NextResponse.json(transformedWorkOrders, {
      headers: {
        'X-Total-Returned': String(transformedWorkOrders.length),
        'X-Has-More': String(hasMore),
      },
    })
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}
