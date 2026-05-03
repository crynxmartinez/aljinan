'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Wrench,
  AlertCircle,
  MapPin,
} from 'lucide-react'

interface TechnicianDetails {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  jobTitle: string | null
  teamRole: 'SUPERVISOR' | 'TECHNICIAN'
}

interface TechnicianDetailsModalProps {
  technicianId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TechnicianDetailsModal({
  technicianId,
  open,
  onOpenChange,
}: TechnicianDetailsModalProps) {
  const [technician, setTechnician] = useState<TechnicianDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && technicianId) {
      fetchTechnicianDetails()
    } else {
      setTechnician(null)
      setError(null)
    }
  }, [open, technicianId])

  const fetchTechnicianDetails = async () => {
    if (!technicianId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/team-members/${technicianId}/public`)
      if (!response.ok) {
        throw new Error('Failed to fetch technician details')
      }
      const data = await response.json()
      setTechnician(data)
    } catch (err) {
      setError('Unable to load technician details')
      console.error('Error fetching technician:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Technician Details
          </DialogTitle>
          <DialogDescription>
            Contact information for the assigned technician
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : technician ? (
          <div className="space-y-4">
            {/* Name and Role */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {technician.teamRole === 'SUPERVISOR' ? (
                    <Shield className="h-6 w-6 text-primary" />
                  ) : (
                    <Wrench className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{technician.name}</p>
                  {technician.jobTitle && (
                    <p className="text-sm text-muted-foreground">{technician.jobTitle}</p>
                  )}
                </div>
              </div>
              <Badge variant={technician.teamRole === 'SUPERVISOR' ? 'default' : 'secondary'}>
                {technician.teamRole === 'SUPERVISOR' ? 'Supervisor' : 'Technician'}
              </Badge>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h4>

              {/* Email */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${technician.email}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {technician.email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {technician.phone ? (
                    <a
                      href={`tel:${technician.phone}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {technician.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
                  {technician.address ? (
                    <p className="text-sm font-medium whitespace-pre-line">{technician.address}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>
              </div>

              {/* Job Title */}
              {technician.jobTitle && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="text-sm font-medium">{technician.jobTitle}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
