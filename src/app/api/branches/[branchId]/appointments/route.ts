import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'

// GET - Fetch all appointments for a branch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { branchId },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST - Create a new appointment (contractor only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can create appointments
    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can create appointments' }, { status: 403 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { title, description, date, startTime, endTime, duration, assignedTo } = body

    if (!title || !date || !startTime) {
      return NextResponse.json(
        { error: 'Title, date, and start time are required' },
        { status: 400 }
      )
    }

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        branchId,
        title,
        description,
        date: new Date(date),
        startTime,
        endTime: endTime || null,
        duration: duration || null,
        assignedTo: assignedTo || null,
        createdById: session.user.id,
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}