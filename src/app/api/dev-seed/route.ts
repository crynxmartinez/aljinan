import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slugify'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const adminEmail = 'admin@tasheel.local'
    const adminPassword = 'DevAdmin123!'
    const contractorEmail = 'contractor@tasheel.local'
    const contractorPassword = 'DevContractor123!'
    const clientEmail = 'client@tasheel.local'
    const clientPassword = 'DevClient123!'

    const adminHash = await bcrypt.hash(adminPassword, 12)
    const contractorHash = await bcrypt.hash(contractorPassword, 12)
    const clientHash = await bcrypt.hash(clientPassword, 12)

    // --- Admin ---
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password: adminHash, status: 'ACTIVE', mustChangePassword: false },
      create: {
        email: adminEmail,
        password: adminHash,
        name: 'Test Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: false,
        admin: {
          create: {
            adminRole: 'SUPER_ADMIN',
            canManageContractors: true,
            canManageAdmins: true,
            canImpersonateUsers: true,
            canViewAnalytics: true,
            canManageMessages: true,
            canManagePlatform: true,
          },
        },
      },
    })

    // --- Contractor ---
    const contractorUser = await prisma.user.upsert({
      where: { email: contractorEmail },
      update: { password: contractorHash, status: 'ACTIVE', mustChangePassword: false },
      create: {
        email: contractorEmail,
        password: contractorHash,
        name: 'Test Contractor',
        role: 'CONTRACTOR',
        status: 'ACTIVE',
        mustChangePassword: false,
        contractor: {
          create: {
            companyName: 'Al Jinan Fire & Safety',
            companyEmail: contractorEmail,
            companyPhone: '+966500000000',
            companyAddress: 'Riyadh, Saudi Arabia',
            isVerified: true,
          },
        },
      },
      include: { contractor: true },
    })

    const contractorId = contractorUser.contractor?.id
    if (!contractorId) {
      return NextResponse.json({ error: 'Failed to get contractor ID' }, { status: 500 })
    }

    // --- Client ---
    const existingClient = await prisma.user.findUnique({
      where: { email: clientEmail },
    })

    let clientId: string | undefined

    if (!existingClient) {
      const baseSlug = generateSlug('Test Client Company')
      const existingClients = await prisma.client.findMany({
        where: { contractorId },
        select: { slug: true },
      })
      const existingSlugs = existingClients.map(c => c.slug).filter((s): s is string => s !== null)
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)

      const client = await prisma.client.create({
        data: {
          companyName: 'Test Client Company',
          slug: uniqueSlug,
          companyPhone: '+966510000000',
          companyEmail: clientEmail,
          contractor: { connect: { id: contractorId } },
          user: {
            create: {
              email: clientEmail,
              password: clientHash,
              name: 'Test Client Company',
              role: 'CLIENT',
              status: 'ACTIVE',
              mustChangePassword: false,
            },
          },
        },
        include: { user: true, branches: true },
      })
      clientId = client.id
    } else {
      // Update password if exists
      await prisma.user.update({
        where: { email: clientEmail },
        data: { password: clientHash, status: 'ACTIVE', mustChangePassword: false },
      })
      const client = await prisma.client.findFirst({
        where: { user: { email: clientEmail } },
      })
      clientId = client?.id
    }

    // --- Branch ---
    let branchId: string | undefined
    if (clientId) {
      const existingBranch = await prisma.branch.findFirst({
        where: { clientId, name: 'Test Branch - Riyadh Office' },
      })

      if (!existingBranch) {
        const baseBranchSlug = generateSlug('Test Branch - Riyadh Office')
        const existingBranchSlugs = await prisma.branch.findMany({
          where: { clientId },
          select: { slug: true },
        })
        const branchSlugs = existingBranchSlugs.map(b => b.slug).filter((s): s is string => s !== null)
        const branchSlug = generateUniqueSlug(baseBranchSlug, branchSlugs)

        const branch = await prisma.branch.create({
          data: {
            name: 'Test Branch - Riyadh Office',
            slug: branchSlug,
            address: 'King Fahd Road, Olaya District, Riyadh',
            city: 'Riyadh',
            state: 'Riyadh Province',
            zipCode: '12213',
            country: 'Saudi Arabia',
            phone: '+966500000001',
            buildingType: 'OFFICE',
            floorCount: 5,
            areaSize: 500.5,
            clientId,
          },
        })
        branchId = branch.id
      } else {
        branchId = existingBranch.id
      }
    }

    return NextResponse.json({
      success: true,
      accounts: {
        admin: { email: adminEmail, password: adminPassword, id: admin.id },
        contractor: { email: contractorEmail, password: contractorPassword, id: contractorUser.id, contractorId },
        client: { email: clientEmail, password: clientPassword, clientId },
        branch: { branchId },
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed' },
      { status: 500 }
    )
  }
}
