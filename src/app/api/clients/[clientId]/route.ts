import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageClients, permissionDeniedError } from '@/lib/permissions'
import { sanitizePlainText, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'
import { validateEmail, validatePhone, validateRequired } from '@/lib/validation'
import { logResourceUpdated, logPermissionDenied } from '@/lib/audit-log'

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
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
      crNumber,
      vatNumber,
      billingAddress,
      contacts
    } = body

    // Validate and sanitize inputs
    const updateData: Record<string, unknown> = {}

    if (companyName !== undefined) {
      const nameValidation = validateRequired(companyName, 'Company name')
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error }, { status: 400 })
      }
      updateData.companyName = sanitizePlainText(companyName)
    }

    if (companyPhone !== undefined && companyPhone) {
      const phoneValidation = validatePhone(companyPhone)
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error }, { status: 400 })
      }
      updateData.companyPhone = sanitizePhone(companyPhone)
    }

    if (companyEmail !== undefined && companyEmail) {
      const emailValidation = validateEmail(companyEmail)
      if (!emailValidation.valid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 })
      }
      updateData.companyEmail = sanitizeEmail(companyEmail)
    }

    if (contactPersonName !== undefined) updateData.contactPersonName = contactPersonName ? sanitizePlainText(contactPersonName) : null
    if (contactPersonPhone !== undefined) updateData.contactPersonPhone = contactPersonPhone ? sanitizePhone(contactPersonPhone) : null
    if (contactPersonEmail !== undefined) updateData.contactPersonEmail = contactPersonEmail ? sanitizeEmail(contactPersonEmail) : null
    if (crNumber !== undefined) updateData.crNumber = crNumber ? sanitizePlainText(crNumber) : null
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber ? sanitizePlainText(vatNumber) : null
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress ? sanitizePlainText(billingAddress) : null
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

    // Log the update
    await logResourceUpdated(
      session.user.id,
      session.user.role as any,
      'client',
      clientId,
      updateData
    )

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
