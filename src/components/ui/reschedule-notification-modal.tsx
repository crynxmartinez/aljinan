'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarClock, Calendar, ArrowRight, AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate, formatDateTime } from '@/lib/i18n/format-date'

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

interface RescheduleNotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rescheduledWorkOrders: RescheduledWorkOrder[]
  onAcknowledge: () => void
}

export function RescheduleNotificationModal({
  open,
  onOpenChange,
  rescheduledWorkOrders,
  onAcknowledge,
}: RescheduleNotificationModalProps) {
  const [acknowledging, setAcknowledging] = useState(false)
  const { t, locale } = useTranslation()
  const tr = t.dashboard.rescheduleModal

  const handleAcknowledge = async () => {
    setAcknowledging(true)
    try {
      await onAcknowledge()
      onOpenChange(false)
    } finally {
      setAcknowledging(false)
    }
  }

  if (rescheduledWorkOrders.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            {tr.title}
          </DialogTitle>
          <DialogDescription>
            {tr.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pe-4">
          <div className="space-y-4 py-4">
            {rescheduledWorkOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-4 border rounded-lg bg-orange-50 border-orange-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{wo.description}</p>
                    <p className="text-xs text-muted-foreground">{wo.branchName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    <CalendarClock className="h-3 w-3 me-1" />
                    {tr.rescheduled}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground line-through">
                    <Calendar className="h-3 w-3" />
                    {formatDate(wo.previousScheduledDate, locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <ArrowRight className="h-4 w-4 text-orange-500" />
                  <div className="flex items-center gap-1 font-medium text-orange-700">
                    <Calendar className="h-3 w-3" />
                    {formatDate(wo.scheduledDate, locale, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {wo.rescheduledReason && (
                  <div className="mt-3 p-2 bg-white rounded border border-orange-100">
                    <p className="text-xs text-muted-foreground mb-1">{tr.reason}</p>
                    <p className="text-sm">{wo.rescheduledReason}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {tr.changedOn} {formatDateTime(wo.rescheduledAt, locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {acknowledging ? tr.acknowledging : tr.acknowledge}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
