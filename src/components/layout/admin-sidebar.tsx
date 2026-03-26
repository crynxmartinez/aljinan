'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Loader2,
  UserCog,
  LogIn,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

interface AdminSidebarProps {
  adminRole?: string
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Contractors',
    href: '/admin/contractors',
    icon: Users,
  },
  {
    title: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
]

const bottomNavItems = [
  {
    title: 'Admin Users',
    href: '/admin/settings/admins',
    icon: UserCog,
  },
  {
    title: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/admin/messages/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) return
    e.preventDefault()
    setLoadingHref(href)
    router.push(href)
  }

  if (loadingHref && pathname === loadingHref) {
    setLoadingHref(null)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xl font-bold">Tasheel</span>
            <span className="text-xs text-red-500 ml-1 font-medium">Admin</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {loadingHref === item.href ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <item.icon className="h-4 w-4" />
              )}
              <span className="flex-1">{item.title}</span>
              {item.href === '/admin/messages' && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
              Settings
            </span>
          </div>
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {loadingHref === item.href ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <item.icon className="h-4 w-4" />
              )}
              {item.title}
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-red-600 text-white">
              {getInitials(session?.user?.name || session?.user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {adminRole === 'SUPER_ADMIN' ? 'Super Admin' : adminRole === 'SUPPORT_ADMIN' ? 'Support Admin' : 'Admin'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
