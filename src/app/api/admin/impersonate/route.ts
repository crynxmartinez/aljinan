import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { signIn } from 'next-auth/react'

// POST: Start impersonation - sign in as target user with impersonation flag
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId } = await request.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
    }

    // Verify target user exists and get full data
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        contractor: true,
        client: true,
        teamMember: {
          include: {
            branchAccess: {
              select: {
                branchId: true
              }
            }
          }
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't impersonate other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 403 })
    }

    // Store admin info in cookie for restoration
    const cookieStore = await cookies()
    cookieStore.set('admin_impersonating', JSON.stringify({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      adminName: session.user.name,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      targetRole: targetUser.role,
      startedAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours max
    })

    // Determine redirect URL based on target role
    let redirectUrl = '/dashboard'
    if (targetUser.role === 'CLIENT') {
      redirectUrl = '/portal'
    }

    // Return target user data with impersonation flag
    // The client will handle signing in with this data
    return NextResponse.json({
      success: true,
      redirectUrl,
      impersonationData: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        isImpersonating: true,
        realAdminId: session.user.id,
        realAdminEmail: session.user.email,
        // Add role-specific data
        ...(targetUser.role === 'TEAM_MEMBER' && targetUser.teamMember ? {
          teamMemberRole: targetUser.teamMember.teamRole,
          assignedBranchIds: targetUser.teamMember.branchAccess.map(ba => ba.branchId),
          contractorId: targetUser.teamMember.contractorId,
        } : {}),
      },
    })
  } catch (error) {
    console.error('Error starting impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    )
  }
}

// DELETE: Stop impersonation
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const impersonationCookie = cookieStore.get('admin_impersonating')

    if (!impersonationCookie) {
      return NextResponse.json({ error: 'Not impersonating' }, { status: 400 })
    }

    // Clear the impersonation cookie
    cookieStore.delete('admin_impersonating')

    return NextResponse.json({ success: true, redirectUrl: '/admin' })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to stop impersonation' },
      { status: 500 }
    )
  }
}
