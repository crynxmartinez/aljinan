import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateStrongPassword } from '@/lib/password-validation'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slugify'

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

    const tempPassword = generateStrongPassword(12)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

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
            password: hashedPassword,
            name: companyName,
            role: 'CLIENT',
            status: 'PENDING',
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

    // TODO: Send invitation email using Resend
    // For now, return the temp password so it can be shown in UI (remove in production)
    return NextResponse.json({ 
      ...client, 
      tempPassword // Include temp password in response for display
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
