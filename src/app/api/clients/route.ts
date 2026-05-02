import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slugify'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id },
      include: {
        clients: {
          include: {
            user: {
              select: {
                email: true,
                status: true,
              }
            },
            branches: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { companyName: 'asc' }
        }
      }
    })

    return NextResponse.json(contractor?.clients || [])
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyName, companyEmail, companyPhone } = body

    if (!companyName || !companyEmail) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: companyEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    const contractor = await prisma.contractor.findUnique({
      where: { userId: session.user.id }
    })

    if (!contractor) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      )
    }

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 86400000) // 24 hours

    // Generate unique slug for client
    const baseSlug = generateSlug(companyName)
    const existingClients = await prisma.client.findMany({
      where: { contractorId: contractor.id },
      select: { slug: true }
    })
    const existingSlugs = existingClients.map(c => c.slug).filter((s): s is string => s !== null)
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)

    const client = await prisma.client.create({
      data: {
        companyName,
        slug: uniqueSlug,
        companyPhone,
        companyEmail,
        contractor: {
          connect: { id: contractor.id }
        },
        user: {
          create: {
            email: companyEmail,
            password: '', // Will be set after email verification
            name: companyName,
            role: 'CLIENT',
            status: 'PENDING',
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
          }
        },
      },
      include: {
        user: {
          select: {
            email: true,
            status: true,
          }
        },
        branches: true,
      }
    })

    // Send verification email
    await sendVerificationEmail(companyEmail, companyName, verificationToken, 'CLIENT')

    return NextResponse.json({
      ...client,
      message: `Verification email sent to ${companyEmail}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
