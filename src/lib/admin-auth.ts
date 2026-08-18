import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * The granular permissions stored on AdminUser. These are editable in the admin settings
 * UI, so every admin endpoint must honour them — checking `role === 'ADMIN'` alone lets a
 * support admin with every switch turned off do everything a super admin can.
 */
export type AdminPermission =
  | 'canManageContractors'
  | 'canManageAdmins'
  | 'canImpersonateUsers'
  | 'canViewAnalytics'
  | 'canManageMessages'
  | 'canManagePlatform'

type AdminAuthResult =
  | { ok: false; response: NextResponse }
  | { ok: true; session: Session; adminId: string }

/**
 * Gate an admin endpoint on a specific permission.
 *
 *   const auth = await requireAdmin('canManageContractors')
 *   if (!auth.ok) return auth.response
 *   // auth.session is now available
 */
export async function requireAdmin(permission: AdminPermission): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const admin = await prisma.adminUser.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      canManageContractors: true,
      canManageAdmins: true,
      canImpersonateUsers: true,
      canViewAnalytics: true,
      canManageMessages: true,
      canManagePlatform: true,
    },
  })

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin profile not found' }, { status: 403 }),
    }
  }

  if (!admin[permission]) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'You do not have permission to perform this action' },
        { status: 403 }
      ),
    }
  }

  return { ok: true, session, adminId: admin.id }
}
