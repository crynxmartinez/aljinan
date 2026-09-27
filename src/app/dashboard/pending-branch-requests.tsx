'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MapPin, Loader2, Check, X, Building2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface BranchRequest {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  phone: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  client: {
    companyName: string
    user: {
      name: string | null
      email: string
    }
  }
}

export function PendingBranchRequests() {
  const { t } = useTranslation()
  const tp = t.dashboard.pendingBranchRequests
  const router = useRouter()
  const [requests, setRequests] = useState<BranchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<BranchRequest | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/branch-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.filter((r: BranchRequest) => r.status === 'PENDING'))
      }
    } catch (err) {
      console.error('Failed to fetch branch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (request: BranchRequest) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/branch-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        fetchRequests()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to approve request:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/branch-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionNote }),
      })

      if (response.ok) {
        setRejectDialogOpen(false)
        setSelectedRequest(null)
        setRejectionNote('')
        fetchRequests()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to reject request:', err)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Building2 className="h-5 w-5" />
            {tp.title.replace('{count}', String(requests.length))}
          </CardTitle>
          <CardDescription>
            {tp.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-start justify-between p-4 bg-card border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{request.address}</p>
                {(request.city || request.state) && (
                  <p className="text-sm text-muted-foreground">
                    {request.city}{request.state ? `, ${request.state}` : ''} {request.zipCode}
                  </p>
                )}
                <p className="text-xs text-amber-600 mt-2">
                  {tp.requestedBy.replace('{name}', request.client.companyName)}
                </p>
                {request.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tp.noteLabel.replace('{note}', request.notes)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request)}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="me-1 h-4 w-4" />
                  )}
                  {tp.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(request)
                    setRejectDialogOpen(true)
                  }}
                  disabled={processing}
                >
                  <X className="me-1 h-4 w-4" />
                  {tp.reject}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tp.rejectDialogTitle}</DialogTitle>
            <DialogDescription>
              {tp.rejectDialogDescription.replace('{name}', selectedRequest?.client.companyName || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedRequest?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.address}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionNote">{tp.reasonLabel}</Label>
              <Input
                id="rejectionNote"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder={tp.reasonPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {tp.cancel}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {tp.rejectRequest}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
