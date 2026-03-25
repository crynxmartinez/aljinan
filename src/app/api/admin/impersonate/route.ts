import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// POST: Start impersonation - store admin's real session info in a cookie
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

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, email: true, name: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't impersonate other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 403 })
    }

    // Store admin session info in an httpOnly cookie for later restoration
    const cookieStore = await cookies()
    cookieStore.set('admin_impersonating', JSON.stringify({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
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

    return NextResponse.json({
      success: true,
      redirectUrl,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
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
