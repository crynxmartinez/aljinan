import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single appointment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, appointmentId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, branchId }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

// PATCH - Update an appointment (contractor updates, client confirms/cancels)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, appointmentId } = await params
    const body = await request.json()

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const currentAppointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, branchId }
    })

    if (!currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Handle client actions (confirm, cancel, request reschedule)
    if (session.user.role === 'CLIENT') {
      const { action, cancellationNote, rescheduleNote } = body

      if (action === 'confirm') {
        if (currentAppointment.status !== 'SCHEDULED') {
          return NextResponse.json({ error: 'Can only confirm scheduled appointments' }, { status: 400 })
        }

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            confirmedById: session.user.id,
          }
        })

        return NextResponse.json(updated)
      } else if (action === 'cancel') {
        if (currentAppointment.status === 'COMPLETED' || currentAppointment.status === 'CANCELLED') {
          return NextResponse.json({ error: 'Cannot cancel this appointment' }, { status: 400 })
        }

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledById: session.user.id,
            cancellationNote: cancellationNote || null,
          }
        })

        return NextResponse.json(updated)
      } else if (action === 'request_reschedule') {
        if (currentAppointment.status === 'COMPLETED' || currentAppointment.status === 'CANCELLED') {
          return NextResponse.json({ error: 'Cannot reschedule this appointment' }, { status: 400 })
        }

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'RESCHEDULED',
            rescheduleNote: rescheduleNote || null,
          }
        })

        return NextResponse.json(updated)
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle contractor updates
    if (session.user.role === 'CONTRACTOR') {
      const { title, description, date, startTime, endTime, duration, assignedTo, status } = body

      const updateData: Record<string, unknown> = {}
      
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (date !== undefined) updateData.date = new Date(date)
      if (startTime !== undefined) updateData.startTime = startTime
      if (endTime !== undefined) updateData.endTime = endTime
      if (duration !== undefined) updateData.duration = duration
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo
      
      if (status !== undefined) {
        updateData.status = status
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date()
        }
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an appointment (contractor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CONTRACTOR') {
      return NextResponse.json({ error: 'Only contractors can delete appointments' }, { status: 403 })
    }

    const { branchId, appointmentId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.appointment.delete({
      where: { id: appointmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}

// Helper function to verify branch access
async function verifyBranchAccess(branchId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            branches: {
              where: { id: branchId }
            }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        branches: {
          where: { id: branchId }
        }
      }
    })
    return (client?.branches.length || 0) > 0
  } else if (role === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: {
        branchAccess: { where: { branchId } }
      }
    })
    return (teamMember?.branchAccess.length || 0) > 0
  }
  return false
}
