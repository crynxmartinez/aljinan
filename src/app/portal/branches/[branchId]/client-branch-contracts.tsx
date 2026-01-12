'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileCheck,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
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

interface ClientBranchContractsProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchContracts({ branchId, projectId }: ClientBranchContractsProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!bytes) return ''
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

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE')
  const otherContracts = contracts.filter(c => c.status !== 'ACTIVE')

  return (
    <div className="space-y-6">
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
                      onClick={() => window.open(contract.fileUrl, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = contract.fileUrl
                        link.download = contract.fileName
                        link.click()
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
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
                    onClick={() => window.open(contract.fileUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
