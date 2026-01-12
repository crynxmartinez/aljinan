import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch branch requests
// For CLIENT: returns their own requests
// For CONTRACTOR: returns all pending requests from their clients
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'CLIENT') {
      // Get client's own branch requests
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id }
      })

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const requests = await prisma.branchRequest.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(requests)
    } else if (session.user.role === 'CONTRACTOR') {
      // Get all pending branch requests from contractor's clients
      const contractor = await prisma.contractor.findUnique({
        where: { userId: session.user.id },
        include: { clients: { select: { id: true } } }
      })

      if (!contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
      }

      const clientIds = contractor.clients.map(c => c.id)

      const requests = await prisma.branchRequest.findMany({
        where: { clientId: { in: clientIds } },
        include: {
          client: {
            select: {
              companyName: true,
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(requests)
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching branch requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branch requests' },
      { status: 500 }
    )
  }
}

// POST - Create a new branch request (client only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Only clients can create branch requests' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { userId: session.user.id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, address, city, state, zipCode, country, phone, notes, latitude, longitude } = body

    if (!name || !address) {
      return NextResponse.json({ error: 'Name and address are required' }, { status: 400 })
    }

    const branchRequest = await prisma.branchRequest.create({
      data: {
        clientId: client.id,
        name,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        notes,
        latitude,
        longitude,
        createdById: session.user.id,
      }
    })

    return NextResponse.json(branchRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating branch request:', error)
    return NextResponse.json(
      { error: 'Failed to create branch request' },
      { status: 500 }
    )
  }
}
