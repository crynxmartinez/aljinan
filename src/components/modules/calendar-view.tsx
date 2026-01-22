'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ChecklistItemStage = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED'
type ChecklistItemType = 'SCHEDULED' | 'ADHOC'

interface ScheduledTask {
  id: string
  description: string
  notes: string | null
  stage: ChecklistItemStage
  type: ChecklistItemType
  scheduledDate: string
  price: number | null
  checklistTitle: string
  projectTitle: string | null
}

interface CalendarViewProps {
  branchId: string
  projectId?: string | null
}

const STAGE_COLORS: Record<ChecklistItemStage, string> = {
  REQUESTED: 'bg-yellow-500',
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  FOR_REVIEW: 'bg-purple-500',
  COMPLETED: 'bg-green-500',
}

const STAGE_LABELS: Record<ChecklistItemStage, string> = {
  REQUESTED: 'Requested',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  FOR_REVIEW: 'For Review',
  COMPLETED: 'Completed',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

export function CalendarView({ branchId, projectId }: CalendarViewProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [branchId, projectId])

  async function fetchTasks() {
    try {
      const url = projectId 
        ? `/api/branches/${branchId}/checklist-items?projectId=${projectId}`
        : `/api/branches/${branchId}/checklist-items`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Filter only items with scheduled dates
        const scheduledTasks = data.filter((item: ScheduledTask) => item.scheduledDate)
        setTasks(scheduledTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate)
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      )
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
  }

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTask(task)
    setDetailsOpen(true)
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get tasks for selected date or today
  const displayDate = selectedDate || new Date()
  const tasksForSelectedDate = getTasksForDate(displayDate)

  // Get all upcoming tasks
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingTasks = tasks
    .filter(task => new Date(task.scheduledDate) >= today)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 10)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthName}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-muted/30 rounded-lg" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(year, month, day)
                const dayTasks = getTasksForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === date.toDateString()

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'h-24 p-1 rounded-lg border cursor-pointer transition-colors overflow-hidden',
                      isToday && 'border-primary',
                      isSelected && 'bg-primary/10 border-primary',
                      !isToday && !isSelected && 'hover:bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      isToday && 'text-primary'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTaskClick(task)
                          }}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate text-white',
                            STAGE_COLORS[task.stage]
                          )}
                        >
                          {task.description}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              {Object.entries(STAGE_COLORS).map(([stage, color]) => (
                <div key={stage} className="flex items-center gap-1.5 text-xs">
                  <div className={cn('w-3 h-3 rounded', color)} />
                  <span className="text-muted-foreground">{STAGE_LABELS[stage as ChecklistItemStage]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Upcoming Tasks'
              }
            </CardTitle>
            <CardDescription>
              {selectedDate 
                ? `${tasksForSelectedDate.length} task${tasksForSelectedDate.length !== 1 ? 's' : ''} scheduled`
                : `Next ${upcomingTasks.length} scheduled tasks`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {(selectedDate ? tasksForSelectedDate : upcomingTasks).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedDate ? tasksForSelectedDate : upcomingTasks).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-2 h-2 rounded-full mt-2', STAGE_COLORS[task.stage])} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{task.description}</p>
                          {!selectedDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(task.scheduledDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs',
                                task.type === 'ADHOC' 
                                  ? 'border-yellow-300 text-yellow-700 bg-yellow-50' 
                                  : 'border-blue-300 text-blue-700 bg-blue-50'
                              )}
                            >
                              {task.type === 'ADHOC' ? 'Ad-hoc' : 'Scheduled'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {STAGE_LABELS[task.stage]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedDate && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setSelectedDate(null)}
              >
                Show All Upcoming
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              Scheduled work order details
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{selectedTask.description}</p>
              </div>
              
              {selectedTask.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                  <p className="text-sm">{selectedTask.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Scheduled Date</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedTask.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge className={cn(STAGE_COLORS[selectedTask.stage], 'text-white')}>
                    {STAGE_LABELS[selectedTask.stage]}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                  <Badge variant="outline">
                    {selectedTask.type === 'ADHOC' ? 'Ad-hoc' : 'Scheduled'}
                  </Badge>
                </div>
                
                {selectedTask.price && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Price</h4>
                    <p className="text-lg font-semibold text-green-700">
                      {formatCurrency(selectedTask.price)}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedTask.projectTitle && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Project</h4>
                  <p className="text-sm">{selectedTask.projectTitle}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
