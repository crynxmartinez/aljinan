'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import {
  Users,
  MapPin,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Mail,
  Building2,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  slug: string | null
  name: string
  address: string
  city: string | null
  isActive: boolean
  displayName?: string | null
}

interface Client {
  id: string
  slug: string | null
  companyName: string
  displayName?: string | null
  companyPhone: string | null
  companyEmail: string | null
  user: {
    email: string
    status: 'PENDING' | 'ACTIVE' | 'ARCHIVED'
  }
  branches: Branch[]
}

interface ClientsListProps {
  clients: Client[]
}

export function ClientsList({ clients }: ClientsListProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const tc = t.dashboard.clientsPage
  const [expandedClients, setExpandedClients] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const [newClient, setNewClient] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
  })

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
  }

  const activeClients = clients.filter((c) => c.user.status !== 'ARCHIVED')
  const archivedClients = clients.filter((c) => c.user.status === 'ARCHIVED')

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      toast.success(tc.clientCreated, {
        description: `${tc.verificationEmailSent} ${data.user.email}`
      })
      setCreateDialogOpen(false)
      setNewClient({
        companyName: '',
        companyEmail: '',
        companyPhone: '',
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveClient = async (clientId: string) => {
    try {
      await api.post(`/api/clients/${clientId}/archive`)
      router.refresh()
    } catch (err) {
      console.error('Failed to archive client:', err)
    }
  }

  const handleUnarchiveClient = async (clientId: string) => {
    try {
      await api.post(`/api/clients/${clientId}/unarchive`)
      router.refresh()
    } catch (err) {
      console.error('Failed to unarchive client:', err)
    }
  }

  const handleResendInvite = async (clientId: string, email: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/resend-verification`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(tc.verificationResent, {
        description: `${tc.sentTo} ${email}`
      })
    } catch (err) {
      toast.error(tc.failedResend, {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const startEditingClient = (client: Client, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingClientId(client.id)
    setEditingBranchId(null)
    setEditingValue(client.displayName || '')
  }

  const startEditingBranch = (branch: Branch, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBranchId(branch.id)
    setEditingClientId(null)
    setEditingValue(branch.displayName || '')
  }

  const cancelEditing = () => {
    setEditingClientId(null)
    setEditingBranchId(null)
    setEditingValue('')
  }

  const saveClientDisplayName = async (clientId: string) => {
    if (savingId) return
    setSavingId(clientId)
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
      toast.success(tc.clientNicknameUpdated)
      cancelEditing()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc.updateFailed)
    } finally {
      setSavingId(null)
    }
  }

  const saveBranchDisplayName = async (branchId: string) => {
    if (savingId) return
    setSavingId(branchId)
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
      toast.success(tc.branchNicknameUpdated)
      cancelEditing()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc.updateFailed)
    } finally {
      setSavingId(null)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string, type: 'client' | 'branch') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      type === 'client' ? saveClientDisplayName(id) : saveBranchDisplayName(id)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{tc.active}</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{tc.pending}</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{tc.archived}</Badge>
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{tc.title}</h1>
          <p className="text-muted-foreground mt-1">
            {tc.subtitle}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {tc.addClient}
        </Button>
      </div>

      {activeClients.length === 0 && archivedClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{tc.noClientsYet}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {tc.noClientsDesc}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tc.addFirstClient}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeClients.map((client) => (
            <Card key={client.id}>
              <Collapsible
                open={expandedClients.includes(client.id)}
                onOpenChange={() => toggleClient(client.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80">
                      {expandedClients.includes(client.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-start">
                          <CardTitle className="text-lg">{client.companyName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{client.user.email}</span>
                            <span>•</span>
                            <span>{client.branches.length} {client.branches.length !== 1 ? tc.branches : tc.branch}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2 ms-2">
                      {editingClientId === client.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, client.id, 'client')}
                            placeholder={tc.enterNickname}
                            className="h-8 w-40 text-sm"
                            autoFocus
                            disabled={savingId === client.id}
                          />
                          {savingId === client.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveClientDisplayName(client.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {client.displayName && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {tc.nickname}: {client.displayName}
                            </Badge>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => startEditingClient(client, e)} title={tc.setNickname}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(client.user.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}`}>
                              {tc.viewDetails}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.slug || client.id}/branches/new`}>
                              <MapPin className="mr-2 h-4 w-4" />
                              {tc.addBranch}
                            </Link>
                          </DropdownMenuItem>
                          {client.user.status === 'PENDING' && (
                            <DropdownMenuItem onClick={() => handleResendInvite(client.id, client.user.email)}>
                              <Mail className="mr-2 h-4 w-4" />
                              {tc.resendVerification}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleArchiveClient(client.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {tc.archiveClient}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {client.branches.length === 0 ? (
                      <div className="text-center py-6 bg-muted/50 rounded-lg">
                        <MapPin className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">{tc.noBranchesYet}</p>
                        <Link href={`/dashboard/clients/${client.slug || client.id}/branches/new`}>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            {tc.addBranch}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {client.branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Link
                              href={`/dashboard/clients/${client.slug || client.id}/branches/${branch.slug || branch.id}`}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{branch.address}</p>
                                {branch.city && (
                                  <p className="text-sm text-muted-foreground">{branch.city}</p>
                                )}
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 ms-2 shrink-0">
                              {editingBranchId === branch.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => handleEditKeyDown(e, branch.id, 'branch')}
                                    placeholder={tc.enterNickname}
                                    className="h-8 w-40 text-sm"
                                    autoFocus
                                    disabled={savingId === branch.id}
                                  />
                                  {savingId === branch.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <>
                                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveBranchDisplayName(branch.id)}>
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {branch.displayName && (
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {tc.nickname}: {branch.displayName}
                                    </Badge>
                                  )}
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => startEditingBranch(branch, e)} title={tc.setNickname}>
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                              {!branch.isActive && (
                                <Badge variant="secondary">{tc.inactive}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        <Link href={`/dashboard/clients/${client.slug || client.id}/branches/new`}>
                          <Button variant="ghost" size="sm" className="w-full mt-2">
                            <Plus className="mr-2 h-4 w-4" />
                            {tc.addAnotherBranch}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}

          {archivedClients.length > 0 && (
            <div className="mt-8">
              <Button
                variant="ghost"
                onClick={() => setShowArchived(!showArchived)}
                className="mb-4"
              >
                {showArchived ? (
                  <ChevronDown className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                {tc.archivedClients} ({archivedClients.length})
              </Button>

              {showArchived && (
                <div className="space-y-4 opacity-60">
                  {archivedClients.map((client) => (
                    <Card key={client.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{client.companyName}</CardTitle>
                              <CardDescription>{client.user.email}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(client.user.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnarchiveClient(client.id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {tc.restore}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc.addNewClient}</DialogTitle>
            <DialogDescription>
              {tc.addNewClientDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">{tc.companyName}</Label>
                <Input
                  id="companyName"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  placeholder={tc.companyNamePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">{tc.clientEmail}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={newClient.companyEmail}
                  onChange={(e) => setNewClient({ ...newClient, companyEmail: e.target.value })}
                  placeholder={tc.clientEmailPlaceholder}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {tc.verificationEmailNote}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">{tc.companyPhone}</Label>
                <Input
                  id="companyPhone"
                  value={newClient.companyPhone}
                  onChange={(e) => setNewClient({ ...newClient, companyPhone: e.target.value })}
                  placeholder={tc.companyPhonePlaceholder}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {tc.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tc.creating : tc.createClient}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  )
}
