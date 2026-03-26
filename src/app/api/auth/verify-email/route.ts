import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTempPasswordEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex') // 12 char random password
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update user: activate account, set password, clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: new Date(),
        mustChangePassword: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    })

    // Send temp password email
    await sendTempPasswordEmail(user.email, user.name || 'there', tempPassword)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Check your inbox for login credentials.',
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
