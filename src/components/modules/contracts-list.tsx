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
  Upload,
  Link as LinkIcon,
  Award,
  ClipboardList,
  Calendar,
  PenTool,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ContractWorkOrdersDisplay } from './contract-work-orders-display'
import { ContractAttachmentsSection } from './contract-attachments-section'

interface WorkOrder {
  id: string
  description: string
  price: number | null
  scheduledDate: string | null
  stage: string
}

interface Checklist {
  id: string
  title: string
  items: WorkOrder[]
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  totalValue: number
  checklists: Checklist[]
}

interface Contract {
  id: string
  title: string
  description: string | null
  fileName: string | null
  fileUrl: string | null
  fileSize: number | null
  startDate: string | null
  endDate: string | null
  startSignedAt: string | null
  endSignedAt: string | null
  startSignatureUrl: string | null
  endSignatureUrl: string | null
  certificateFileName: string | null
  certificateUrl: string | null
  totalValue: number | null
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'COMPLETED' | 'EXPIRED' | 'TERMINATED'
  createdAt: string
  project: Project | null
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [attachPdfDialogOpen, setAttachPdfDialogOpen] = useState(false)
  const [attachCertDialogOpen, setAttachCertDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [creating, setCreating] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [certUrl, setCertUrl] = useState('')
  const [certFileName, setCertFileName] = useState('')

  const [newContract, setNewContract] = useState({
    title: '',
    description: '',
    fileName: '',
    fileUrl: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT' as Contract['status'],
  })

  // Standalone work orders state
  const [standaloneWorkOrders, setStandaloneWorkOrders] = useState<{ id: string; description: string; scheduledDate: string | null; stage: string; price: number | null; workOrderType: string | null }[]>([])
  const [stickerInspections, setStickerInspections] = useState<{ id: string; description: string; scheduledDate: string | null; stage: string; price: number | null; workOrderType: string | null }[]>([])
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
  const [stickerInspectionsExpanded, setStickerInspectionsExpanded] = useState(true)

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

  const fetchStandaloneWorkOrders = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`)
      if (response.ok) {
        const data = await response.json()
        // Filter for standalone work orders (projectTitle is null) - excludes sticker inspections
        const standalone = data.filter((wo: { projectTitle: string | null; workOrderType: string | null }) => 
          wo.projectTitle === null && wo.workOrderType !== 'STICKER_INSPECTION'
        )
        setStandaloneWorkOrders(standalone)
        // Filter for sticker inspections
        const stickers = data.filter((wo: { projectTitle: string | null; workOrderType: string | null }) => 
          wo.projectTitle === null && wo.workOrderType === 'STICKER_INSPECTION'
        )
        setStickerInspections(stickers)
      }
    } catch (err) {
      console.error('Failed to fetch standalone work orders:', err)
    }
  }

  useEffect(() => {
    fetchContracts()
    fetchStandaloneWorkOrders()
  }, [branchId, projectId])

  const handleCreateContract = async (e: React.FormEvent, activateImmediately: boolean = false) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      // Step 1: Create the contract
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
          status: activateImmediately ? 'ACTIVE' : 'DRAFT',
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

  const openAttachPdfDialog = (contract: Contract) => {
    setSelectedContract(contract)
    setPdfUrl(contract.fileUrl || '')
    setPdfFileName(contract.fileName || '')
    setError('')
    setAttachPdfDialogOpen(true)
  }

  const handleAttachPdf = async () => {
    if (!selectedContract) return
    setAttaching(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: pdfUrl,
          fileName: pdfFileName || 'Contract Document.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to attach PDF')
      }

      setAttachPdfDialogOpen(false)
      setPdfUrl('')
      setPdfFileName('')
      setSelectedContract(null)
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAttaching(false)
    }
  }

  const openAttachCertDialog = (contract: Contract) => {
    setSelectedContract(contract)
    setCertUrl(contract.certificateUrl || '')
    setCertFileName(contract.certificateFileName || '')
    setError('')
    setAttachCertDialogOpen(true)
  }

  const handleAttachCert = async () => {
    if (!selectedContract) return
    setAttaching(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateUrl: certUrl,
          certificateFileName: certFileName || 'Certificate.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to attach certificate')
      }

      setAttachCertDialogOpen(false)
      setCertUrl('')
      setCertFileName('')
      setSelectedContract(null)
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAttaching(false)
    }
  }

  const getStatusBadge = (status: Contract['status']) => {
    const config: Record<string, { style: string; icon: typeof FileText; label: string }> = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
      PENDING_SIGNATURE: { style: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Awaiting Signature' },
      SIGNED: { style: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Active' },
      COMPLETED: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
      EXPIRED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Expired' },
      TERMINATED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Terminated' },
    }
    const { style, icon: Icon, label } = config[status] || config.DRAFT
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
              {contracts.map((contract) => {
                const workOrderCount = contract.project?.checklists.flatMap(c => c.items).length || 0
                
                return (
                <div
                  key={contract.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedContract(contract)
                    setDetailDialogOpen(true)
                  }}
                >
                  <div className="flex items-start justify-between">
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
                        {contract.startDate && contract.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                          </span>
                        )}
                        {contract.totalValue && (
                          <span className="font-medium text-primary">
                            SAR {contract.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {workOrderCount > 0 && (
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" />
                            {workOrderCount} work orders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicator Badges */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Badge 
                      variant="outline" 
                      className={contract.fileUrl 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "bg-gray-50 text-gray-500 border-gray-200"
                      }
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF {contract.fileUrl ? '✓' : '—'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={contract.certificateUrl 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-gray-50 text-gray-500 border-gray-200"
                      }
                    >
                      <Award className="h-3 w-3 mr-1" />
                      Cert {contract.certificateUrl ? '✓' : '—'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={contract.startSignedAt 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-gray-50 text-gray-500 border-gray-200"
                      }
                    >
                      <PenTool className="h-3 w-3 mr-1" />
                      Signed {contract.startSignedAt ? '✓' : '—'}
                    </Badge>
                    
                    <div className="flex-1" />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedContract(contract)
                        setDetailDialogOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Requests Section - Read-only, no signatures needed */}
      {standaloneWorkOrders.length > 0 && (
        <Collapsible open={standaloneExpanded} onOpenChange={setStandaloneExpanded}>
          <Card className="border-blue-200 bg-blue-50/30 mt-6">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {standaloneExpanded ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronRight className="h-5 w-5 text-blue-600" />}
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <ClipboardList className="h-5 w-5" />
                      Service Requests
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-700">Ad-hoc</Badge>
                    <Badge variant="secondary">{standaloneWorkOrders.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-700">
                      SAR {standaloneWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-600">Total Value</p>
                  </div>
                </div>
                <CardDescription className="text-blue-600 text-left mt-2">
                  Work orders from client service requests. No contract signature required.
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {standaloneWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                    >
                      <div className="space-y-1">
                        <span className="font-medium">{wo.description}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {wo.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(wo.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {wo.stage}
                          </Badge>
                        </div>
                      </div>
                      {wo.price && (
                        <span className="font-semibold text-blue-700">
                          SAR {wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    These work orders were approved when the client accepted the quote. No additional signature is required.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Sticker Inspections Section - Read-only, no signatures needed */}
      {stickerInspections.length > 0 && (
        <Collapsible open={stickerInspectionsExpanded} onOpenChange={setStickerInspectionsExpanded}>
          <Card className="border-amber-200 bg-amber-50/30 mt-6">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stickerInspectionsExpanded ? <ChevronDown className="h-5 w-5 text-amber-600" /> : <ChevronRight className="h-5 w-5 text-amber-600" />}
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <ClipboardList className="h-5 w-5" />
                      Sticker Inspections
                    </CardTitle>
                    <Badge className="bg-amber-100 text-amber-700">Equipment</Badge>
                    <Badge variant="secondary">{stickerInspections.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700">
                      SAR {stickerInspections.reduce((sum, wo) => sum + (wo.price || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-amber-600">Total Value</p>
                  </div>
                </div>
                <CardDescription className="text-amber-600 text-left mt-2">
                  Equipment sticker inspections. No contract signature required.
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {stickerInspections.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                    >
                      <div className="space-y-1">
                        <span className="font-medium">{wo.description}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {wo.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(wo.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {wo.stage}
                          </Badge>
                        </div>
                      </div>
                      {wo.price && (
                        <span className="font-semibold text-amber-700">
                          SAR {wo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    These equipment inspections were approved when the client accepted the quote. No additional signature is required.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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
              <Button 
                type="button" 
                variant="outline"
                disabled={creating}
                onClick={(e) => handleCreateContract(e, false)}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button 
                type="submit" 
                disabled={creating}
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateContract(e, true)
                }}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Create & Activate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {selectedContract?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedContract?.description || 'Contract details and work orders'}
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                  <p className="font-bold text-lg text-primary">
                    SAR {(selectedContract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {selectedContract.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedContract.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedContract.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedContract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Signatures Status */}
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <PenTool className="h-4 w-4" />
                  Signatures
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedContract.startSignedAt ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Start: Signed on {new Date(selectedContract.startSignedAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-muted-foreground">Start: Awaiting signature</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedContract.endSignedAt ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>End: Signed on {new Date(selectedContract.endSignedAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">End: Pending completion</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Orders Section */}
              {selectedContract.project && selectedContract.project.checklists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Work Orders
                  </h3>
                  <ContractWorkOrdersDisplay 
                    workOrders={selectedContract.project.checklists.flatMap(c => c.items)}
                    showStatus={true}
                  />
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Documents & Attachments
                </h3>
                <ContractAttachmentsSection
                  contractId={selectedContract.id}
                  branchId={branchId}
                  fileUrl={selectedContract.fileUrl}
                  fileName={selectedContract.fileName}
                  certificateUrl={selectedContract.certificateUrl}
                  certificateFileName={selectedContract.certificateFileName}
                  isContractor={true}
                  onUpdate={() => {
                    fetchContracts()
                    router.refresh()
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attach PDF Dialog */}
      <Dialog open={attachPdfDialogOpen} onOpenChange={setAttachPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Contract PDF</DialogTitle>
            <DialogDescription>
              Add a PDF document to this contract. The client will be able to view it before signing.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdfFileName">File Name</Label>
              <Input
                id="pdfFileName"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder="e.g., Service Agreement 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF URL *</Label>
              <Input
                id="pdfUrl"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL where the PDF is hosted (Google Drive, Dropbox, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachPdfDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttachPdf} disabled={attaching || !pdfUrl}>
              {attaching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Attach PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Certificate Dialog */}
      <Dialog open={attachCertDialogOpen} onOpenChange={setAttachCertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Certificate</DialogTitle>
            <DialogDescription>
              Add a certificate document to this contract. The client will be able to download it after signing.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certFileName">File Name</Label>
              <Input
                id="certFileName"
                value={certFileName}
                onChange={(e) => setCertFileName(e.target.value)}
                placeholder="e.g., Service Certificate 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certUrl">Certificate URL *</Label>
              <Input
                id="certUrl"
                value={certUrl}
                onChange={(e) => setCertUrl(e.target.value)}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL where the certificate is hosted (Google Drive, Dropbox, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachCertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttachCert} disabled={attaching || !certUrl}>
              {attaching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Attach Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
