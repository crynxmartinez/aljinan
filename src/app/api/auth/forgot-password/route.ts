import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { enforceRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Two limits: per address, so one mailbox cannot be flooded; and per caller, so a
    // single client cannot walk a list of addresses.
    const perAddress = await enforceRateLimit(request, {
      name: 'forgot-password:address', limit: 3, window: 3600, identifier: email,
    })
    if (perAddress) return perAddress

    const perCaller = await enforceRateLimit(request, {
      name: 'forgot-password:ip', limit: 10, window: 3600,
    })
    if (perCaller) return perCaller

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Always return success to prevent email enumeration
    // Don't reveal if the email exists or not
    if (!user) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      })
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    })

    // Send email
    await sendPasswordResetEmail(user.email, resetToken)

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
