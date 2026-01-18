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
} from 'lucide-react'

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
  totalValue: number
  startDate: string | null
  endDate: string | null
  signedAt: string | null
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
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
  const [contractToSign, setContractToSign] = useState<Contract | null>(null)
  const [signing, setSigning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      PENDING_SIGNATURE: { style: 'bg-amber-100 text-amber-700', icon: PenTool, label: 'Awaiting Signature' },
      SIGNED: { style: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Signed' },
      ACTIVE: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
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

  const openSignDialog = (contract: Contract) => {
    setContractToSign(contract)
    setSignDialogOpen(true)
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
          action: 'sign',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'SIGNED')
  const pendingSignature = contracts.filter(c => c.status === 'PENDING_SIGNATURE')
  const otherContracts = contracts.filter(c => c.status !== 'ACTIVE' && c.status !== 'SIGNED' && c.status !== 'PENDING_SIGNATURE')

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
            {activeContracts.map((contract) => (
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
                      <span>{contract.fileName}</span>
                      {contract.fileSize && <span>{formatFileSize(contract.fileSize)}</span>}
                      {contract.startDate && contract.endDate && (
                        <span>
                          Valid: {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </span>
                      )}
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
                    {contract.fileUrl && (
                      <Button
                        size="sm"
                        onClick={() => window.open(contract.fileUrl!, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {selectedContract?.title}
            </DialogTitle>
            <DialogDescription>
              Contract details and work order breakdown
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-bold text-lg text-primary">
                    ${(selectedContract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {selectedContract.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium text-sm">{new Date(selectedContract.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedContract.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium text-sm">{new Date(selectedContract.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Project Details */}
              {selectedContract.project && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Project Details
                  </h3>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">{selectedContract.project.title}</h4>
                    {selectedContract.project.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedContract.project.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Work Orders */}
              {selectedContract.project?.checklists && selectedContract.project.checklists.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Work Orders
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Scheduled Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedContract.project.checklists.flatMap(checklist => 
                          checklist.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell>
                                {item.scheduledDate 
                                  ? new Date(item.scheduledDate).toLocaleDateString()
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {item.stage}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.price 
                                  ? `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                  : '-'
                                }
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between p-4 bg-primary/5 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        ${(selectedContract.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Download */}
              {selectedContract.fileUrl && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedContract.fileUrl!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open PDF
                  </Button>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = selectedContract.fileUrl!
                      link.download = selectedContract.fileName || 'contract.pdf'
                      link.click()
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Sign Contract
            </DialogTitle>
            <DialogDescription>
              Draw your signature below to sign this contract
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
              Sign Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
