'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Loader2,
  Mail,
  Phone,
  Building2,
  Clock,
  ChevronDown,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  companyName: string | null
  message: string
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'DECLINED'
  adminNotes: string | null
  convertedToId: string | null
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-100' },
  CONTACTED: { label: 'Contacted', color: 'text-amber-700', bg: 'bg-amber-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-700', bg: 'bg-purple-100' },
  CONVERTED: { label: 'Converted', color: 'text-green-700', bg: 'bg-green-100' },
  DECLINED: { label: 'Declined', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function MessagesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setInquiries(data)
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateInquiry = async (id: string, status?: string, adminNotes?: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes }),
      })
      if (response.ok) {
        const updated = await response.json()
        setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err)
    } finally {
      setSaving(false)
    }
  }

  const selectedInquiry = inquiries.find((i) => i.id === selectedId)

  const filteredInquiries = inquiries.filter((i) => {
    if (filter === 'ALL') return true
    return i.status === filter
  })

  const newCount = inquiries.filter((i) => i.status === 'NEW').length

  function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Contact form inquiries from potential contractors
          </p>
        </div>
        {newCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {newCount} new
          </Badge>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'DECLINED'].map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'All' : statusConfig[s]?.label || s}
            {s !== 'ALL' && (
              <span className="ml-1.5 text-xs">
                ({inquiries.filter((i) => i.status === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inquiry List */}
        <div className="lg:col-span-1 space-y-2">
          {filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No inquiries {filter !== 'ALL' ? `with status "${statusConfig[filter]?.label}"` : 'yet'}</p>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === inquiry.id ? 'ring-2 ring-primary' : ''
                  } ${inquiry.status === 'NEW' ? 'border-l-4 border-l-blue-500' : ''}`}
                onClick={() => {
                  setSelectedId(inquiry.id)
                  setEditingNotes(inquiry.adminNotes || '')
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{inquiry.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inquiry.email}</p>
                    </div>
                    <Badge className={`${statusConfig[inquiry.status]?.bg} ${statusConfig[inquiry.status]?.color} text-xs shrink-0`}>
                      {statusConfig[inquiry.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{inquiry.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(inquiry.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Inquiry Detail */}
        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedInquiry.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted {new Date(selectedInquiry.createdAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Select
                    value={selectedInquiry.status}
                    onValueChange={(value) => updateInquiry(selectedInquiry.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                      <SelectItem value="DECLINED">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedInquiry.phone}`} className="text-primary hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}
                  {selectedInquiry.companyName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {selectedInquiry.companyName}
                    </div>
                  )}
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Message</h3>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Admin Notes</h3>
                  <Textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add internal notes about this inquiry..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => updateInquiry(selectedInquiry.id, undefined, editingNotes)}
                    disabled={saving || editingNotes === (selectedInquiry.adminNotes || '')}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save Notes
                  </Button>
                </div>

                {/* Quick Actions */}
                {selectedInquiry.status !== 'CONVERTED' && selectedInquiry.status !== 'DECLINED' && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to contractors page with pre-filled data
                          const params = new URLSearchParams({
                            create: 'true',
                            name: selectedInquiry.name,
                            email: selectedInquiry.email,
                            phone: selectedInquiry.phone || '',
                            company: selectedInquiry.companyName || '',
                            inquiryId: selectedInquiry.id,
                          })
                          window.location.href = `/admin/contractors?${params.toString()}`
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Create Account
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select an inquiry</p>
                <p className="text-sm">Click on an inquiry from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
