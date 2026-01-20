import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      companyName, 
      companyPhone, 
      companyEmail, 
      companyAddress,
      logoUrl,
      website,
      businessType,
      yearEstablished,
      crNumber,
      vatNumber,
      licenseNumber,
      licenseExpiry,
      insuranceCertUrl,
      insuranceExpiry,
      serviceAreas
    } = body

    // Build update data object
    const updateData: Record<string, unknown> = {}
    if (companyName !== undefined) updateData.companyName = companyName
    if (companyPhone !== undefined) updateData.companyPhone = companyPhone
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (website !== undefined) updateData.website = website
    if (businessType !== undefined) updateData.businessType = businessType
    if (yearEstablished !== undefined) updateData.yearEstablished = yearEstablished ? parseInt(yearEstablished) : null
    if (crNumber !== undefined) updateData.crNumber = crNumber
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber
    if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null
    if (insuranceCertUrl !== undefined) updateData.insuranceCertUrl = insuranceCertUrl
    if (insuranceExpiry !== undefined) updateData.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null
    if (serviceAreas !== undefined) updateData.serviceAreas = serviceAreas

    const contractor = await prisma.contractor.update({
      where: { userId: session.user.id },
      data: updateData,
    })

    return NextResponse.json(contractor)
  } catch (error) {
    console.error('Error updating contractor profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    return NextResponse.json(contractor)
  } catch (error) {
    console.error('Error fetching contractor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
