'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  CheckCircle,
  Clock,
  ClipboardList,
  FileCheck,
  Loader2,
  Eye,
  CheckCheck,
  Wrench,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  relatedId: string | null
  relatedType: string | null
  createdAt: string
}

export function NotificationsList() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      fetchNotifications()
      router.refresh()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WORK_ORDER_REMINDER':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'WORK_ORDER_STARTED':
        return <Wrench className="h-4 w-4 text-blue-600" />
      case 'WORK_ORDER_FOR_REVIEW':
        return <Eye className="h-4 w-4 text-purple-600" />
      case 'WORK_ORDER_COMPLETED':
      case 'WORK_ORDER_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WORK_ORDER_REJECTED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'CONTRACT_SIGNED':
        return <FileCheck className="h-4 w-4 text-green-600" />
      case 'PROJECT_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No notifications</p>
        <p className="text-sm text-muted-foreground mt-1">
          You're all caught up!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Mark All as Read */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between pb-4 border-b">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer',
                !notification.isRead && 'bg-muted/50',
                notification.link && 'hover:bg-muted/70'
              )}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification.id)
                }
                if (notification.link) {
                  router.push(notification.link)
                }
              }}
            >
              {/* Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm leading-tight">
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
