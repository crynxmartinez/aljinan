'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Trash2,
} from 'lucide-react'
import { CalendarView } from './calendar-view'
import { useTranslation } from '@/lib/i18n/use-translation'

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

interface AppointmentsListProps {
  branchId: string
}

export function AppointmentsList({ branchId }: AppointmentsListProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.appointmentsList
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    assignedTo: '',
  })

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/appointments`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [branchId])

  const handleCreateAppointment = async (e: React.FormEvent, confirmImmediately: boolean = false) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      // Step 1: Create the appointment
      const response = await fetch(`/api/branches/${branchId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAppointment.title,
          description: newAppointment.description || null,
          date: newAppointment.date,
          startTime: newAppointment.startTime,
          endTime: newAppointment.endTime || null,
          assignedTo: newAppointment.assignedTo || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create appointment')
      }

      // Step 2: If confirmImmediately, update status to CONFIRMED
      if (confirmImmediately) {
        const createdAppointment = await response.json()
        await fetch(`/api/branches/${branchId}/appointments/${createdAppointment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        })
      }

      setCreateDialogOpen(false)
      setNewAppointment({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        assignedTo: '',
      })
      fetchAppointments()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await fetch(`/api/branches/${branchId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchAppointments()
      router.refresh()
    } catch (err) {
      console.error('Failed to update appointment:', err)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm(ta.deleteConfirm)) return

    try {
      await fetch(`/api/branches/${branchId}/appointments/${appointmentId}`, {
        method: 'DELETE',
      })
      fetchAppointments()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete appointment:', err)
    }
  }

  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      SCHEDULED: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: ta.statusScheduled },
      CONFIRMED: { style: 'bg-green-100 text-green-700', icon: CalendarCheck, label: ta.statusConfirmed },
      IN_PROGRESS: { style: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: ta.statusInProgress },
      COMPLETED: { style: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: ta.statusCompleted },
      CANCELLED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: ta.statusCancelled },
      RESCHEDULED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: ta.statusRescheduled },
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
      weekday: 'short',
      month: 'short',
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

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, apt) => {
    const date = apt.date.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(apt)
    return groups
  }, {} as Record<string, Appointment[]>)

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{ta.calendar}</h2>
            <p className="text-sm text-muted-foreground">{ta.calendarDesc}</p>
          </div>
        </div>

        <CalendarView branchId={branchId} />
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ta.scheduleAppointment}</DialogTitle>
            <DialogDescription>
              {ta.scheduleAppointmentDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{ta.titleLabel}</Label>
                <Input
                  id="title"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  placeholder={ta.titlePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{ta.description}</Label>
                <Textarea
                  id="description"
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                  placeholder={ta.descriptionPlaceholder}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{ta.dateLabel}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">{ta.startTimeLabel}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newAppointment.startTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{ta.endTimeLabel}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newAppointment.endTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">{ta.assignedTo}</Label>
                <Input
                  id="assignedTo"
                  value={newAppointment.assignedTo}
                  onChange={(e) => setNewAppointment({ ...newAppointment, assignedTo: e.target.value })}
                  placeholder={ta.assignedToPlaceholder}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {ta.cancel}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={(e) => handleCreateAppointment(e, false)}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ta.schedulePending}
              </Button>
              <Button
                type="submit"
                disabled={creating}
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateAppointment(e, true)
                }}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CalendarCheck className="mr-2 h-4 w-4" />
                {ta.scheduleAndConfirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
            <DialogDescription>{ta.appointmentDetails}</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedAppointment.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">{ta.date}</p>
                  <p>{formatDate(selectedAppointment.date.split('T')[0])}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">{ta.time}</p>
                  <p>
                    {formatTime(selectedAppointment.startTime)}
                    {selectedAppointment.endTime && ` - ${formatTime(selectedAppointment.endTime)}`}
                  </p>
                </div>
                {selectedAppointment.assignedTo && (
                  <div>
                    <p className="font-medium text-muted-foreground">{ta.assignedTo}</p>
                    <p>{selectedAppointment.assignedTo}</p>
                  </div>
                )}
              </div>

              {selectedAppointment.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{ta.description}</p>
                  <p className="text-sm">{selectedAppointment.description}</p>
                </div>
              )}

              {selectedAppointment.rescheduleNote && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-700">{ta.rescheduleRequested}</p>
                  <p className="text-sm text-orange-600">{selectedAppointment.rescheduleNote}</p>
                </div>
              )}

              {selectedAppointment.cancellationNote && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-700">{ta.cancellationNote}</p>
                  <p className="text-sm text-red-600">{selectedAppointment.cancellationNote}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedAppointment.status === 'CONFIRMED' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedAppointment.id, 'IN_PROGRESS')
                      setDetailDialogOpen(false)
                    }}
                    className="flex-1"
                  >
                    {ta.startAppointment}
                  </Button>
                )}
                {selectedAppointment.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedAppointment.id, 'COMPLETED')
                      setDetailDialogOpen(false)
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {ta.markComplete}
                  </Button>
                )}
                {(selectedAppointment.status === 'SCHEDULED' || selectedAppointment.status === 'RESCHEDULED') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdateStatus(selectedAppointment.id, 'CANCELLED')
                      setDetailDialogOpen(false)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {ta.cancel}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
