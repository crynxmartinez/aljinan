import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePassword } from '@/lib/password-validation'
import bcrypt from 'bcryptjs'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (typeof token !== 'string' || !token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const limited = await enforceRateLimit(request, {
      name: 'verify-email', limit: 20, window: 3600,
    })
    if (limited) return limited

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

    // The verified link lets the recipient choose credentials directly. No generated
    // password is lost if an email provider fails after the account has changed.
    if (password === undefined) return NextResponse.json({ requiresPassword: true })
    if (typeof password !== 'string' || !validatePassword(password).isValid) {
      return NextResponse.json({ error: 'Password does not meet the requirements' }, { status: 400 })
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const activated = await prisma.user.updateMany({
      where: { id: user.id, emailVerificationToken: token, emailVerificationExpiry: { gt: new Date() } },
      data: {
        password: hashedPassword, status: 'ACTIVE', emailVerified: new Date(), mustChangePassword: false,
        emailVerificationToken: null, emailVerificationExpiry: null, sessionVersion: { increment: 1 },
      },
    })
    if (activated.count !== 1) return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 })

    return NextResponse.json({
      success: true,
      message: 'Account activated. You can now sign in.',
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
