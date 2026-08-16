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
  ClipboardList,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/use-translation'

interface Branch {
  id: string
  name: string
  slug: string | null
  clientNickname: string | null
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
  const { t } = useTranslation()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleEditNickname = (e: React.MouseEvent, branch: Branch) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBranch(branch)
    setNickname(branch.clientNickname || '')
    setNicknameDialogOpen(true)
  }

  const handleSaveNickname = async () => {
    if (!editingBranch) return

    setSaving(true)
    try {
      const response = await fetch(`/api/branches/${editingBranch.id}/client-nickname`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() || null })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update nickname')
      }

      // Update the branch in the client data
      const updatedBranch = await response.json()

      // Force a page refresh to update the sidebar
      router.refresh()

      toast.success(t.dashboard.portal.nicknameUpdatedSuccess)
      setNicknameDialogOpen(false)
      setEditingBranch(null)
      setNickname('')
    } catch (error) {
      console.error('Error updating nickname:', error)
      toast.error(error instanceof Error ? error.message : t.dashboard.portal.nicknameUpdateFailed)
    } finally {
      setSaving(false)
    }
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
                {t.dashboard.portal.via} {client.contractor.companyName || 'Contractor'}
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
            {t.dashboard.portal.dashboard}
          </Link>

          <Link
            href="/portal/work-orders"
            onClick={(e) => handleNavClick(e, '/portal/work-orders')}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === '/portal/work-orders'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {loadingHref === '/portal/work-orders' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            {t.dashboard.portal.workOrders}
          </Link>
        </div>

        <Separator className="my-4" />

        {/* Branches Section */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
              {t.dashboard.portal.yourBranches}
            </span>
          </div>

          {client.branches.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <MapPin className="h-8 w-8 text-sidebar-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-sidebar-foreground/50">{t.dashboard.portal.noBranchesYet}</p>
              <p className="text-xs text-sidebar-foreground/40 mt-1">
                {t.dashboard.portal.contractorWillAddBranches}
              </p>
            </div>
          ) : (
            client.branches.map((branch) => (
              <div key={branch.id} className="group relative">
                <Link
                  href={`/portal/branches/${branch.slug || branch.id}`}
                  onClick={(e) => handleNavClick(e, `/portal/branches/${branch.slug || branch.id}`)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === `/portal/branches/${branch.slug || branch.id}`
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  {/* Edit Icon - Left Side */}
                  <button
                    onClick={(e) => handleEditNickname(e, branch)}
                    className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-primary/20 rounded flex-shrink-0"
                    title={t.dashboard.portal.editBranchNicknameTooltip}
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                  </button>

                  {/* Branch Icon */}
                  {loadingHref === `/portal/branches/${branch.slug || branch.id}` ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                  )}

                  {/* Branch Name/Address */}
                  <div className="flex-1 min-w-0">
                    {branch.clientNickname ? (
                      <>
                        <p className="truncate font-medium">{branch.clientNickname}</p>
                        <p className="text-xs text-sidebar-foreground/50 truncate">
                          {branch.address}{branch.city ? `, ${branch.city}` : ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="truncate">{branch.address}</p>
                        {branch.city && (
                          <p className="text-xs text-sidebar-foreground/50 truncate">{branch.city}</p>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              </div>
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
            {t.dashboard.portal.accountSettings}
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
              {t.dashboard.portal.client}
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

      {/* Nickname Edit Dialog */}
      <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dashboard.portal.editBranchNickname}</DialogTitle>
            <DialogDescription>
              {t.dashboard.portal.nicknameDialogDesc}
            </DialogDescription>
          </DialogHeader>

          {editingBranch && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.dashboard.portal.branchAddress}</Label>
                <p className="text-sm text-muted-foreground">
                  {editingBranch.address}
                  {editingBranch.city && `, ${editingBranch.city}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">{t.dashboard.portal.customNickname}</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.dashboard.portal.nicknamePlaceholder}
                  maxLength={50}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  {nickname.length}/50 {t.dashboard.portal.characters}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNicknameDialogOpen(false)}
              disabled={saving}
            >
              {t.dashboard.portal.cancel}
            </Button>
            <Button onClick={handleSaveNickname} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.dashboard.portal.saving}
                </>
              ) : (
                t.dashboard.portal.saveNickname
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
