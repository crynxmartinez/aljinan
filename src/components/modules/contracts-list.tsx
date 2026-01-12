'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileCheck,
  Plus,
  Loader2,
  MoreHorizontal,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  description: string | null
  fileName: string
  fileUrl: string
  fileSize: number | null
  startDate: string | null
  endDate: string | null
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
  createdAt: string
}

interface ContractsListProps {
  branchId: string
  projectId?: string | null
}

export function ContractsList({ branchId, projectId }: ContractsListProps) {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [newContract, setNewContract] = useState({
    title: '',
    description: '',
    fileName: '',
    fileUrl: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT' as Contract['status'],
  })

  const fetchContracts = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/contracts`)
      if (response.ok) {
        const data = await response.json()
        const filtered = projectId 
          ? data.filter((c: Contract & { projectId?: string }) => c.projectId === projectId)
          : data
        setContracts(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [branchId, projectId])

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newContract.title,
          description: newContract.description || null,
          fileName: newContract.fileName,
          fileUrl: newContract.fileUrl,
          startDate: newContract.startDate || null,
          endDate: newContract.endDate || null,
          status: newContract.status,
          projectId: projectId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create contract')
      }

      setCreateDialogOpen(false)
      setNewContract({
        title: '',
        description: '',
        fileName: '',
        fileUrl: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT',
      })
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (contractId: string, status: Contract['status']) => {
    try {
      await fetch(`/api/branches/${branchId}/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchContracts()
      router.refresh()
    } catch (err) {
      console.error('Failed to update contract:', err)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return

    try {
      await fetch(`/api/branches/${branchId}/contracts/${contractId}`, {
        method: 'DELETE',
      })
      fetchContracts()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete contract:', err)
    }
  }

  const getStatusBadge = (status: Contract['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
      ACTIVE: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
      EXPIRED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Expired' },
      TERMINATED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Terminated' },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contracts</CardTitle>
            <CardDescription>Upload and manage service contracts for this branch</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contract
          </Button>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Upload service contracts and agreements for this branch.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contract
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {contract.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{contract.fileName}</span>
                      <span>{formatFileSize(contract.fileSize)}</span>
                      {contract.startDate && contract.endDate && (
                        <span>
                          {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(contract.fileUrl, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {contract.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(contract.id, 'ACTIVE')}>
                            Activate Contract
                          </DropdownMenuItem>
                        )}
                        {contract.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(contract.id, 'TERMINATED')}>
                            Terminate Contract
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContract(contract.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contract</DialogTitle>
            <DialogDescription>
              Add a new service contract for this branch. Enter the file URL where the contract is hosted.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContract}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newContract.title}
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  placeholder="e.g., Annual Service Agreement 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newContract.description}
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  placeholder="Brief description of the contract"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name *</Label>
                <Input
                  id="fileName"
                  value={newContract.fileName}
                  onChange={(e) => setNewContract({ ...newContract, fileName: e.target.value })}
                  placeholder="e.g., contract-2026.pdf"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileUrl">File URL *</Label>
                <Input
                  id="fileUrl"
                  type="url"
                  value={newContract.fileUrl}
                  onChange={(e) => setNewContract({ ...newContract, fileUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newContract.status}
                  onValueChange={(value: Contract['status']) => setNewContract({ ...newContract, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
