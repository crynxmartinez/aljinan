'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle, Clock, AlertCircle, FileText, Eye, Wrench, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationPopupProps {
  userRole: 'CONTRACTOR' | 'CLIENT'
}

interface PopupNotification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export function NotificationPopup({ userRole }: NotificationPopupProps) {
  const [notification, setNotification] = useState<PopupNotification | null>(null)
  const [open, setOpen] = useState(false)
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check for popup notification once on mount (after login)
    const checkNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/popup')
        if (response.ok) {
          const data = await response.json()
          if (data.notification && !shownNotifications.has(data.notification.id)) {
            setNotification(data.notification)
            setOpen(true)
            setShownNotifications(prev => new Set(prev).add(data.notification.id))
          }
        }
      } catch (error) {
        console.error('Failed to check popup notifications:', error)
      }
    }

    // Only check once on mount
    checkNotifications()
  }, [])  // Only run once when component mounts

  const handleClose = async () => {
    if (notification) {
      // Mark as read
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [notification.id] })
        })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
    setOpen(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_REQUEST':
        return <Bell className="h-8 w-8 text-blue-600" />
      case 'WORK_ORDER_FOR_REVIEW':
        return <Eye className="h-8 w-8 text-purple-600" />
      case 'WORK_ORDER_STARTED':
        return <Wrench className="h-8 w-8 text-blue-600" />
      case 'WORK_ORDER_COMPLETED':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'WORK_ORDER_REJECTED':
        return <XCircle className="h-8 w-8 text-red-600" />
      case 'WORK_ORDER_REMINDER':
        return <Clock className="h-8 w-8 text-amber-600" />
      default:
        return <AlertCircle className="h-8 w-8 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-amber-500">Medium Priority</Badge>
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>
      default:
        return null
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'NEW_REQUEST':
        return 'bg-blue-50'
      case 'WORK_ORDER_FOR_REVIEW':
        return 'bg-purple-50'
      case 'WORK_ORDER_COMPLETED':
        return 'bg-green-50'
      case 'WORK_ORDER_REJECTED':
        return 'bg-red-50'
      case 'WORK_ORDER_REMINDER':
        return 'bg-amber-50'
      default:
        return 'bg-gray-50'
    }
  }

  if (!notification) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className={cn('flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4', getBackgroundColor(notification.type))}>
            {getIcon(notification.type)}
          </div>
          <DialogTitle className="text-center text-xl">
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {notification.message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          {getPriorityBadge(notification.priority)}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
