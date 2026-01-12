'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  CalendarX,
  RefreshCw,
} from 'lucide-react'

interface Appointment {
  id: string
  title: string
  description: string | null
  date: string
  startTime: string
  endTime: string | null
  duration: number | null
  assignedTo: string | null
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  confirmedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  cancellationNote: string | null
  rescheduleNote: string | null
  createdAt: string
}

interface ClientBranchAppointmentsProps {
  branchId: string
  projectId?: string | null
}

export function ClientBranchAppointments({ branchId, projectId }: ClientBranchAppointmentsProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | 'request_reschedule' | null>(null)
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/appointments`)
      if (response.ok) {
        const data = await response.json()
        const filtered = projectId 
          ? data.filter((a: Appointment & { projectId?: string }) => a.projectId === projectId)
          : data
        setAppointments(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [branchId, projectId])

  const handleAction = async () => {
    if (!selectedAppointment || !actionType) return

    setProcessing(true)
    try {
      const body: Record<string, string> = { action: actionType }
      if (actionType === 'cancel') body.cancellationNote = note
      if (actionType === 'request_reschedule') body.rescheduleNote = note

      const response = await fetch(`/api/branches/${branchId}/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setActionDialogOpen(false)
        setSelectedAppointment(null)
        setActionType(null)
        setNote('')
        fetchAppointments()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to process action:', err)
    } finally {
      setProcessing(false)
    }
  }

  const openActionDialog = (appointment: Appointment, action: 'confirm' | 'cancel' | 'request_reschedule') => {
    setSelectedAppointment(appointment)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      SCHEDULED: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Awaiting Confirmation' },
      CONFIRMED: { style: 'bg-green-100 text-green-700', icon: CalendarCheck, label: 'Confirmed' },
      IN_PROGRESS: { style: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'In Progress' },
      COMPLETED: { style: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Completed' },
      CANCELLED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
      RESCHEDULED: { style: 'bg-orange-100 text-orange-700', icon: RefreshCw, label: 'Reschedule Requested' },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${minutes} ${ampm}`
  }

  // Separate upcoming and past appointments
  const now = new Date()
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) >= now && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
  )
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.date) < now || apt.status === 'COMPLETED' || apt.status === 'CANCELLED'
  )

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
      <div className="space-y-6">
        {/* Pending Confirmation */}
        {upcomingAppointments.filter(a => a.status === 'SCHEDULED').length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Clock className="h-5 w-5" />
                Awaiting Your Confirmation
              </CardTitle>
              <CardDescription>
                Please confirm or reschedule these appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments
                .filter(a => a.status === 'SCHEDULED')
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 bg-white border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{appointment.title}</h4>
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {appointment.description}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(appointment.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(appointment.startTime)}
                        {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                      </span>
                    </div>
                    {appointment.assignedTo && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Technician: {appointment.assignedTo}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionDialog(appointment, 'request_reschedule')}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Request Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionDialog(appointment, 'cancel')}
                      >
                        <CalendarX className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openActionDialog(appointment, 'confirm')}
                      >
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Scheduled visits and inspections for this branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.filter(a => a.status !== 'SCHEDULED').length === 0 && 
             upcomingAppointments.filter(a => a.status === 'SCHEDULED').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground max-w-md">
                  Your contractor will schedule appointments for visits and inspections. You&apos;ll be able to confirm or request rescheduling.
                </p>
              </div>
            ) : upcomingAppointments.filter(a => a.status !== 'SCHEDULED').length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                All upcoming appointments are shown in the confirmation section above.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments
                  .filter(a => a.status !== 'SCHEDULED')
                  .map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{appointment.title}</h4>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(appointment.date)}</span>
                            <span>
                              {formatTime(appointment.startTime)}
                              {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                            </span>
                          </div>
                          {appointment.assignedTo && (
                            <p className="text-sm text-muted-foreground">
                              Technician: {appointment.assignedTo}
                            </p>
                          )}
                        </div>
                        {appointment.status === 'CONFIRMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openActionDialog(appointment, 'cancel')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{appointment.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' && 'Confirm Appointment'}
              {actionType === 'cancel' && 'Cancel Appointment'}
              {actionType === 'request_reschedule' && 'Request Reschedule'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' && 'Confirm that you are available for this appointment.'}
              {actionType === 'cancel' && 'Please provide a reason for cancelling this appointment.'}
              {actionType === 'request_reschedule' && 'Let your contractor know when you would prefer to reschedule.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="py-4">
              <div className="p-4 bg-muted/50 rounded-lg mb-4">
                <p className="font-medium">{selectedAppointment.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.startTime)}
                </p>
              </div>

              {(actionType === 'cancel' || actionType === 'request_reschedule') && (
                <div className="space-y-2">
                  <Label htmlFor="note">
                    {actionType === 'cancel' ? 'Reason for cancellation' : 'Preferred times'}
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      actionType === 'cancel' 
                        ? 'Please explain why you need to cancel...'
                        : 'Let us know your preferred dates and times...'
                    }
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'cancel' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'confirm' && 'Confirm Appointment'}
              {actionType === 'cancel' && 'Cancel Appointment'}
              {actionType === 'request_reschedule' && 'Request Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
