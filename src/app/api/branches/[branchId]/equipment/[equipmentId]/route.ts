import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'

const VALID_EQUIPMENT_TYPES = [
  'FIRE_EXTINGUISHER', 'FIRE_ALARM_PANEL', 'SPRINKLER_SYSTEM', 'EMERGENCY_LIGHTING',
  'EXIT_SIGN', 'FIRE_DOOR', 'SMOKE_DETECTOR', 'HEAT_DETECTOR', 'GAS_DETECTOR',
  'KITCHEN_HOOD_SUPPRESSION', 'FIRE_PUMP', 'FIRE_HOSE_REEL', 'OTHER'
]

const VALID_EQUIPMENT_STATUSES = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'NEEDS_ATTENTION']

const VALID_INSPECTION_RESULTS = ['PENDING', 'PASS', 'FAIL', 'NEEDS_REPAIR']

// GET - Fetch single equipment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, equipmentId } = await params

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        branchId
      },
      include: {
        request: {
          select: { id: true, title: true, status: true }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}

// PATCH - Update equipment (including inspection results)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, equipmentId } = await params
    const body = await request.json()

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify equipment exists and belongs to this branch
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        branchId
      }
    })

    if (!existingEquipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Validate equipmentType if provided
    if (body.equipmentType !== undefined && !VALID_EQUIPMENT_TYPES.includes(body.equipmentType)) {
      return NextResponse.json(
        { error: `Invalid equipment type. Must be one of: ${VALID_EQUIPMENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status !== undefined && !VALID_EQUIPMENT_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid equipment status. Must be one of: ${VALID_EQUIPMENT_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate inspectionResult if provided
    if (body.inspectionResult !== undefined && !VALID_INSPECTION_RESULTS.includes(body.inspectionResult)) {
      return NextResponse.json(
        { error: `Invalid inspection result. Must be one of: ${VALID_INSPECTION_RESULTS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate custom equipment type if OTHER is selected
    if (body.equipmentType === 'OTHER' && !body.customEquipmentType?.trim()) {
      return NextResponse.json(
        { error: 'Custom equipment type is required when selecting "Other"' },
        { status: 400 }
      )
    }

    // Basic fields
    if (body.equipmentNumber !== undefined) updateData.equipmentNumber = body.equipmentNumber
    if (body.equipmentType !== undefined) {
      updateData.equipmentType = body.equipmentType
      // Set or clear customEquipmentType based on type
      updateData.customEquipmentType = body.equipmentType === 'OTHER' ? body.customEquipmentType : null
    }
    if (body.customEquipmentType !== undefined && body.equipmentType === 'OTHER') {
      updateData.customEquipmentType = body.customEquipmentType
    }
    if (body.brand !== undefined) updateData.brand = body.brand || null
    if (body.model !== undefined) updateData.model = body.model || null
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber || null
    if (body.location !== undefined) updateData.location = body.location || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.deficiencies !== undefined) updateData.deficiencies = body.deficiencies || null

    // Date fields
    if (body.dateAdded !== undefined) updateData.dateAdded = body.dateAdded ? new Date(body.dateAdded) : null
    if (body.expectedExpiry !== undefined) updateData.expectedExpiry = body.expectedExpiry ? new Date(body.expectedExpiry) : null
    if (body.lastInspected !== undefined) updateData.lastInspected = body.lastInspected ? new Date(body.lastInspected) : null

    // Inspection tracking fields
    if (body.status !== undefined) updateData.status = body.status
    if (body.inspectionResult !== undefined) updateData.inspectionResult = body.inspectionResult
    if (body.isInspected !== undefined) updateData.isInspected = body.isInspected
    if (body.certificateIssued !== undefined) updateData.certificateIssued = body.certificateIssued
    if (body.stickerApplied !== undefined) updateData.stickerApplied = body.stickerApplied

    // Link fields
    if (body.requestId !== undefined) updateData.requestId = body.requestId || null
    if (body.workOrderId !== undefined) updateData.workOrderId = body.workOrderId || null
    if (body.certificateId !== undefined) updateData.certificateId = body.certificateId || null

    // If marking as inspected, update lastInspected date
    if (body.isInspected === true && !body.lastInspected) {
      updateData.lastInspected = new Date()
    }

    // Auto-calculate status based on inspection result and expiry
    if (body.inspectionResult === 'FAIL' || body.inspectionResult === 'NEEDS_REPAIR') {
      updateData.status = 'NEEDS_ATTENTION'
    } else if (body.expectedExpiry) {
      const expiryDate = new Date(body.expectedExpiry)
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (expiryDate < now) {
        updateData.status = 'EXPIRED'
      } else if (expiryDate <= thirtyDaysFromNow) {
        updateData.status = 'EXPIRING_SOON'
      } else {
        updateData.status = 'ACTIVE'
      }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: updateData
    })

    return NextResponse.json(updatedEquipment)
  } catch (error) {
    console.error('Error updating equipment:', error)
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    )
  }
}

// DELETE - Delete equipment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only contractors can delete equipment
    if (session.user.role !== 'CONTRACTOR' && session.user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Only contractors can delete equipment' }, { status: 403 })
    }

    const { branchId, equipmentId } = await params

    // Verify user has access to this branch
    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify equipment exists and belongs to this branch
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        branchId
      }
    })

    if (!existingEquipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    await prisma.equipment.delete({
      where: { id: equipmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment:', error)
    return NextResponse.json(
      { error: 'Failed to delete equipment' },
      { status: 500 }
    )
  }
}