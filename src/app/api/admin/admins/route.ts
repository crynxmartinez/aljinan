import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// GET: List all admin users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admins = await prisma.adminUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

// POST: Create a new admin user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current admin has canManageAdmins permission
    const currentAdmin = await prisma.adminUser.findFirst({
      where: { userId: session.user.id },
    })
    if (!currentAdmin?.canManageAdmins) {
      return NextResponse.json({ error: 'No permission to manage admins' }, { status: 403 })
    }

    const {
      name,
      email,
      adminRole,
      canManageContractors,
      canManageAdmins,
      canImpersonateUsers,
      canViewAnalytics,
      canManageMessages,
      canManagePlatform,
    } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const tempPassword = crypto.randomBytes(6).toString('hex')
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Determine permissions based on role preset
    let permissions = {
      canManageContractors: true,
      canManageAdmins: true,
      canImpersonateUsers: true,
      canViewAnalytics: true,
      canManageMessages: true,
      canManagePlatform: true,
    }

    if (adminRole === 'SUPPORT_ADMIN') {
      permissions = {
        canManageContractors: true,
        canManageAdmins: false,
        canImpersonateUsers: true,
        canViewAnalytics: true,
        canManageMessages: true,
        canManagePlatform: false,
      }
    } else if (adminRole === 'CUSTOM') {
      permissions = {
        canManageContractors: canManageContractors ?? true,
        canManageAdmins: canManageAdmins ?? false,
        canImpersonateUsers: canImpersonateUsers ?? true,
        canViewAnalytics: canViewAnalytics ?? true,
        canManageMessages: canManageMessages ?? true,
        canManagePlatform: canManagePlatform ?? false,
      }
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        role: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: true,
        admin: {
          create: {
            adminRole: adminRole || 'SUPPORT_ADMIN',
            ...permissions,
          },
        },
      },
      include: {
        admin: true,
      },
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: user.admin?.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        adminRole: user.admin?.adminRole,
      },
      tempPassword,
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

// PATCH: Update admin permissions
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentAdmin = await prisma.adminUser.findFirst({
      where: { userId: session.user.id },
    })
    if (!currentAdmin?.canManageAdmins) {
      return NextResponse.json({ error: 'No permission to manage admins' }, { status: 403 })
    }

    const { adminId, adminRole, ...permissions } = await request.json()

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    // Can't modify own role if it would remove canManageAdmins
    const targetAdmin = await prisma.adminUser.findUnique({ where: { id: adminId } })
    if (targetAdmin?.userId === session.user.id && permissions.canManageAdmins === false) {
      return NextResponse.json({ error: 'Cannot remove your own admin management permission' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (adminRole) updateData.adminRole = adminRole
    if (permissions.canManageContractors !== undefined) updateData.canManageContractors = permissions.canManageContractors
    if (permissions.canManageAdmins !== undefined) updateData.canManageAdmins = permissions.canManageAdmins
    if (permissions.canImpersonateUsers !== undefined) updateData.canImpersonateUsers = permissions.canImpersonateUsers
    if (permissions.canViewAnalytics !== undefined) updateData.canViewAnalytics = permissions.canViewAnalytics
    if (permissions.canManageMessages !== undefined) updateData.canManageMessages = permissions.canManageMessages
    if (permissions.canManagePlatform !== undefined) updateData.canManagePlatform = permissions.canManagePlatform

    const updated = await prisma.adminUser.update({
      where: { id: adminId },
      data: updateData,
      include: {
        user: { select: { email: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}
