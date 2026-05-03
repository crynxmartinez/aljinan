import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        user: true,
        branches: {
          include: {
            _count: {
              select: {
                projects: true,
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

    // Calculate total data to be deleted
    const totalBranches = client.branches.length
    const totalProjects = client.branches.reduce((sum, b) => sum + b._count.projects, 0)
    const totalRequests = client.branches.reduce((sum, b) => sum + b._count.requests, 0)
    const totalInvoices = client.branches.reduce((sum, b) => sum + b._count.invoices, 0)
    const totalContracts = client.branches.reduce((sum, b) => sum + b._count.contracts, 0)
    const totalChecklists = client.branches.reduce((sum, b) => sum + b._count.checklists, 0)
    const totalEquipment = client.branches.reduce((sum, b) => sum + b._count.equipment, 0)

    // Delete client (cascade will delete all related data)
    await prisma.client.delete({
      where: { id: clientId }
    })

    // Return summary of what was deleted
    return NextResponse.json({
      success: true,
      deleted: {
        client: client.companyName,
        branches: totalBranches,
        projects: totalProjects,
        requests: totalRequests,
        invoices: totalInvoices,
        contracts: totalContracts,
        checklists: totalChecklists,
        equipment: totalEquipment,
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
