import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTempPasswordEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'User is already active' },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex') // 12 char
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Activate user
    await prisma.user.update({
      where: { id: userId },
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
      tempPassword, // Return to admin
      message: `Account activated. Password sent to ${user.email}`,
    })
  } catch (error) {
    console.error('Error activating user:', error)
    return NextResponse.json(
      { error: 'Failed to activate user' },
      { status: 500 }
    )
  }
}
