import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Find client and verify ownership
    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        contractorId: contractor?.id
      },
      include: { user: true }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.user.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Client has already been verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000) // 24 hours

    await prisma.user.update({
      where: { id: client.user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    })

    await sendVerificationEmail(
      client.user.email,
      client.user.name || 'there',
      verificationToken,
      'CLIENT'
    )

    return NextResponse.json({
      success: true,
      message: `Verification email resent to ${client.user.email}`,
    })
  } catch (error) {
    console.error('Error resending verification:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
