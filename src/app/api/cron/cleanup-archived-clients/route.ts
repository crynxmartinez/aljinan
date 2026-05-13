import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint should be called by Vercel Cron
// Configure in vercel.json: "crons": [{ "path": "/api/cron/cleanup-archived-clients", "schedule": "0 2 * * *" }]

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (optional security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate 90 days ago
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Find clients archived more than 90 days ago
    const clientsToDelete = await prisma.client.findMany({
      where: {
        user: {
          status: 'ARCHIVED'
        },
        archivedAt: {
          lte: ninetyDaysAgo
        }
      },
      include: {
        user: true,
        contractor: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        branches: {
          include: {
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

    if (clientsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No clients to delete',
        deleted: 0
      })
    }

    const deletedClients = []

    // Delete each client
    for (const client of clientsToDelete) {
      const totalBranches = client.branches.length
      const totalInvoices = client.branches.reduce((sum, b) => sum + b._count.invoices, 0)
      const totalContracts = client.branches.reduce((sum, b) => sum + b._count.contracts, 0)
      const totalChecklists = client.branches.reduce((sum, b) => sum + b._count.checklists, 0)

      // Delete the client (cascade will handle related data)
      await prisma.client.delete({
        where: { id: client.id }
      })

      deletedClients.push({
        clientName: client.companyName,
        archivedAt: client.archivedAt,
        contractorEmail: client.contractor.user.email,
        contractorName: client.contractor.user.name,
        dataDeleted: {
          branches: totalBranches,
          invoices: totalInvoices,
          contracts: totalContracts,
          workOrders: totalChecklists,
        }
      })

      // TODO: Send email notification to contractor
      // await sendDeletionNotification({
      //   to: client.contractor.user.email,
      //   clientName: client.companyName,
      //   archivedAt: client.archivedAt,
      //   deletedData: { ... }
      // })
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedClients.length} archived clients`,
      deleted: deletedClients.length,
      clients: deletedClients
    })
  } catch (error) {
    console.error('Error in cleanup cron:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup archived clients' },
      { status: 500 }
    )
  }
}
