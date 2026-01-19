import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Verify access
    const hasAccess = await verifyClientAccess(clientId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            email: true,
            status: true,
          }
        },
        branches: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PATCH - Update client profile
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Only Contractor and Client can edit (not team members)
    if (session.user.role === 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Team members cannot edit client profiles' }, { status: 403 })
    }

    // Verify access
    const hasAccess = await verifyClientAccess(clientId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyName,
      companyPhone,
      companyEmail,
      crNumber,
      vatNumber,
      billingAddress,
      contractStartDate,
      contractExpiryDate,
      contacts
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (companyName !== undefined) updateData.companyName = companyName
    if (companyPhone !== undefined) updateData.companyPhone = companyPhone
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail
    if (crNumber !== undefined) updateData.crNumber = crNumber
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress
    if (contractStartDate !== undefined) updateData.contractStartDate = contractStartDate ? new Date(contractStartDate) : null
    if (contractExpiryDate !== undefined) updateData.contractExpiryDate = contractExpiryDate ? new Date(contractExpiryDate) : null
    if (contacts !== undefined) updateData.contacts = contacts

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            status: true,
          }
        },
        branches: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// Helper function to verify client access
async function verifyClientAccess(clientId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          where: { id: clientId }
        }
      }
    })
    return (contractor?.clients.length || 0) > 0
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId }
    })
    return client?.id === clientId
  }
  return false
}
