import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/password-validation'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 })
    }

    const policy = validatePassword(newPassword)
    if (!policy.isValid) {
      return NextResponse.json({ error: policy.errors.join('. ') }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, mustChangePassword: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Anyone holding the session could previously set a new password without knowing the
    // old one, which turns a borrowed session into permanent account ownership. The one
    // exception is a first-login rotation, where the temporary password was issued to the
    // account holder and there is nothing to confirm against.
    if (!user.mustChangePassword) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json(
          { error: 'Your current password is required' },
          { status: 400 }
        )
      }

      const currentValid = await bcrypt.compare(currentPassword, user.password)
      if (!currentValid) {
        return NextResponse.json(
          { error: 'Your current password is incorrect' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        // Sign out every other session holding the old credential.
        sessionVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
