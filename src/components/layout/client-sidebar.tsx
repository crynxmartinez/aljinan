'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  MapPin,
  LogOut,
  Building2,
  Settings,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface Branch {
  id: string
  name: string
  address: string
  city: string | null
}

interface ClientData {
  id: string
  companyName: string
  contractor: {
    companyName: string | null
  }
  branches: Branch[]
}

interface ClientSidebarProps {
  client: ClientData
}

export function ClientSidebar({ client }: ClientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) return
    e.preventDefault()
    setLoadingHref(href)
    router.push(href)
  }

  // Clear loading state when pathname changes
  if (loadingHref && pathname === loadingHref) {
    setLoadingHref(null)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <span className="text-xl font-bold">Aljinan</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Company Info */}
        <div className="px-3 py-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{client.companyName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                via {client.contractor.companyName || 'Contractor'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Main Navigation */}
        <div className="space-y-1">
          <Link
            href="/portal"
            onClick={(e) => handleNavClick(e, '/portal')}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/portal'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {loadingHref === '/portal' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            Dashboard
          </Link>
        </div>

        <Separator className="my-4" />

        {/* Branches Section */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
              Your Branches
            </span>
          </div>

          {client.branches.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <MapPin className="h-8 w-8 text-sidebar-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-sidebar-foreground/50">No branches yet</p>
              <p className="text-xs text-sidebar-foreground/40 mt-1">
                Your contractor will add branches
              </p>
            </div>
          ) : (
            client.branches.map((branch) => (
              <Link
                key={branch.id}
                href={`/portal/branches/${branch.id}`}
                onClick={(e) => handleNavClick(e, `/portal/branches/${branch.id}`)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === `/portal/branches/${branch.id}`
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                {loadingHref === `/portal/branches/${branch.id}` ? (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate">{branch.address}</p>
                  {branch.city && (
                    <p className="text-xs text-sidebar-foreground/50 truncate">{branch.city}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        <Separator className="my-4" />

        {/* Settings */}
        <div className="space-y-1">
          <Link
            href="/portal/settings"
            onClick={(e) => handleNavClick(e, '/portal/settings')}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/portal/settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {loadingHref === '/portal/settings' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Account Settings
          </Link>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(session?.user?.name || session?.user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/50">
              Client
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
