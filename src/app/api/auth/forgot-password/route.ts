import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

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
