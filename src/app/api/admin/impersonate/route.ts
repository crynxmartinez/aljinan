import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { logAuditEvent } from '@/lib/audit-log'

/** How long an unredeemed grant stays valid. Short: it is redeemed immediately. */
const GRANT_TTL_MS = 60_000

/**
 * POST: Start impersonation.
 *
 * The browser used to receive the target user's identity and hand it to signIn() with an
 * `impersonation: 'true'` flag. next-auth passes the whole request body to authorize(), so
 * that flag was self-asserted — anyone could sign in as anyone, admins included, with only
 * an email address and no password.
 *
 * Now the server mints a single-use random token bound to one target user. authorize()
 * will skip the password check only for a token it can find in the database, unexpired and
 * unconsumed, and it consumes the token as it does so.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin('canImpersonateUsers')
    if (!auth.ok) return auth.response

    const { targetUserId } = await request.json()
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true, status: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Impersonating another admin would let a support admin borrow permissions they were
    // not granted.
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 403 })
    }

    if (targetUser.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot impersonate an archived user' }, { status: 403 })
    }

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.impersonationGrant.create({
      data: {
        token,
        targetUserId: targetUser.id,
        adminUserId: auth.session.user.id,
        adminEmail: auth.session.user.email ?? '',
        expiresAt: new Date(Date.now() + GRANT_TTL_MS),
      },
    })

    // Marker cookie so the UI can show the "you are impersonating" banner and offer an
    // exit. It is a display aid, not the authorisation — the grant is.
    const cookieStore = await cookies()
    cookieStore.set(
      'admin_impersonating',
      JSON.stringify({
        adminUserId: auth.session.user.id,
        adminEmail: auth.session.user.email,
        adminName: auth.session.user.name,
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        targetRole: targetUser.role,
        startedAt: new Date().toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 2,
      }
    )

    await logAuditEvent({
      eventType: 'SECURITY_ALERT',
      userId: auth.session.user.id,
      userEmail: auth.session.user.email ?? undefined,
      resourceType: 'User',
      resourceId: targetUser.id,
      action: 'Started impersonation',
      details: { targetEmail: targetUser.email, targetRole: targetUser.role },
      success: true,
    })

    return NextResponse.json({
      success: true,
      redirectUrl: targetUser.role === 'CLIENT' ? '/portal' : '/dashboard',
      // The browser needs the email to name the account it is signing into, and the grant
      // to prove the sign-in was authorised. It gets nothing else.
      email: targetUser.email,
      grant: token,
    })
  } catch (error) {
    console.error('Error starting impersonation:', error)
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 })
  }
}

/**
 * DELETE: Stop impersonation.
 *
 * Clearing the marker cookie is not enough on its own — the admin is holding a real
 * session as the target user, which previously stayed valid for up to 24 hours. Bumping
 * the target's sessionVersion invalidates it immediately, so the admin lands back on the
 * login screen and signs in as themselves.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const marker = cookieStore.get('admin_impersonating')

    if (!marker) {
      return NextResponse.json({ error: 'Not impersonating' }, { status: 400 })
    }

    let targetUserId: string | undefined
    let adminEmail: string | undefined
    try {
      const parsed = JSON.parse(marker.value)
      targetUserId = parsed.targetUserId
      adminEmail = parsed.adminEmail
    } catch {
      // Unreadable cookie: still clear it below.
    }

    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { sessionVersion: { increment: 1 } },
      })

      await logAuditEvent({
        eventType: 'SECURITY_ALERT',
        userEmail: adminEmail,
        resourceType: 'User',
        resourceId: targetUserId,
        action: 'Stopped impersonation',
        success: true,
      })
    }

    cookieStore.delete('admin_impersonating')

    return NextResponse.json({ success: true, redirectUrl: '/login' })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 })
  }
}
