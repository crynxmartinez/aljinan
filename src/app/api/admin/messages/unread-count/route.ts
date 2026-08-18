import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const auth = await requireAdmin('canManageMessages')
    if (!auth.ok) return auth.response

    const count = await prisma.contactInquiry.count({
      where: {
        status: 'NEW',
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
  }
}
