import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
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

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000) // 24 hours

    // Create user + contractor in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: '', // Will be set after email verification
          name,
          role: 'CONTRACTOR',
          status: 'PENDING', // Changed from ACTIVE
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
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

    // Send verification email
    await sendVerificationEmail(user.email, user.name || 'there', verificationToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        contractorId: user.contractor?.id,
      },
      message: `Verification email sent to ${user.email}`,
    })
  } catch (error) {
    console.error('Error creating contractor:', error)
    return NextResponse.json(
      { error: 'Failed to create contractor account' },
      { status: 500 }
    )
  }
}
