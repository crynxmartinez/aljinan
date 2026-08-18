import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { enforceRateLimit } from '@/lib/rate-limit'
import { validatePassword } from '@/lib/password-validation'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    const limited = await enforceRateLimit(request, {
      name: 'reset-password', limit: 10, window: 3600,
    })
    if (limited) return limited

    // The policy lived only in the browser, so a direct API call could set "aaaaaaaa".
    const policy = validatePassword(password)
    if (!policy.isValid) {
      return NextResponse.json({ error: policy.errors.join('. ') }, { status: 400 })
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        mustChangePassword: false, // Clear this flag too if it was set
        // A reset is often a response to compromise, so existing tokens must stop working.
        sessionVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Password has been reset successfully'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
