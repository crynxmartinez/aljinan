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
  _count: {
    requests: number
    quotations: number
    appointments: number
    invoices: number
    checklists: number
    contracts: number
  }
}

interface ProjectFilterProps {
  branchId: string
  selectedProjectId: string | null
  onProjectChange: (projectId: string | null) => void
}

const statusColors: Record<string, string> = {
  INQUIRY: 'bg-gray-100 text-gray-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  INVOICED: 'bg-cyan-100 text-cyan-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function ProjectFilter({ branchId, selectedProjectId, onProjectChange }: ProjectFilterProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/branches/${branchId}/projects`)
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [branchId])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedProjectId || 'all'}
        onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="All Projects">
            {selectedProjectId ? (
              <div className="flex items-center gap-2">
                <span className="truncate">{selectedProject?.title || 'Select project'}</span>
                {selectedProject && (
                  <Badge className={`${statusColors[selectedProject.status]} text-xs`}>
                    {selectedProject.status.replace('_', ' ')}
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
                <span className="truncate max-w-[150px]">{project.title}</span>
                <Badge className={`${statusColors[project.status]} text-xs`}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
