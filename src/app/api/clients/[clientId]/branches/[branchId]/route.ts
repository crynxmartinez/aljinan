import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single branch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string; branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, branchId } = await params

    // Verify access
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId, clientId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    )
  }
}

// PATCH - Update branch profile
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string; branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, branchId } = await params

    // Only Contractor and Client can edit (not team members)
    if (session.user.role === 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Team members cannot edit branch profiles' }, { status: 403 })
    }

    // Verify access
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
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
      municipality,
      buildingType,
      floorCount,
      areaSize,
      cdCertificateNumber,
      cdCertificateExpiry,
      cdCertificateUrl,
      isActive
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode
    if (country !== undefined) updateData.country = country
    if (phone !== undefined) updateData.phone = phone
    if (notes !== undefined) updateData.notes = notes
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (municipality !== undefined) updateData.municipality = municipality
    if (buildingType !== undefined) updateData.buildingType = buildingType
    if (floorCount !== undefined) updateData.floorCount = floorCount
    if (areaSize !== undefined) updateData.areaSize = areaSize
    if (cdCertificateNumber !== undefined) updateData.cdCertificateNumber = cdCertificateNumber
    if (cdCertificateExpiry !== undefined) updateData.cdCertificateExpiry = cdCertificateExpiry ? new Date(cdCertificateExpiry) : null
    if (cdCertificateUrl !== undefined) updateData.cdCertificateUrl = cdCertificateUrl
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.branch.update({
      where: { id: branchId, clientId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a branch
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string; branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can delete branches
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete branches' }, { status: 403 })
    }

    const { clientId, branchId } = await params

    // Verify contractor owns this client
    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: {
        clients: {
          where: { id: clientId }
        }
      }
    })

    if (!contractor || contractor.clients.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.branch.delete({
      where: { id: branchId, clientId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    )
  }
}

// Helper function to verify branch access
async function verifyBranchAccess(branchId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            branches: { where: { id: branchId } }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: { branches: { where: { id: branchId } } }
    })
    return (client?.branches.length || 0) > 0
  } else if (role === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: {
        branchAccess: { where: { branchId } }
      }
    })
    return (teamMember?.branchAccess.length || 0) > 0
  }
  return false
}
