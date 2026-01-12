'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

interface Client {
  id: string
  companyName: string
  branches: {
    id: string
    name: string
    address: string
  }[]
}

interface SidebarProps {
  clients?: Client[]
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Company Profile',
    href: '/dashboard/company',
    icon: Building2,
  },
]

const bottomNavItems = [
  {
    title: 'Templates',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar({ clients = [] }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedClients, setExpandedClients] = useState<string[]>([])

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <span className="text-xl font-bold">Aljinan</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Clients Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
              Clients
            </span>
            <Link href="/dashboard/clients">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                View All
              </Button>
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-sidebar-foreground/50">No clients yet</p>
              <Link href="/dashboard/clients">
                <Button variant="outline" size="sm" className="mt-2">
                  <Users className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </Link>
            </div>
          ) : (
            clients.map((client) => (
              <Collapsible
                key={client.id}
                open={expandedClients.includes(client.id)}
                onOpenChange={() => toggleClient(client.id)}
              >
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  {expandedClients.includes(client.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Users className="h-4 w-4" />
                  <span className="truncate">{client.companyName}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6">
                  {client.branches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/dashboard/clients/${client.id}/branches/${branch.id}`}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        pathname === `/dashboard/clients/${client.id}/branches/${branch.id}`
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{branch.address}</span>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>

        <Separator className="my-4" />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
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
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {session?.user?.role}
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
