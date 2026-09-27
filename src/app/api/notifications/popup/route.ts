import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveNotificationLink } from '@/lib/notification-links'

// GET - Fetch highest priority unread notification for popup
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Priority is stored as text; alphabetic descending puts medium above high.
    // Fetch the newest in each priority, then choose in the intended order.
    const byPriority = await Promise.all(['high', 'medium', 'low'].map(priority =>
      prisma.notification.findFirst({
        where: { userId: session.user.id, isRead: false, showPopup: true, priority },
        orderBy: { createdAt: 'desc' },
      })
    ))
    const notification = byPriority.find(Boolean)

    if (!notification) {
      return NextResponse.json({ notification: null })
    }

    return NextResponse.json({ notification: { ...notification, link: await resolveNotificationLink(notification.link) } })
  } catch (error) {
    console.error('Error fetching popup notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}
