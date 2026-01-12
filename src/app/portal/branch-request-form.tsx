'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { AddressPicker, AddressData } from '@/components/ui/address-picker'

interface BranchRequest {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  rejectionNote: string | null
}

export function BranchRequestForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<BranchRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: null,
    longitude: null,
  })

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/branch-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (err) {
      console.error('Failed to fetch branch requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const resetForm = () => {
    setName('')
    setPhone('')
    setNotes('')
    setAddressData({
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      latitude: null,
      longitude: null,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/branch-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          phone,
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setOpen(false)
      resetForm()
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      await fetch(`/api/branch-requests/${requestId}`, {
        method: 'DELETE',
      })
      fetchRequests()
      router.refresh()
    } catch (err) {
      console.error('Failed to cancel request:', err)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const processedRequests = requests.filter(r => r.status !== 'PENDING')

  return (
    <div className="space-y-4">
      {/* Request New Branch Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request New Branch
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request New Branch</DialogTitle>
            <DialogDescription>
              Submit a request for a new branch location. Your contractor will review and approve it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Office, Warehouse A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Search for an address or click on the map to set the branch location.
                </p>
                <AddressPicker
                  value={addressData}
                  onChange={setAddressData}
                  showManualFields={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Branch phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about this branch..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !addressData.address || !name}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Pending Requests</h3>
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 border-amber-200"
            >
              <div>
                <p className="font-medium">{request.name}</p>
                <p className="text-sm text-muted-foreground">{request.address}</p>
                <p className="text-xs text-amber-600 mt-1">Awaiting contractor approval</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelRequest(request.id)}
              >
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Processed Requests (Approved/Rejected) */}
      {processedRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Request History</h3>
          {processedRequests.slice(0, 3).map((request) => (
            <div
              key={request.id}
              className={`p-3 border rounded-lg ${
                request.status === 'APPROVED'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.address}</p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    request.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {request.status}
                </span>
              </div>
              {request.status === 'REJECTED' && request.rejectionNote && (
                <p className="text-xs text-red-600 mt-2">Reason: {request.rejectionNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
