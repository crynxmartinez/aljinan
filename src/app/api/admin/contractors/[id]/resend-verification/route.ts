import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin('canManageContractors')
    if (!auth.ok) return auth.response

    const { id } = await params

    // Find contractor user
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    // Check if user is still pending
    if (contractor.user.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'User has already been verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000) // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: contractor.user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    })

    // Resend verification email
    await sendVerificationEmail(
      contractor.user.email,
      contractor.user.name || 'there',
      verificationToken
    )

    return NextResponse.json({
      success: true,
      message: `Verification email resent to ${contractor.user.email}`,
    })
  } catch (error) {
    console.error('Error resending verification:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
