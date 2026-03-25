import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, adminNotes } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    const inquiry = await prisma.contactInquiry.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(inquiry)
  } catch (error) {
    console.error('Error updating inquiry:', error)
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 })
  }
}
