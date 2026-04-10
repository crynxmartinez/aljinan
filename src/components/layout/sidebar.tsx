'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'
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
  UserCog,
  Loader2,
  BarChart3,
  ClipboardList,
  Pencil,
  Check,
  X,
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
import { useState, useEffect } from 'react'

interface Client {
  id: string
  slug: string | null
  companyName: string
  displayName?: string | null
  branches: {
    id: string
    slug: string | null
    name: string
    address: string
    displayName?: string | null
  }[]
}

interface SidebarProps {
  clients?: Client[]
  userRole?: string
  teamMemberRole?: string
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Work Orders',
    href: '/dashboard/work-orders',
    icon: ClipboardList,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Company Profile',
    href: '/dashboard/company',
    icon: Building2,
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: UserCog,
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

export function Sidebar({ clients = [], userRole, teamMemberRole }: SidebarProps) {
  const isTeamMember = userRole === 'TEAM_MEMBER'
  const isTechnician = teamMemberRole === 'TECHNICIAN'
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [expandedClients, setExpandedClients] = useState<string[]>([])
  const [loadingHref, setLoadingHref] = useState<string | null>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingClientId, setSavingClientId] = useState<string | null>(null)
  const [savingBranchId, setSavingBranchId] = useState<string | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        const unread = (data.notifications || []).filter((n: any) => !n.isRead).length
        setUnreadNotifications(unread)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Don't show loading if already on this page
    if (pathname === href) return
    e.preventDefault()
    setLoadingHref(href)
    router.push(href)
  }

  // Clear loading state when pathname changes
  if (loadingHref && pathname === loadingHref) {
    setLoadingHref(null)
  }

  const toggleClient = (id: string) => {
    setExpandedClients((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const startEditing = (client: Client, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingClientId(client.id)
    setEditingValue(client.displayName || client.companyName)
  }

  const startEditingBranch = (branch: Client['branches'][0], e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBranchId(branch.id)
    setEditingValue(branch.displayName || branch.address)
  }

  const cancelEditing = () => {
    setEditingClientId(null)
    setEditingBranchId(null)
    setEditingValue('')
  }

  const saveDisplayName = async (clientId: string) => {
    if (savingClientId) return
    
    setSavingClientId(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}/display-name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editingValue.trim() || null }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      toast.success('Client name updated!')
      
      cancelEditing()
      
      // Refresh to get updated data
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update'
      toast.error('Update failed', { description: errorMsg })
    } finally {
      setSavingClientId(null)
    }
  }

  const saveBranchDisplayName = async (branchId: string) => {
    if (savingBranchId) return
    
    setSavingBranchId(branchId)
    try {
      const response = await fetch(`/api/branches/${branchId}/display-name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editingValue.trim() || null }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      toast.success('Branch name updated!')
      
      cancelEditing()
      
      // Refresh to get updated data
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update'
      toast.error('Update failed', { description: errorMsg })
    } finally {
      setSavingBranchId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, clientId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveDisplayName(clientId)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const handleBranchKeyDown = (e: React.KeyboardEvent, branchId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveBranchDisplayName(branchId)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
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
          {mainNavItems
            .filter(item => {
              // Hide Team page for team members (they can't manage other team members)
              if (item.href === '/dashboard/team' && isTeamMember) return false
              // Hide Company Profile for team members
              if (item.href === '/dashboard/company' && isTeamMember) return false
              return true
            })
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative',
                pathname === item.href
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
              {item.href === '/dashboard/notifications' && unreadNotifications > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Clients Section */}
        <div className="space-y-1">
          <div className="sticky top-0 bg-sidebar flex items-center justify-between px-3 py-2 z-10">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
              {isTeamMember ? 'Assigned Branches' : 'Clients'}
            </span>
            {!isTeamMember && (
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs shrink-0">
                  View All
                </Button>
              </Link>
            )}
          </div>

          {clients.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-sidebar-foreground/50">
                {isTeamMember ? 'No branches assigned' : 'No clients yet'}
              </p>
              {!isTeamMember && (
                <Link href="/dashboard/clients">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Users className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {clients.map((client) => (
                <Collapsible
                  key={client.id}
                  open={expandedClients.includes(client.id)}
                  onOpenChange={() => toggleClient(client.id)}
                >
                  <div className="flex items-center group">
                    <CollapsibleTrigger className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                      {expandedClients.includes(client.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    
                    {editingClientId === client.id ? (
                      <div className="flex flex-1 items-center gap-1 px-2 py-1 relative">
                        <Users className="h-4 w-4 text-sidebar-foreground/70 flex-shrink-0" />
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, client.id)}
                          onBlur={() => saveDisplayName(client.id)}
                          className="flex-1 bg-sidebar-accent text-sidebar-accent-foreground text-sm px-2 py-1 rounded outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                          disabled={savingClientId === client.id}
                        />
                        {savingClientId === client.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/50" />
                        ) : (
                          <>
                            <button
                              onClick={() => saveDisplayName(client.id)}
                              className="p-1 hover:bg-sidebar-accent rounded"
                              title="Save"
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 hover:bg-sidebar-accent rounded"
                              title="Cancel"
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          onClick={(e) => handleNavClick(e, `/dashboard/clients/${client.id}`)}
                          className={cn(
                            'flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                            pathname === `/dashboard/clients/${client.id}` || pathname.startsWith(`/dashboard/clients/${client.id}/`)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                          title={client.displayName ? `${client.displayName} (${client.companyName})` : client.companyName}
                        >
                          {loadingHref === `/dashboard/clients/${client.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          <span className="truncate">{client.displayName || client.companyName}</span>
                        </Link>
                        {!isTeamMember && (
                          <button
                            onClick={(e) => startEditing(client, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-sidebar-accent rounded transition-opacity"
                            title="Edit nickname"
                          >
                            <Pencil className="h-3 w-3 text-sidebar-foreground/50" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <CollapsibleContent className="pl-6">
                    {client.branches.map((branch) => (
                      <div key={branch.id} className="flex items-center group">
                        {editingBranchId === branch.id ? (
                          <div className="flex flex-1 items-center gap-1 px-3 py-2">
                            <MapPin className="h-3 w-3 text-sidebar-foreground/70 flex-shrink-0" />
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => handleBranchKeyDown(e, branch.id)}
                              onBlur={() => saveBranchDisplayName(branch.id)}
                              className="flex-1 bg-sidebar-accent text-sidebar-accent-foreground text-sm px-2 py-1 rounded outline-none focus:ring-2 focus:ring-primary"
                              autoFocus
                              disabled={savingBranchId === branch.id}
                            />
                            {savingBranchId === branch.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/50" />
                            ) : (
                              <>
                                <button
                                  onClick={() => saveBranchDisplayName(branch.id)}
                                  className="p-1 hover:bg-sidebar-accent rounded"
                                  title="Save"
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 hover:bg-sidebar-accent rounded"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}`}
                              onClick={(e) => handleNavClick(e, `/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}`)}
                              className={cn(
                                'flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                pathname === `/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}`
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}
                              title={branch.displayName ? `${branch.displayName} (${branch.address})` : branch.address}
                            >
                              {loadingHref === `/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              <span className="truncate">{branch.displayName || branch.address}</span>
                            </Link>
                            {!isTeamMember && (
                              <button
                                onClick={(e) => startEditingBranch(branch, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-accent rounded transition-opacity shrink-0"
                                title="Edit nickname"
                              >
                                <Pencil className="h-3 w-3 text-sidebar-foreground/50" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {!isTeamMember && (
                <div className="px-3 pt-2">
                  <Link href="/dashboard/clients">
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        <Separator className="my-4" />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
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
