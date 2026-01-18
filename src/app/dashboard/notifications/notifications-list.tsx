'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
  CheckCheck
} from 'lucide-react'
import Link from 'next/link'

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
        return <ClipboardList className="h-4 w-4 text-blue-600" />
      case 'WORK_ORDER_FOR_REVIEW':
        return <Eye className="h-4 w-4 text-purple-600" />
      case 'WORK_ORDER_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CONTRACT_SIGNED':
        return <FileCheck className="h-4 w-4 text-green-600" />
      case 'PROJECT_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { style: string; label: string }> = {
      WORK_ORDER_REMINDER: { style: 'bg-amber-100 text-amber-700', label: 'Reminder' },
      WORK_ORDER_STARTED: { style: 'bg-blue-100 text-blue-700', label: 'Started' },
      WORK_ORDER_FOR_REVIEW: { style: 'bg-purple-100 text-purple-700', label: 'Review' },
      WORK_ORDER_COMPLETED: { style: 'bg-green-100 text-green-700', label: 'Completed' },
      CONTRACT_SIGNED: { style: 'bg-green-100 text-green-700', label: 'Signed' },
      PROJECT_APPROVED: { style: 'bg-green-100 text-green-700', label: 'Approved' },
      REQUEST_RECEIVED: { style: 'bg-blue-100 text-blue-700', label: 'Request' },
      GENERAL: { style: 'bg-gray-100 text-gray-700', label: 'General' },
    }
    const { style, label } = config[type] || config.GENERAL
    return <Badge className={style}>{label}</Badge>
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll receive notifications about work orders and updates here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium truncate ${!notification.isRead ? 'text-primary' : ''}`}>
                        {notification.title}
                      </p>
                      {getTypeBadge(notification.type)}
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-xs text-primary hover:underline"
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                          View details →
                        </Link>
                      )}
                      {!notification.isRead && !notification.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
