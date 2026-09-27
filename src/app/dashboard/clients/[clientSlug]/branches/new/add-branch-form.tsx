'use client'
import { LocalizedError } from '@/components/localized-error'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { AddressPicker, AddressData } from '@/components/ui/address-picker'
import { useTranslation } from '@/lib/i18n/use-translation'

interface AddBranchFormProps {
  clientId: string
}

export function AddBranchForm({ clientId }: AddBranchFormProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.addBranchForm
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: null,
    longitude: null,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      setError(ta.errorNameRequired)
      return
    }

    if (!addressData.address) {
      setError(ta.errorAddressRequired)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/clients/${clientId}/branches`, {
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
        throw new Error(data.error || ta.errorCreateFailed)
      }

      router.push(`/dashboard/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : ta.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{ta.cardTitle}</CardTitle>
        <CardDescription>
          {ta.cardDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              <LocalizedError message={error} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{ta.branchNameLabel}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ta.branchNamePlaceholder}
              required
            />
          </div>

          <AddressPicker
            value={addressData}
            onChange={setAddressData}
            showManualFields={true}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{ta.branchPhoneLabel}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={ta.branchPhonePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{ta.notesLabel}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={ta.notesPlaceholder}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !addressData.address || !name}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {ta.addBranch}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {ta.cancel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
