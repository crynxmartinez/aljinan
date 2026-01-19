'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FolderKanban } from 'lucide-react'

interface Project {
  id: string
  title: string
  status: string
  totalValue?: number
  startDate?: string
  endDate?: string
  workOrders?: Array<{
    id: string
    title: string
    price: number | null
  }>
  _count: {
    requests: number
    quotations: number
    appointments: number
    invoices: number
    checklists: number
    contracts: number
  }
}

interface ClientProjectFilterProps {
  branchId: string
  selectedProjectId: string | null
  onProjectChange: (projectId: string | null) => void
  onProjectsLoaded?: (projects: Project[]) => void
  onLoadingChange?: (loading: boolean) => void
  refreshTrigger?: number // Increment this to trigger a refresh
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  DONE: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending Review',
  ACTIVE: 'Active',
  DONE: 'Completed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export function ClientProjectFilter({ 
  branchId, 
  selectedProjectId, 
  onProjectChange,
  onProjectsLoaded,
  onLoadingChange,
  refreshTrigger 
}: ClientProjectFilterProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        onProjectsLoaded?.(data)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [branchId, refreshTrigger])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <FolderKanban className="h-4 w-4 text-muted-foreground" />
        <div className="w-[250px] h-9 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  // If no projects, show a simple message
  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FolderKanban className="h-4 w-4" />
        <span className="text-sm">No projects yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedProjectId || 'all'}
        onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="All Projects">
            {selectedProjectId ? (
              <div className="flex items-center gap-2">
                <span className="truncate">{selectedProject?.title || 'Select project'}</span>
                {selectedProject && (
                  <Badge className={`${statusColors[selectedProject.status] || 'bg-gray-100'} text-xs`}>
                    {statusLabels[selectedProject.status] || selectedProject.status}
                  </Badge>
                )}
              </div>
            ) : (
              'All Projects'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span>All Projects</span>
              <span className="text-xs text-muted-foreground">({projects.length})</span>
            </div>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[180px]">{project.title}</span>
                <Badge className={`${statusColors[project.status] || 'bg-gray-100'} text-xs`}>
                  {statusLabels[project.status] || project.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
