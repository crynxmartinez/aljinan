'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkOrder {
  id: string
  title: string
  description: string | null
  scheduledDate: string | null
  status: string
  type: 'scheduled' | 'adhoc'
  price: number | null
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  totalValue: number
  workOrders: WorkOrder[]
}

interface ProjectsTableProps {
  branchId: string
  onCreateProject?: () => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
    case 'ACTIVE':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
    case 'DONE':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Done</Badge>
    case 'CLOSED':
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Closed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getWorkOrderStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-yellow-600" />
    case 'SCHEDULED':
      return <Calendar className="h-4 w-4 text-blue-600" />
    case 'FOR_REVIEW':
      return <AlertCircle className="h-4 w-4 text-purple-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function ProjectsTable({ branchId, onCreateProject }: ProjectsTableProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])

  useEffect(() => {
    fetchProjects()
  }, [branchId])

  async function fetchProjects() {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        // Auto-expand active projects
        const activeProjectIds = data
          .filter((p: Project) => p.status === 'ACTIVE')
          .map((p: Project) => p.id)
        setExpandedProjects(activeProjectIds)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    )
  }

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Contracts and work orders for this branch</CardDescription>
        </div>
        <Button onClick={onCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No projects yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a project to start managing work orders for this branch
            </p>
            <Button onClick={onCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Collapsible
                key={project.id}
                open={expandedProjects.includes(project.id)}
                onOpenChange={() => toggleProject(project.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {expandedProjects.includes(project.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{project.title}</span>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.startDate)} - {formatDate(project.endDate)}
                          </span>
                          <span>{project.workOrders.length} work orders</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(project.totalValue)}</p>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t px-4 py-3 bg-muted/30">
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                      )}
                      
                      {project.workOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No work orders in this project
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase px-3 py-2">
                            <div className="col-span-1"></div>
                            <div className="col-span-4">Work Order</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Scheduled</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1 text-right">Price</div>
                          </div>
                          {project.workOrders.map((workOrder) => (
                            <div
                              key={workOrder.id}
                              className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-lg bg-background border hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <div className="col-span-1">
                                {getWorkOrderStatusIcon(workOrder.status)}
                              </div>
                              <div className="col-span-4">
                                <p className="font-medium text-sm">{workOrder.title}</p>
                                {workOrder.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {workOrder.description}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    workOrder.type === 'scheduled' 
                                      ? 'border-blue-200 text-blue-700 bg-blue-50' 
                                      : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                  )}
                                >
                                  {workOrder.type === 'scheduled' ? 'Scheduled' : 'Ad-hoc'}
                                </Badge>
                              </div>
                              <div className="col-span-2 text-sm text-muted-foreground">
                                {formatDate(workOrder.scheduledDate)}
                              </div>
                              <div className="col-span-2">
                                <Badge variant="secondary" className="text-xs">
                                  {workOrder.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="col-span-1 text-right text-sm font-medium">
                                {workOrder.price ? formatCurrency(workOrder.price) : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
