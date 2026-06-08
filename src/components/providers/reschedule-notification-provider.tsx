'use client'

import { useState, useEffect } from 'react'
import { RescheduleNotificationModal } from '@/components/ui/reschedule-notification-modal'

interface RescheduledWorkOrder {
  id: string
  description: string
  previousScheduledDate: string
  scheduledDate: string
  rescheduledAt: string
  rescheduledReason: string | null
  branchName: string
  branchId: string
}

export function RescheduleNotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [rescheduledWorkOrders, setRescheduledWorkOrders] = useState<RescheduledWorkOrder[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Only check once on mount
    if (hasChecked) return

    const checkRescheduledWorkOrders = async () => {
      try {
        const response = await fetch('/api/work-orders/rescheduled')
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            setRescheduledWorkOrders(data)
            setModalOpen(true)
          }
        }
      } catch (error) {
        console.error('Failed to check rescheduled work orders:', error)
      } finally {
        setHasChecked(true)
      }
    }

    // Small delay to let the page load first
    const timer = setTimeout(checkRescheduledWorkOrders, 1000)
    return () => clearTimeout(timer)
  }, [hasChecked])

  const handleAcknowledge = async () => {
    try {
      const workOrderIds = rescheduledWorkOrders.map(wo => wo.id)
      const response = await fetch('/api/work-orders/rescheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderIds }),
      })

      if (response.ok) {
        setRescheduledWorkOrders([])
      }
    } catch (error) {
      console.error('Failed to acknowledge rescheduled work orders:', error)
    }
  }

  return (
    <>
      {children}
      <RescheduleNotificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        rescheduledWorkOrders={rescheduledWorkOrders}
        onAcknowledge={handleAcknowledge}
      />
    </>
  )
}
