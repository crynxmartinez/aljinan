import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Shared implementation for both entry points below. Vercel Cron only ever issues a GET,
 * so the actual check has to run there -- it used to live only in POST, which meant the
 * "check-expiry" cron job was configured to do nothing every day and equipment expiry
 * notifications never fired unless someone called POST by hand.
 */
async function runEquipmentExpiryCheck() {
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Find equipment expiring within 30 days or already expired
    const expiringEquipment = await prisma.equipment.findMany({
      where: {
        expectedExpiry: {
          lte: thirtyDaysFromNow
        }
      },
      include: {
        branch: {
          include: {
            client: {
              include: {
                user: true,
                contractor: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    })

    let notificationsCreated = 0
    const processedUsers = new Set<string>()

    for (const equipment of expiringEquipment) {
      const isExpired = equipment.expectedExpiry && equipment.expectedExpiry < now
      const isExpiringSoon = equipment.expectedExpiry && 
        equipment.expectedExpiry >= now && 
        equipment.expectedExpiry <= sevenDaysFromNow

      // Only notify for expired or expiring within 7 days
      if (!isExpired && !isExpiringSoon) continue

      const branch = equipment.branch
      const client = branch.client
      const contractor = client.contractor

      // Create notification key to avoid duplicates
      const notificationKey = `${equipment.id}-${isExpired ? 'expired' : 'expiring'}`

      // Check if notification already exists for this equipment today
      const existingNotification = await prisma.notification.findFirst({
        where: {
          relatedId: equipment.id,
          relatedType: 'equipment',
          type: isExpired ? 'EQUIPMENT_EXPIRED' : 'EQUIPMENT_EXPIRING',
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      })

      if (existingNotification) continue

      const notificationType = isExpired ? 'EQUIPMENT_EXPIRED' : 'EQUIPMENT_EXPIRING'
      const title = isExpired 
        ? 'Equipment Inspection Overdue'
        : 'Equipment Inspection Due Soon'
      
      const daysUntilExpiry = equipment.expectedExpiry 
        ? Math.ceil((equipment.expectedExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const message = isExpired
        ? `Equipment ${equipment.equipmentNumber} (${equipment.equipmentType.replace(/_/g, ' ')}) at ${branch.name} is overdue for inspection.`
        : `Equipment ${equipment.equipmentNumber} (${equipment.equipmentType.replace(/_/g, ' ')}) at ${branch.name} expires in ${daysUntilExpiry} days.`

      const link = `/dashboard/clients/${client.id}/branches/${branch.id}?tab=equipment`
      const clientLink = `/portal/branches/${branch.id}?tab=equipment`

      // Notify contractor
      if (contractor?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: contractor.user.id,
            type: notificationType,
            title,
            message,
            link,
            relatedId: equipment.id,
            relatedType: 'equipment',
          }
        })
        notificationsCreated++
      }

      // Notify client
      if (client?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: client.user.id,
            type: notificationType,
            title,
            message,
            link: clientLink,
            relatedId: equipment.id,
            relatedType: 'equipment',
          }
        })
        notificationsCreated++
      }

      // Update equipment status
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: {
          status: isExpired ? 'EXPIRED' : 'EXPIRING_SOON'
        }
      })
    }

  return {
    equipmentChecked: expiringEquipment.length,
    notificationsCreated
  }
}

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Optional: if CRON_SECRET isn't configured, allow through (matches this route's
  // original POST behavior so manual/local calls keep working without one).
  return !cronSecret || authHeader === `Bearer ${cronSecret}`
}

// GET - Invoked by Vercel Cron (cron jobs are always a GET request)
export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runEquipmentExpiryCheck()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error checking equipment expiry:', error)
    return NextResponse.json(
      { error: 'Failed to check equipment expiry' },
      { status: 500 }
    )
  }
}

// POST - Kept for manual/on-demand triggering (e.g. from an admin action)
export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runEquipmentExpiryCheck()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error checking equipment expiry:', error)
    return NextResponse.json(
      { error: 'Failed to check equipment expiry' },
      { status: 500 }
    )
  }
}
