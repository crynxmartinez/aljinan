'use client'
import { LocalizedError } from '@/components/localized-error'

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
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t } = useTranslation()
  const tr = t.dashboard.branchRequestForm
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
        throw new Error(data.error || tr.submitFailed)
      }

      setOpen(false)
      resetForm()
      fetchRequests()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm(tr.cancelRequestConfirm)) return

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

  return (
    <>
      {/* Request New Branch Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {tr.requestNewBranch}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr.requestNewBranch}</DialogTitle>
            <DialogDescription>
              {tr.requestNewBranchDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                <LocalizedError message={error} />
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{tr.branchNameLabel}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr.branchNamePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{tr.locationLabel}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {tr.locationDesc}
                </p>
                <AddressPicker
                  value={addressData}
                  onChange={setAddressData}
                  showManualFields={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{tr.phoneLabel}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={tr.phonePlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{tr.notesLabel}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr.notesPlaceholder}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tr.cancelBtn}
              </Button>
              <Button type="submit" disabled={loading || !addressData.address || !name}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {tr.submitRequest}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  )
}
