import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch highest priority unread notification for popup
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the most recent high-priority unread notification
    const notification = await prisma.notification.findFirst({
      where: {
        userId: session.user.id,
        isRead: false,
        showPopup: true, // Only show notifications marked for popup
      },
      orderBy: [
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' } // Most recent first
      ]
    })

    if (!notification) {
      return NextResponse.json({ notification: null })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error fetching popup notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}
