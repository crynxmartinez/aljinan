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
  CornerDownRight,
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
  recurringType?: 'ONCE' | 'MONTHLY' | 'QUARTERLY'
}

// Helper function to extract base name from work order title (removes Q1, Q2, Month1, etc.)
function getBaseWorkOrderName(title: string): string {
  return title.replace(/\s*\((Q\d+|Month\d+)\)\s*$/i, '').trim()
}

// Group work orders by their base name
function groupWorkOrders(workOrders: WorkOrder[]): Map<string, WorkOrder[]> {
  const groups = new Map<string, WorkOrder[]>()
  
  for (const wo of workOrders) {
    const baseName = getBaseWorkOrderName(wo.title)
    if (!groups.has(baseName)) {
      groups.set(baseName, [])
    }
    groups.get(baseName)!.push(wo)
  }
  
  return groups
}

// Read-only collapsible grouped view for work orders
function WorkOrdersGroupedView({ workOrders }: { workOrders: WorkOrder[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const groups = groupWorkOrders(workOrders)
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }
  
  return (
    <div className="space-y-1">
      {Array.from(groups.entries()).map(([groupName, items]) => {
        const isExpanded = expandedGroups.has(groupName)
        const groupTotal = items.reduce((sum, wo) => sum + (wo.price || 0), 0)
        const isSingleItem = items.length === 1
        const hasAdhoc = items.some(wo => wo.type === 'adhoc')
        
        return (
          <div key={groupName} className="rounded-lg bg-background border">
            {/* Group Header */}
            <button
              onClick={() => !isSingleItem && toggleGroup(groupName)}
              className={cn(
                "w-full flex items-center justify-between p-3 text-left transition-colors",
                !isSingleItem && "hover:bg-muted/50 cursor-pointer",
                isSingleItem && "cursor-default"
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                {!isSingleItem && (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                )}
                {isSingleItem && (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{groupName}</span>
                    {!isSingleItem && (
                      <Badge variant="secondary" className="text-xs">
                        {items.length} occurrences
                      </Badge>
                    )}
                    {hasAdhoc && (
                      <Badge variant="outline" className="text-purple-600 text-xs">
                        Client Added
                      </Badge>
                    )}
                  </div>
                  {items[0].description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {items[0].description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm font-medium">
                {groupTotal > 0 ? formatCurrency(groupTotal) : '-'}
              </div>
            </button>
            
            {/* Single Item Details */}
            {isSingleItem && (
              <div className="px-3 pb-3 pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(items[0].scheduledDate)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {items[0].status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Expanded Items */}
            {!isSingleItem && isExpanded && (
              <div className="border-t bg-muted/30">
                {items.map((wo, idx) => (
                  <div key={wo.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2 text-sm">
                      <CornerDownRight className="h-3 w-3 text-muted-foreground ml-2" />
                      <span className="text-muted-foreground">
                        {wo.title.match(/\((Q\d+|Month\d+)\)/i)?.[1] || `#${idx + 1}`}:
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatDate(wo.scheduledDate)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {wo.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {wo.price ? formatCurrency(wo.price) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
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
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

export function ProjectsTable({ branchId, onCreateProject }: ProjectsTableProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [standaloneWorkOrders, setStandaloneWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)

  useEffect(() => {
    fetchData()
  }, [branchId])

  async function fetchData() {
    try {
      // Fetch projects
      const projectsResponse = await fetch(`/api/branches/${branchId}/projects`)
      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        setProjects(data)
        // Auto-expand active projects
        const activeProjectIds = data
          .filter((p: Project) => p.status === 'ACTIVE')
          .map((p: Project) => p.id)
        setExpandedProjects(activeProjectIds)
      }

      // Fetch all checklist items to find standalone work orders (no project)
      const workOrdersResponse = await fetch(`/api/branches/${branchId}/checklist-items`)
      if (workOrdersResponse.ok) {
        const woData = await workOrdersResponse.json()
        // Filter for standalone work orders (projectTitle is null)
        const standalone = woData
          .filter((wo: { projectTitle: string | null }) => wo.projectTitle === null)
          .map((wo: { id: string; description: string; notes: string | null; scheduledDate: string | null; stage: string; type: string; price: number | null; recurringType?: string }) => ({
            id: wo.id,
            title: wo.description,
            description: wo.notes,
            scheduledDate: wo.scheduledDate,
            status: wo.stage,
            type: wo.type === 'ADHOC' ? 'adhoc' as const : 'scheduled' as const,
            price: wo.price,
            recurringType: wo.recurringType || 'ONCE'
          }))
        setStandaloneWorkOrders(standalone)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
                        <WorkOrdersGroupedView workOrders={project.workOrders} />
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {/* Standalone Work Orders Section */}
            {standaloneWorkOrders.length > 0 && (
              <Collapsible
                open={standaloneExpanded}
                onOpenChange={() => setStandaloneExpanded(!standaloneExpanded)}
              >
                <div className="border rounded-lg border-dashed border-blue-300 bg-blue-50/30">
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {standaloneExpanded ? (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-700">Service Requests</span>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Ad-hoc</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{standaloneWorkOrders.length} work order{standaloneWorkOrders.length !== 1 ? 's' : ''} from client requests</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">
                        {formatCurrency(standaloneWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-blue-200 px-4 py-3 bg-blue-50/20">
                      <WorkOrdersGroupedView workOrders={standaloneWorkOrders} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
