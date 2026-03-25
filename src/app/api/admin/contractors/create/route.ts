import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, phone, companyName } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex') // 12 char random password
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create user + contractor in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name,
          role: 'CONTRACTOR',
          status: 'ACTIVE',
          mustChangePassword: true,
          contractor: {
            create: {
              companyName: companyName || name,
              companyPhone: phone || null,
              companyEmail: email.toLowerCase().trim(),
            },
          },
        },
        include: {
          contractor: true,
        },
      })
      return newUser
    })

    // TODO: Send email with credentials (Phase 4 enhancement)
    // For now, return the temp password so admin can share it manually

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        contractorId: user.contractor?.id,
      },
      tempPassword, // Admin will share this with the contractor
      message: `Contractor account created. Temporary password: ${tempPassword}`,
    })
  } catch (error) {
    console.error('Error creating contractor:', error)
    return NextResponse.json(
      { error: 'Failed to create contractor account' },
      { status: 500 }
    )
  }
}
