'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Bell, CheckCircle, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'quote' | 'work_order' | 'payment' | 'certificate' | 'comment' | 'alert'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

const iconMap = {
  quote: DollarSign,
  work_order: FileText,
  payment: CheckCircle,
  certificate: FileText,
  comment: AlertCircle,
  alert: AlertCircle,
}

const colorMap = {
  quote: 'text-purple-600',
  work_order: 'text-blue-600',
  payment: 'text-green-600',
  certificate: 'text-amber-600',
  comment: 'text-orange-600',
  alert: 'text-red-600',
}

export function NotificationCenter() {
  const router = useRouter()
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        // Map API notifications to component format with validation
        const mappedNotifications = (data.notifications || [])
          .filter((n: any) => n && n.id && n.title && n.message) // Filter out invalid entries
          .map((n: any) => ({
            id: n.id,
            type: (n.type?.toLowerCase() || 'alert') as Notification['type'],
            title: n.title || 'Notification',
            message: n.message || '',
            link: n.link || undefined,
            read: n.isRead ?? false,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          }))
        setNotifications(mappedNotifications)
      } else {
        console.error('Failed to fetch notifications:', response.status)
        setNotifications([])
        setError(true)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setNotifications([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: API call to mark as read
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // TODO: API call to mark all as read
      // await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500/30 mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load notifications</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setError(false)
                  setLoading(true)
                  fetchNotifications()
                }}
              >
                Try again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = iconMap[notification.type] || AlertCircle
              const iconColor = colorMap[notification.type] || 'text-gray-600'

              // Safety check: skip if notification is invalid
              if (!notification || !notification.id) {
                return null
              }

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.link) {
                      router.push(notification.link)
                      setOpen(false)
                    }
                  }}
                >
                  <div className={cn('mt-0.5', iconColor)}>
                    {Icon && <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-sm text-primary cursor-pointer font-medium"
              onClick={() => {
                const notificationsPath = session?.user?.role === 'CLIENT' 
                  ? '/portal/notifications' 
                  : '/dashboard/notifications'
                router.push(notificationsPath)
                setOpen(false)
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
