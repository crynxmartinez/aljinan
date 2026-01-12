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
  Calendar,
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
  projectId?: string | null
}

export function AppointmentsList({ branchId, projectId }: AppointmentsListProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
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
          projectId: projectId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create appointment')
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
    if (!confirm('Are you sure you want to delete this appointment?')) return

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
      SCHEDULED: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Scheduled' },
      CONFIRMED: { style: 'bg-green-100 text-green-700', icon: CalendarCheck, label: 'Confirmed' },
      IN_PROGRESS: { style: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'In Progress' },
      COMPLETED: { style: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Completed' },
      CANCELLED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
      RESCHEDULED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Reschedule Requested' },
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              Schedule and manage visits for this branch
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Schedule your first appointment for this branch. The client will be notified and can confirm.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAppointments)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, dayAppointments]) => (
                  <div key={date}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">
                      {formatDate(date)}
                    </h4>
                    <div className="space-y-3">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-muted-foreground">
                                {formatTime(appointment.startTime)}
                                {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                              </span>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <h4 className="font-medium">{appointment.title}</h4>
                            {appointment.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {appointment.description}
                              </p>
                            )}
                            {appointment.rescheduleNote && (
                              <p className="text-sm text-orange-600">
                                Reschedule requested: {appointment.rescheduleNote}
                              </p>
                            )}
                            {appointment.cancellationNote && (
                              <p className="text-sm text-red-600">
                                Cancellation note: {appointment.cancellationNote}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {appointment.status === 'CONFIRMED' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'IN_PROGRESS')}>
                                  Start Appointment
                                </DropdownMenuItem>
                              )}
                              {appointment.status === 'IN_PROGRESS' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}>
                                  Mark Completed
                                </DropdownMenuItem>
                              )}
                              {(appointment.status === 'SCHEDULED' || appointment.status === 'RESCHEDULED') && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'CANCELLED')}>
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Schedule a visit or inspection for this branch.
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  placeholder="e.g., Monthly Inspection"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                  placeholder="Additional details about this appointment"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newAppointment.startTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newAppointment.endTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={newAppointment.assignedTo}
                  onChange={(e) => setNewAppointment({ ...newAppointment, assignedTo: e.target.value })}
                  placeholder="Technician name (optional)"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
