'use client'
import { api } from '@/lib/api-client'
import { renderNotificationText } from '@/lib/i18n/notification-messages'

import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle, Clock, AlertCircle, Eye, Wrench, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/use-translation'

interface NotificationPopupProps {
  userRole: 'CONTRACTOR' | 'CLIENT'
}

interface PopupNotification {
  id: string
  type: string
  content?: unknown
  title: string
  message: string
  link: string | null
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export function NotificationPopup({ userRole }: NotificationPopupProps) {
  const { t, locale } = useTranslation()
  const tp = t.dashboard.notificationPopup
  const [notification, setNotification] = useState<PopupNotification | null>(null)
  const [open, setOpen] = useState(false)
  const shownNotifications = useRef(new Set<string>())

  useEffect(() => {
    if (open) return
    // Check for popup notification once on mount (after login)
    const checkNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/popup')
        if (response.ok) {
          const data = await response.json()
          if (data.notification && !shownNotifications.current.has(data.notification.id)) {
            setNotification(data.notification)
            setOpen(true)
            shownNotifications.current.add(data.notification.id)
          }
        }
      } catch (error) {
        console.error('Failed to check popup notifications:', error)
      }
    }

    // Only check once on mount
    checkNotifications()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible' && !open) checkNotifications() }, 30000)
    return () => window.clearInterval(timer)
  }, [open])

  const handleClose = async () => {
    if (notification) {
      // Mark as read
      try {
        await api.patch('/api/notifications', { notificationIds: [notification.id] })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        return
      }
    }
    window.dispatchEvent(new Event('notifications-changed'))
    setOpen(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_REQUEST':
        return <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      case 'WORK_ORDER_FOR_REVIEW':
        return <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
      case 'WORK_ORDER_STARTED':
        return <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      case 'WORK_ORDER_COMPLETED':
        return <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      case 'WORK_ORDER_REJECTED':
        return <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      case 'WORK_ORDER_REMINDER':
        return <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      default:
        return <AlertCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">{tp.highPriority}</Badge>
      case 'medium':
        return <Badge className="bg-amber-500">{tp.mediumPriority}</Badge>
      case 'low':
        return <Badge variant="secondary">{tp.lowPriority}</Badge>
      default:
        return null
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'NEW_REQUEST':
        return 'bg-blue-50 dark:bg-blue-950/40'
      case 'WORK_ORDER_FOR_REVIEW':
        return 'bg-purple-50 dark:bg-purple-950/40'
      case 'WORK_ORDER_COMPLETED':
        return 'bg-green-50 dark:bg-green-950/40'
      case 'WORK_ORDER_REJECTED':
        return 'bg-red-50 dark:bg-red-950/40'
      case 'WORK_ORDER_REMINDER':
        return 'bg-amber-50 dark:bg-amber-950/40'
      default:
        return 'bg-gray-50 dark:bg-gray-900'
    }
  }

  if (!notification) return null

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) void handleClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className={cn('flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4', getBackgroundColor(notification.type))}>
            {getIcon(notification.type)}
          </div>
          <DialogTitle className="text-center text-xl">
            {renderNotificationText(notification.title, notification.content, 'title', locale)}
          </DialogTitle>
          <DialogDescription className="text-center">
            {renderNotificationText(notification.message, notification.content, 'message', locale)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          {getPriorityBadge(notification.priority)}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            {tp.ok}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
