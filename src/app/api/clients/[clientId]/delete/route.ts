import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromS3ByKey } from '@/lib/s3'
import { logAuditEvent } from '@/lib/audit-log'

/**
 * Permanently delete a client and everything under it.
 *
 * Three things were wrong with this before.
 *
 * The cascade runs from Client, but the User row hangs off it in the other direction and
 * survived. The account still authenticated, landed in the portal, found no client record
 * and was bounced back to the login screen while holding a valid session. Deleting the User
 * instead removes both, because Client cascades from User.
 *
 * It could be called on a live client with no warning and no intermediate state. It now
 * requires the client to be archived first, which gives the operator a reversible step and
 * a chance to notice.
 *
 * And it left every uploaded file behind in object storage, unreferenced and unreachable.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        contractorId: contractor.id,
      },
      include: {
        user: { select: { id: true, email: true, status: true } },
        branches: {
          select: {
            id: true,
            _count: {
              select: {
                requests: true,
                invoices: true,
                contracts: true,
                checklists: true,
                equipment: true,
              }
            }
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Archiving is the reversible step. Requiring it means a permanent delete is always a
    // second, deliberate action rather than one click on a live account.
    if (client.user.status !== 'ARCHIVED') {
      return NextResponse.json(
        {
          error:
            'Archive this client before deleting it. Archiving is reversible; deleting is not.',
        },
        { status: 409 }
      )
    }

    const totals = {
      branches: client.branches.length,
      requests: client.branches.reduce((sum, b) => sum + b._count.requests, 0),
      invoices: client.branches.reduce((sum, b) => sum + b._count.invoices, 0),
      contracts: client.branches.reduce((sum, b) => sum + b._count.contracts, 0),
      checklists: client.branches.reduce((sum, b) => sum + b._count.checklists, 0),
      equipment: client.branches.reduce((sum, b) => sum + b._count.equipment, 0),
    }

    // Collect the object keys before the rows that reference them are gone.
    const branchIds = client.branches.map(b => b.id)
    const uploads = branchIds.length
      ? await prisma.upload.findMany({
          where: { branchId: { in: branchIds }, deletedAt: null },
          select: { id: true, key: true },
        })
      : []

    // Record what is about to happen while the detail is still available.
    await logAuditEvent({
      eventType: 'CLIENT_ARCHIVED',
      userId: session.user.id,
      userRole: session.user.role as never,
      userEmail: session.user.email ?? undefined,
      resourceType: 'Client',
      resourceId: clientId,
      action: 'Client permanently deleted',
      details: {
        companyName: client.companyName,
        clientEmail: client.user.email,
        archivedAt: client.archivedAt?.toISOString() ?? null,
        ...totals,
        filesRemoved: uploads.length,
      },
      success: true,
    })

    // Deleting the User cascades to Client and everything below it, and leaves no orphaned
    // login behind.
    await prisma.user.delete({ where: { id: client.user.id } })

    // Storage last: if a delete fails here the database is already consistent, and a stray
    // object is a smaller problem than a half-deleted tenant. Failures are logged, not
    // thrown, for the same reason.
    let filesRemoved = 0
    for (const upload of uploads) {
      try {
        await deleteFromS3ByKey(upload.key)
        filesRemoved++
      } catch (error) {
        console.error(`Failed to remove object ${upload.key} for deleted client ${clientId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        client: client.companyName,
        ...totals,
        filesRemoved,
        filesOrphaned: uploads.length - filesRemoved,
      }
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
