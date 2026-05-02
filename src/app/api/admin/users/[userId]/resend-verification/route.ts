import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
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
      where: { id: userId },
      include: {
        contractor: true,
        client: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'User has already been verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000)

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    })

    const userType = user.role === 'CONTRACTOR' ? 'CONTRACTOR' : 'CLIENT'
    await sendVerificationEmail(
      user.email,
      user.name || 'there',
      verificationToken,
      userType
    )

    return NextResponse.json({
      success: true,
      message: `Verification email resent to ${user.email}`,
    })
  } catch (error) {
    console.error('Error resending verification:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
