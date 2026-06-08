import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all certificates for a branch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const certificates = await prisma.certificate.findMany({
      where: { branchId },
      include: {
        contract: { select: { id: true, title: true } },
        equipment: { select: { id: true, equipmentNumber: true, equipmentType: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(certificates)
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}

// POST - Create/upload a certificate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const body = await request.json()
    const {
      type,
      title,
      description,
      fileUrl,
      issueDate,
      expiryDate,
      issuedBy,
      contractId,
      workOrderId,
      equipmentId,
      notes
    } = body

    if (!type || !title || !issueDate) {
      return NextResponse.json(
        { error: 'Type, title, and issue date are required' },
        { status: 400 }
      )
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only contractors can create certificates
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create certificates' }, { status: 403 })
    }

    // Use transaction to create certificate and update equipment if needed
    const certificate = await prisma.$transaction(async (tx) => {
      // If linking to equipment, first unlink any existing certificate
      if (equipmentId) {
        // Check if equipment exists and belongs to this branch
        const equipment = await tx.equipment.findFirst({
          where: { id: equipmentId, branchId }
        })

        if (!equipment) {
          throw new Error('Equipment not found')
        }

        // If equipment already has a certificate, we'll create a new one (old one stays in system)
      }

      // Create the certificate
      const newCert = await tx.certificate.create({
        data: {
          branchId,
          type,
          title,
          description: description || null,
          fileUrl,
          issueDate: new Date(issueDate),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          issuedBy: issuedBy || null,
          issuedById: session.user.id,
          contractId: contractId || null,
          workOrderId: workOrderId || null,
          equipmentId: equipmentId || null,
          notes: notes || null,
        },
        include: {
          contract: { select: { id: true, title: true } },
          equipment: { select: { id: true, equipmentNumber: true } }
        }
      })

      // If linking to equipment, update the equipment's certificateId
      if (equipmentId) {
        await tx.equipment.update({
          where: { id: equipmentId },
          data: {
            certificateId: newCert.id,
            certificateIssued: true
          }
        })
      }

      return newCert
    })

    return NextResponse.json(certificate, { status: 201 })
  } catch (error) {
    console.error('Error creating certificate:', error)
    return NextResponse.json(
      { error: 'Failed to create certificate' },
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
