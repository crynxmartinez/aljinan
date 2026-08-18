'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
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
  Key,
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
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t } = useTranslation()
  const tc = t.dashboard.adminContractorsPage
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [inquiryId, setInquiryId] = useState<string | null>(null)

  useEffect(() => {
    fetchContractors()
  }, [])

  // Handle URL parameters from messages page
  useEffect(() => {
    const shouldCreate = searchParams.get('create')
    if (shouldCreate === 'true') {
      const name = searchParams.get('name') || ''
      const email = searchParams.get('email') || ''
      const phone = searchParams.get('phone') || ''
      const company = searchParams.get('company') || ''
      const fromInquiryId = searchParams.get('inquiryId') || null

      // Pre-fill form with data from message
      setNewContractor({ name, email, phone, companyName: company })
      setInquiryId(fromInquiryId)

      // Open dialog
      setCreateDialogOpen(true)

      // Clean URL (remove params)
      router.replace('/admin/contractors')
    }
  }, [searchParams, router])

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

        // The grant is a single-use token the server just issued for this one target.
        // It carries the authorisation; nothing here asserts it.
        const result = await signIn('credentials', {
          email: data.email,
          grant: data.grant,
          redirect: false,
        })

        if (result?.ok) {
          // Redirect to appropriate dashboard
          window.location.href = data.redirectUrl
        } else {
          toast.error(tc.failedImpersonation)
        }
      } else {
        // Includes the 503 returned while impersonation is being rebuilt securely.
        const data = await response.json().catch(() => null)
        toast.error(data?.error || tc.failedImpersonation)
      }
    } catch (err) {
      console.error('Failed to impersonate:', err)
      toast.error(tc.failedImpersonation)
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
        body: JSON.stringify({ ...newContractor, inquiryId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(tc.contractorCreated, {
        description: inquiryId
          ? tc.inquiryConverted
          : `${tc.verificationSent} ${data.user.email}`,
      })

      resetCreateDialog()
      fetchContractors()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : tc.failedToCreateContractor
      toast.error(tc.failedToCreate, { description: errorMsg })
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

      toast.success(tc.verificationResent, {
        description: `${tc.sentTo} ${email}`,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : tc.failedToResendEmail
      toast.error(tc.failedToResend, { description: errorMsg })
    }
  }

  const handleResendVerificationAdmin = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/resend-verification`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(tc.verificationResent, {
        description: `${tc.sentTo} ${email}`
      })
    } catch (err) {
      toast.error(tc.failedToResendEmail, {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const handleManualActivate = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(tc.accountActivated, {
        description: `Password: ${data.tempPassword} (sent to ${email})`
      })
      fetchContractors()
    } catch (err) {
      toast.error(tc.failedToActivate, {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const resetCreateDialog = () => {
    setCreateDialogOpen(false)
    setNewContractor({ name: '', email: '', phone: '', companyName: '' })
    setInquiryId(null)
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{tc.verified}</Badge>
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{tc.pendingVerification}</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{tc.archived}</Badge>
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
          <h1 className="text-3xl font-bold">{tc.title}</h1>
          <p className="text-muted-foreground mt-1">
            {tc.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tc.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {tc.addContractor}
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
                <p className="text-xs text-muted-foreground">{tc.contractors}</p>
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
                <p className="text-xs text-muted-foreground">{tc.totalClients}</p>
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
                <p className="text-xs text-muted-foreground">{tc.openRequests}</p>
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
                <p className="text-xs text-muted-foreground">{tc.activeWorkOrders}</p>
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
                <TableHead>{tc.status}</TableHead>
                <TableHead className="text-center">{tc.clients}</TableHead>
                <TableHead className="text-center">{tc.branches}</TableHead>
                <TableHead className="text-center">{tc.openReq}</TableHead>
                <TableHead className="text-center">{tc.activeWOs}</TableHead>
                <TableHead className="text-center">{tc.totalReq}</TableHead>
                <TableHead className="text-center">{tc.totalWOs}</TableHead>
                <TableHead className="text-right">{tc.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {search ? tc.noMatch : tc.noContractors}
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
                              {contractor.companyName || contractor.name || tc.unnamed}
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
                          <div className="flex items-center justify-end gap-2">
                            {contractor.status === 'PENDING' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendVerificationAdmin(contractor.userId, contractor.email)}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  {tc.resendEmail}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleManualActivate(contractor.userId, contractor.email)}
                                >
                                  <Key className="h-4 w-4 mr-1" />
                                  {tc.activate}
                                </Button>
                              </>
                            ) : (
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
                                title={tc.loginAsContractor}
                              >
                                <LogIn className="h-4 w-4 mr-1" />
                                {tc.loginAs}
                              </Button>
                            )}
                          </div>
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
                                  {tc.noClientsAdded}
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
                                        {client.companyName || client.name || tc.unnamedClient}
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
                                  <div className="flex items-center justify-end gap-2">
                                    {client.status === 'PENDING' ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => handleResendVerificationAdmin(client.userId, client.email)}
                                        >
                                          <Mail className="h-3.5 w-3.5 mr-1" />
                                          {tc.resendEmail}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => handleManualActivate(client.userId, client.email)}
                                        >
                                          <Key className="h-3.5 w-3.5 mr-1" />
                                          {tc.activate}
                                        </Button>
                                      </>
                                    ) : (
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
                                        title={tc.loginAsClient}
                                      >
                                        <LogIn className="h-3.5 w-3.5 mr-1" />
                                        {tc.loginAs}
                                      </Button>
                                    )}
                                  </div>
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
            <AlertDialogTitle>{tc.loginAsUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc.loginAsUserDesc}{' '}
              <span className="font-semibold text-foreground">
                {impersonateTarget?.name}
              </span>{' '}
              ({impersonateTarget?.role}). {tc.loginAsUserDesc2}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImpersonate} disabled={impersonating}>
              {impersonating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc.switching}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {impersonateTarget?.role === 'CLIENT' ? tc.loginAsClient : tc.loginAsContractor}
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
            <DialogTitle>{tc.addNewContractor}</DialogTitle>
            <DialogDescription>
              {tc.addNewContractorDesc}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContractor} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-name">{tc.contactName}</Label>
              <Input
                id="create-name"
                value={newContractor.name}
                onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">{tc.email}</Label>
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
              <Label htmlFor="create-phone">{tc.phone}</Label>
              <Input
                id="create-phone"
                value={newContractor.phone}
                onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                placeholder="+966 5XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company">{tc.companyName}</Label>
              <Input
                id="create-company"
                value={newContractor.companyName}
                onChange={(e) => setNewContractor({ ...newContractor, companyName: e.target.value })}
                placeholder="Safety Solutions LLC"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetCreateDialog}>
                {tc.cancel}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tc.creating}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {tc.createAccount}
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
