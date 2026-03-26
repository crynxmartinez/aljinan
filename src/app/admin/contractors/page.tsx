'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  FileText,
  ClipboardList,
  LogIn,
  Building2,
  Loader2,
  Search,
  AlertCircle,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Copy, Check } from 'lucide-react'

interface ClientInfo {
  id: string
  userId: string
  companyName: string
  email: string
  name: string | null
  status: string
  branchCount: number
  branches: { id: string; name: string; address: string; city: string | null }[]
}

interface ContractorData {
  id: string
  userId: string
  companyName: string | null
  companyPhone: string | null
  companyEmail: string | null
  email: string
  name: string | null
  status: string
  createdAt: string
  clients: ClientInfo[]
  stats: {
    clientCount: number
    branchCount: number
    totalRequests: number
    openRequests: number
    totalWorkOrders: number
    activeWorkOrders: number
  }
}

export default function ContractorsPage() {
  const router = useRouter()
  const [contractors, setContractors] = useState<ContractorData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set())
  const [impersonateTarget, setImpersonateTarget] = useState<{
    userId: string
    name: string
    role: string
  } | null>(null)
  const [impersonating, setImpersonating] = useState(false)

  // Create contractor dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newContractor, setNewContractor] = useState({ name: '', email: '', phone: '', companyName: '' })

  useEffect(() => {
    fetchContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/admin/contractors')
      if (response.ok) {
        const data = await response.json()
        setContractors(data)
      }
    } catch (err) {
      console.error('Failed to fetch contractors:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleContractor = (id: string) => {
    setExpandedContractors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleImpersonate = async () => {
    if (!impersonateTarget) return
    setImpersonating(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: impersonateTarget.userId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Sign in as the target user using their credentials
        // For impersonation, we'll redirect with the impersonation cookie set
        window.location.href = data.redirectUrl
      }
    } catch (err) {
      console.error('Failed to impersonate:', err)
    } finally {
      setImpersonating(false)
      setImpersonateTarget(null)
    }
  }

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/admin/contractors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContractor),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      toast.success('Contractor account created!', {
        description: `Verification email sent to ${data.user.email}`,
      })
      
      resetCreateDialog()
      fetchContractors()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create contractor'
      toast.error('Failed to create account', { description: errorMsg })
    } finally {
      setCreating(false)
    }
  }

  const handleResendVerification = async (contractorId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/resend-verification`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      toast.success('Verification email resent!', {
        description: `Sent to ${email}`,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resend email'
      toast.error('Failed to resend verification', { description: errorMsg })
    }
  }

  const resetCreateDialog = () => {
    setCreateDialogOpen(false)
    setNewContractor({ name: '', email: '', phone: '', companyName: '' })
  }

  const filteredContractors = contractors.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending Verification</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contractors</h1>
          <p className="text-muted-foreground mt-1">
            Manage all contractors and their clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contractors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contractor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contractors.length}</p>
                <p className="text-xs text-muted-foreground">Contractors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contractors.reduce((sum, c) => sum + c.stats.clientCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contractors.reduce((sum, c) => sum + c.stats.openRequests, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Open Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <ClipboardList className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contractors.reduce((sum, c) => sum + c.stats.activeWorkOrders, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Active Work Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contractors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Clients</TableHead>
                <TableHead className="text-center">Branches</TableHead>
                <TableHead className="text-center">Open Req.</TableHead>
                <TableHead className="text-center">Active WOs</TableHead>
                <TableHead className="text-center">Total Req.</TableHead>
                <TableHead className="text-center">Total WOs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {search ? 'No contractors match your search' : 'No contractors registered yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContractors.map((contractor) => (
                  <Collapsible
                    key={contractor.id}
                    open={expandedContractors.has(contractor.id)}
                    onOpenChange={() => toggleContractor(contractor.id)}
                    asChild
                  >
                    <>
                      {/* Contractor Row */}
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded">
                              {expandedContractors.has(contractor.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {contractor.companyName || contractor.name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground">{contractor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(contractor.status)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {contractor.stats.clientCount}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {contractor.stats.branchCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {contractor.stats.openRequests > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {contractor.stats.openRequests}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {contractor.stats.activeWorkOrders > 0 ? (
                            <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100 text-xs">
                              {contractor.stats.activeWorkOrders}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {contractor.stats.totalRequests}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {contractor.stats.totalWorkOrders}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImpersonateTarget({
                                userId: contractor.userId,
                                name: contractor.companyName || contractor.name || contractor.email,
                                role: 'CONTRACTOR',
                              })
                            }}
                            title="Login as this contractor"
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Login As
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Client Rows */}
                      <CollapsibleContent asChild>
                        <>
                          {contractor.clients.length === 0 ? (
                            <TableRow>
                              <TableCell></TableCell>
                              <TableCell colSpan={9} className="py-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                                  <AlertCircle className="h-4 w-4" />
                                  No clients added yet
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            contractor.clients.map((client) => (
                              <TableRow
                                key={client.id}
                                className="bg-muted/30 border-l-2 border-l-blue-200"
                              >
                                <TableCell></TableCell>
                                <TableCell>
                                  <div className="pl-4">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                      <p className="font-medium text-sm">
                                        {client.companyName || client.name || 'Unnamed Client'}
                                      </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-5.5 ml-0.5">
                                      {client.email}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>{statusBadge(client.status)}</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-center text-sm">
                                  <div className="flex items-center justify-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    {client.branchCount}
                                  </div>
                                </TableCell>
                                <TableCell colSpan={4}></TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() =>
                                      setImpersonateTarget({
                                        userId: client.userId,
                                        name: client.companyName || client.name || client.email,
                                        role: 'CLIENT',
                                      })
                                    }
                                    title="Login as this client"
                                  >
                                    <LogIn className="h-3.5 w-3.5 mr-1" />
                                    Login As
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Impersonation Confirmation Dialog */}
      <AlertDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => !open && setImpersonateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login as User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to view the platform as{' '}
              <span className="font-semibold text-foreground">
                {impersonateTarget?.name}
              </span>{' '}
              ({impersonateTarget?.role}). You will see exactly what they see. An impersonation banner will be shown at the top.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImpersonate} disabled={impersonating}>
              {impersonating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login as {impersonateTarget?.role === 'CLIENT' ? 'Client' : 'Contractor'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Contractor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => !open && resetCreateDialog()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Contractor</DialogTitle>
            <DialogDescription>
              Create a new contractor account. They will receive a verification email to activate their account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContractor} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">Contact Name *</Label>
                <Input
                  id="create-name"
                  value={newContractor.name}
                  onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newContractor.email}
                  onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
                  placeholder="contractor@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone</Label>
                <Input
                  id="create-phone"
                  value={newContractor.phone}
                  onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                  placeholder="+966 5XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-company">Company Name</Label>
                <Input
                  id="create-company"
                  value={newContractor.companyName}
                  onChange={(e) => setNewContractor({ ...newContractor, companyName: e.target.value })}
                  placeholder="Safety Solutions LLC"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetCreateDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
