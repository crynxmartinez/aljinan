'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileCheck,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  Building,
  ClipboardList,
  PenTool,
  RotateCcw,
  Award,
  Calendar,
} from 'lucide-react'
import { ContractWorkOrdersDisplay } from '@/components/modules/contract-work-orders-display'
import { ContractAttachmentsSection } from '@/components/modules/contract-attachments-section'

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
  certificateFileName: string | null
  certificateUrl: string | null
  totalValue: number
  startDate: string | null
  endDate: string | null
  startSignedAt: string | null
  endSignedAt: string | null
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'COMPLETED' | 'EXPIRED' | 'TERMINATED'
  createdAt: string
  project: Project | null
}

interface ClientBranchContractsProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchContracts({ branchId, projectId }: ClientBranchContractsProps) {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [endSignDialogOpen, setEndSignDialogOpen] = useState(false)
  const [contractToSign, setContractToSign] = useState<Contract | null>(null)
  const [signing, setSigning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const endCanvasRef = useRef<HTMLCanvasElement>(null)

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

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const getStatusBadge = (status: Contract['status']) => {
    const config: Record<string, { style: string; icon: typeof FileText; label: string }> = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
      PENDING_SIGNATURE: { style: 'bg-amber-100 text-amber-700', icon: PenTool, label: 'Awaiting Start Signature' },
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
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const clearEndSignature = () => {
    const canvas = endCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const openSignDialog = (contract: Contract) => {
    setContractToSign(contract)
    setSignDialogOpen(true)
  }

  const openEndSignDialog = (contract: Contract) => {
    setContractToSign(contract)
    setEndSignDialogOpen(true)
  }

  // Check if all work orders are completed for a contract
  const areAllWorkOrdersCompleted = (contract: Contract): boolean => {
    if (!contract.project) return false
    const allItems = contract.project.checklists.flatMap(c => c.items)
    return allItems.length > 0 && allItems.every(item => item.stage === 'COMPLETED')
  }

  const handleSign = async () => {
    if (!contractToSign || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const signatureDataUrl = canvas.toDataURL('image/png')
    
    // Check if canvas is empty
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = !imageData.data.some((channel, index) => index % 4 !== 3 ? channel !== 0 : channel !== 0)
    
    if (isEmpty) {
      alert('Please draw your signature before signing')
      return
    }

    setSigning(true)
    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${contractToSign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_sign',
          signatureUrl: signatureDataUrl
        })
      })

      if (response.ok) {
        setSignDialogOpen(false)
        setContractToSign(null)
        clearSignature()
        fetchContracts()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to sign contract:', err)
    } finally {
      setSigning(false)
    }
  }

  const handleEndSign = async () => {
    if (!contractToSign || !endCanvasRef.current) return
    
    const canvas = endCanvasRef.current
    const signatureDataUrl = canvas.toDataURL('image/png')
    
    // Check if canvas is empty
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = !imageData.data.some((channel, index) => index % 4 !== 3 ? channel !== 0 : channel !== 0)
    
    if (isEmpty) {
      alert('Please draw your signature before signing')
      return
    }

    setSigning(true)
    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${contractToSign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_sign',
          signatureUrl: signatureDataUrl
        })
      })

      if (response.ok) {
        setEndSignDialogOpen(false)
        setContractToSign(null)
        clearEndSignature()
        fetchContracts()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to complete contract')
      }
    } catch (err) {
      console.error('Failed to complete contract:', err)
    } finally {
      setSigning(false)
    }
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

  const activeContracts = contracts.filter(c => c.status === 'SIGNED')
  const completedContracts = contracts.filter(c => c.status === 'COMPLETED')
  const pendingSignature = contracts.filter(c => c.status === 'PENDING_SIGNATURE')
  const otherContracts = contracts.filter(c => c.status !== 'SIGNED' && c.status !== 'COMPLETED' && c.status !== 'PENDING_SIGNATURE')

  return (
    <div className="space-y-6">
      {/* Contracts Pending Signature */}
      {pendingSignature.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <PenTool className="h-5 w-5" />
              Awaiting Your Signature
            </CardTitle>
            <CardDescription>
              Please review and sign these contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSignature.map((contract) => (
              <div
                key={contract.id}
                className="p-4 bg-white border border-amber-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Value: ${(contract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContract(contract)
                        setDetailsOpen(true)
                      }}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openSignDialog(contract)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <PenTool className="mr-2 h-4 w-4" />
                      Sign Contract
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Active Contracts
            </CardTitle>
            <CardDescription>
              Your current service agreements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeContracts.map((contract) => {
              const workOrders = contract.project?.checklists.flatMap(c => c.items) || []
              const completedCount = workOrders.filter(i => i.stage === 'COMPLETED').length
              
              return (
              <div
                key={contract.id}
                className="p-4 bg-white border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground">
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
                      <span className="font-medium text-primary">
                        ${(contract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContract(contract)
                        setDetailsOpen(true)
                      }}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {areAllWorkOrdersCompleted(contract) && (
                      <Button
                        size="sm"
                        onClick={() => openEndSignDialog(contract)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PenTool className="mr-2 h-4 w-4" />
                        Sign to Complete
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Indicator Badges & Progress */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    
                    {workOrders.length > 0 && (
                      <Badge 
                        variant="outline" 
                        className={completedCount === workOrders.length 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        {completedCount}/{workOrders.length} Work Orders
                      </Badge>
                    )}
                    
                    {!areAllWorkOrdersCompleted(contract) && workOrders.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Complete all work orders to finalize
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </CardContent>
        </Card>
      )}

      {/* Completed Contracts - With Downloads */}
      {completedContracts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              Completed Contracts
            </CardTitle>
            <CardDescription>
              Finalized contracts with all documents available for download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedContracts.map((contract) => (
              <div
                key={contract.id}
                className="p-4 bg-white border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground">
                        {contract.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {contract.startDate && contract.endDate && (
                        <span>
                          {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="font-medium text-green-700">
                        ${(contract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContract(contract)
                      setDetailsOpen(true)
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
                {/* Download Section */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Available Downloads</p>
                  <div className="flex flex-wrap gap-2">
                    {contract.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(contract.fileUrl!, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {contract.fileName || 'Contract PDF'}
                      </Button>
                    )}
                    {contract.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(contract.certificateUrl!, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {contract.certificateFileName || 'Certificate'}
                      </Button>
                    )}
                    {!contract.fileUrl && !contract.certificateUrl && (
                      <p className="text-sm text-muted-foreground">No documents attached</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            Service contracts and agreements for this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
              <p className="text-muted-foreground max-w-md">
                Service contracts from your contractor will appear here. You can view and download them.
              </p>
            </div>
          ) : otherContracts.length === 0 && activeContracts.length > 0 ? (
            <p className="text-center text-muted-foreground py-4">
              All contracts are shown in the active section above.
            </p>
          ) : (
            <div className="space-y-3">
              {otherContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{contract.fileName}</span>
                      {contract.startDate && contract.endDate && (
                        <span>
                          {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContract(contract)
                      setDetailsOpen(true)
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    ${(selectedContract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        <span className="text-muted-foreground">Start: Awaiting your signature</span>
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
                        <span className="text-muted-foreground">End: Complete all work orders first</span>
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
                  isContractor={false}
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

      {/* Start Signature Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Accept & Sign Contract
            </DialogTitle>
            <DialogDescription>
              Draw your signature below to accept and start this contract
            </DialogDescription>
          </DialogHeader>

          {contractToSign && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{contractToSign.title}</p>
                <p className="text-sm text-muted-foreground">
                  Total Value: ${(contractToSign.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Your Signature</p>
                  <Button variant="ghost" size="sm" onClick={clearSignature}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg p-1 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Draw your signature using your mouse or touchpad
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Signature Dialog */}
      <Dialog open={endSignDialogOpen} onOpenChange={setEndSignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Contract
            </DialogTitle>
            <DialogDescription>
              All work orders are completed. Sign below to finalize this contract.
            </DialogDescription>
          </DialogHeader>

          {contractToSign && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">{contractToSign.title}</p>
                <p className="text-sm text-green-700">
                  Total Value: ${(contractToSign.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                {contractToSign.project && (
                  <p className="text-sm text-green-700 mt-1">
                    {contractToSign.project.checklists.flatMap(c => c.items).length} work orders completed
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Your Final Signature</p>
                  <Button variant="ghost" size="sm" onClick={clearEndSignature}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg p-1 bg-white">
                  <canvas
                    ref={endCanvasRef}
                    width={400}
                    height={150}
                    className="w-full cursor-crosshair"
                    onMouseDown={(e) => {
                      const canvas = endCanvasRef.current
                      if (!canvas) return
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      setIsDrawing(true)
                      const rect = canvas.getBoundingClientRect()
                      ctx.beginPath()
                      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawing) return
                      const canvas = endCanvasRef.current
                      if (!canvas) return
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      const rect = canvas.getBoundingClientRect()
                      ctx.lineWidth = 2
                      ctx.lineCap = 'round'
                      ctx.strokeStyle = '#000'
                      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                      ctx.stroke()
                    }}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Draw your signature to confirm completion of all services
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndSign} disabled={signing} className="bg-green-600 hover:bg-green-700">
              {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
