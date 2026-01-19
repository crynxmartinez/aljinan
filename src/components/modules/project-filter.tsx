'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, Plus, Loader2 } from 'lucide-react'

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
  autoSelectActive?: boolean // Auto-select active project on initial load
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

export function ProjectFilter({ branchId, selectedProjectId, onProjectChange, autoSelectActive = true }: ProjectFilterProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
  })

  const fetchProjects = async (isInitialLoad = false) => {
    try {
      const response = await fetch(`/api/branches/${branchId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        
        // Auto-select active project on initial load if enabled
        if (isInitialLoad && autoSelectActive && data.length > 0 && !selectedProjectId) {
          const activeProject = data.find((p: Project) => p.status === 'ACTIVE')
          if (activeProject) {
            onProjectChange(activeProject.id)
          } else {
            // Fallback to pending project if no active
            const pendingProject = data.find((p: Project) => p.status === 'PENDING')
            if (pendingProject) {
              onProjectChange(pendingProject.id)
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects(true) // Pass true for initial load
  }, [branchId])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const createdProject = await response.json()
      setCreateDialogOpen(false)
      setNewProject({ title: '', description: '' })
      fetchProjects()
      onProjectChange(createdProject.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize related requests, quotes, and other items.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g., Kitchen Renovation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Brief description of the project..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newProject.title}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
