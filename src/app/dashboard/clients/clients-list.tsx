'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

interface Branch {
  id: string
  name: string
  address: string
  city: string | null
  isActive: boolean
}

interface Client {
  id: string
  companyName: string
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
  const [expandedClients, setExpandedClients] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [newClient, setNewClient] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    branchAddress: '',
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create client')
      }

      setCreateDialogOpen(false)
      setNewClient({
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        branchAddress: '',
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
      await fetch(`/api/clients/${clientId}/archive`, {
        method: 'POST',
      })
      router.refresh()
    } catch (err) {
      console.error('Failed to archive client:', err)
    }
  }

  const handleUnarchiveClient = async (clientId: string) => {
    try {
      await fetch(`/api/clients/${clientId}/unarchive`, {
        method: 'POST',
      })
      router.refresh()
    } catch (err) {
      console.error('Failed to unarchive client:', err)
    }
  }

  const handleResendInvite = async (clientId: string) => {
    try {
      await fetch(`/api/clients/${clientId}/resend-invite`, {
        method: 'POST',
      })
      router.refresh()
    } catch (err) {
      console.error('Failed to resend invite:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Archived</Badge>
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients and their branches
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {activeClients.length === 0 && archivedClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first client. They&apos;ll receive an email invitation to join.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Client
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
                        <div className="text-left">
                          <CardTitle className="text-lg">{client.companyName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{client.user.email}</span>
                            <span>•</span>
                            <span>{client.branches.length} branch{client.branches.length !== 1 ? 'es' : ''}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CollapsibleTrigger>
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
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}/branches/new`}>
                              <MapPin className="mr-2 h-4 w-4" />
                              Add Branch
                            </Link>
                          </DropdownMenuItem>
                          {client.user.status === 'PENDING' && (
                            <DropdownMenuItem onClick={() => handleResendInvite(client.id)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleArchiveClient(client.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive Client
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
                        <p className="text-sm text-muted-foreground mb-2">No branches yet</p>
                        <Link href={`/dashboard/clients/${client.id}/branches/new`}>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {client.branches.map((branch) => (
                          <Link
                            key={branch.id}
                            href={`/dashboard/clients/${client.id}/branches/${branch.id}`}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{branch.address}</p>
                                {branch.city && (
                                  <p className="text-sm text-muted-foreground">{branch.city}</p>
                                )}
                              </div>
                            </div>
                            {!branch.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </Link>
                        ))}
                        <Link href={`/dashboard/clients/${client.id}/branches/new`}>
                          <Button variant="ghost" size="sm" className="w-full mt-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another Branch
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
                Archived Clients ({archivedClients.length})
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
                              Restore
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
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account. They will receive an email invitation to activate their account.
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
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Client Email *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={newClient.companyEmail}
                  onChange={(e) => setNewClient({ ...newClient, companyEmail: e.target.value })}
                  placeholder="client@company.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  An invitation will be sent to this email
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={newClient.companyPhone}
                  onChange={(e) => setNewClient({ ...newClient, companyPhone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchAddress">First Branch Address *</Label>
                <Input
                  id="branchAddress"
                  value={newClient.branchAddress}
                  onChange={(e) => setNewClient({ ...newClient, branchAddress: e.target.value })}
                  placeholder="123 Main Street, City"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can add more branches later
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
