import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin('canManageContractors')
    if (!auth.ok) return auth.response

    const { name, email, phone, companyName, inquiryId, invitationLocale } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000) // 24 hours

    // Create user + contractor in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: '', // Will be set after email verification
          name,
          role: 'CONTRACTOR',
          status: 'PENDING',
          preferredLocale: invitationLocale === 'en' ? 'en' : 'ar', // Changed from ACTIVE
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
          contractor: {
            create: {
              companyName: companyName || name,
              companyPhone: phone || null,
              companyEmail: email.toLowerCase().trim(),
            },
          },
        },
        include: {
          contractor: true,
        },
      })
      return newUser
    })

    // Send verification email
    const delivery = await sendVerificationEmail(user.email, user.name || 'there', verificationToken, undefined, invitationLocale === 'en' ? 'en' : 'ar')

    // If this was created from a contact inquiry, mark it as converted
    if (inquiryId) {
      await prisma.contactInquiry.update({
        where: { id: inquiryId },
        data: {
          status: 'CONVERTED',
          convertedToId: user.id,
        },
      }).catch((err) => {
        console.error('Failed to update inquiry status:', err)
        // Don't fail the whole request if inquiry update fails
      })
    }

    return NextResponse.json({
      success: true,
      emailSent: delivery.success,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        contractorId: user.contractor?.id,
      },
      message: delivery.success ? `Verification email sent to ${user.email}` : 'Account created; verification email delivery failed',
    })
  } catch (error) {
    console.error('Error creating contractor:', error)
    return NextResponse.json(
      { error: 'Failed to create contractor account' },
      { status: 500 }
    )
  }
}
