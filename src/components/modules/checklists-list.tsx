'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  ClipboardList,
  Plus,
  Loader2,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  Clock,
  FileEdit,
  Play,
} from 'lucide-react'

interface ChecklistItem {
  id?: string
  description: string
  isCompleted: boolean
  notes: string | null
  order: number
}

interface Checklist {
  id: string
  title: string
  description: string | null
  items: ChecklistItem[]
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  completedAt: string | null
  notes: string | null
  createdAt: string
}

interface ChecklistsListProps {
  branchId: string
}

export function ChecklistsList({ branchId }: ChecklistsListProps) {
  const router = useRouter()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [runDialogOpen, setRunDialogOpen] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [newChecklist, setNewChecklist] = useState({
    title: '',
    description: '',
    items: [{ description: '', isCompleted: false, notes: null, order: 0 }] as ChecklistItem[],
  })

  const fetchChecklists = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklists`)
      if (response.ok) {
        const data = await response.json()
        setChecklists(data)
      }
    } catch (err) {
      console.error('Failed to fetch checklists:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecklists()
  }, [branchId])

  const handleAddItem = () => {
    setNewChecklist({
      ...newChecklist,
      items: [...newChecklist.items, { description: '', isCompleted: false, notes: null, order: newChecklist.items.length }]
    })
  }

  const handleRemoveItem = (index: number) => {
    if (newChecklist.items.length > 1) {
      setNewChecklist({
        ...newChecklist,
        items: newChecklist.items.filter((_, i) => i !== index)
      })
    }
  }

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChecklist.title,
          description: newChecklist.description || null,
          items: newChecklist.items.filter(item => item.description),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checklist')
      }

      setCreateDialogOpen(false)
      setNewChecklist({
        title: '',
        description: '',
        items: [{ description: '', isCompleted: false, notes: null, order: 0 }],
      })
      fetchChecklists()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleStartChecklist = (checklist: Checklist) => {
    setSelectedChecklist({ ...checklist })
    setRunDialogOpen(true)
  }

  const handleToggleItem = (index: number) => {
    if (!selectedChecklist) return
    const updatedItems = [...selectedChecklist.items]
    updatedItems[index].isCompleted = !updatedItems[index].isCompleted
    setSelectedChecklist({ ...selectedChecklist, items: updatedItems })
  }

  const handleSaveProgress = async (complete: boolean = false) => {
    if (!selectedChecklist) return
    setSaving(true)

    try {
      const response = await fetch(`/api/branches/${branchId}/checklists/${selectedChecklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: complete ? 'COMPLETED' : 'IN_PROGRESS',
          notes: selectedChecklist.notes,
          items: selectedChecklist.items,
        }),
      })

      if (response.ok) {
        setRunDialogOpen(false)
        setSelectedChecklist(null)
        fetchChecklists()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to save checklist:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return

    try {
      await fetch(`/api/branches/${branchId}/checklists/${checklistId}`, {
        method: 'DELETE',
      })
      fetchChecklists()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete checklist:', err)
    }
  }

  const getStatusBadge = (status: Checklist['status']) => {
    const config = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileEdit, label: 'Draft' },
      IN_PROGRESS: { style: 'bg-blue-100 text-blue-700', icon: Clock, label: 'In Progress' },
      COMPLETED: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
    }
    const { style, icon: Icon, label } = config[status]
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getCompletionRate = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0
    return Math.round((items.filter(i => i.isCompleted).length / items.length) * 100)
  }

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
            <CardTitle>Checklists & Reports</CardTitle>
            <CardDescription>Create and run inspection checklists</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Checklist
          </Button>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No checklists yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Create inspection checklists to run during visits.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Checklist
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{checklist.title}</h4>
                      {getStatusBadge(checklist.status)}
                    </div>
                    {checklist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {checklist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{checklist.items.length} items</span>
                      {checklist.status !== 'DRAFT' && (
                        <span>{getCompletionRate(checklist.items)}% complete</span>
                      )}
                      {checklist.completedAt && (
                        <span>Completed {new Date(checklist.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checklist.status !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartChecklist(checklist)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {checklist.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {checklist.status === 'COMPLETED' && (
                          <DropdownMenuItem onClick={() => handleStartChecklist(checklist)}>
                            View Report
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteChecklist(checklist.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Checklist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Checklist</DialogTitle>
            <DialogDescription>
              Create a new inspection checklist with items to check.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChecklist}>
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
                  value={newChecklist.title}
                  onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                  placeholder="e.g., Monthly Pest Inspection"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Checklist Items</Label>
                <div className="space-y-2">
                  {newChecklist.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item.description}
                        onChange={(e) => {
                          const items = [...newChecklist.items]
                          items[index].description = e.target.value
                          setNewChecklist({ ...newChecklist, items })
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={newChecklist.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Run Checklist Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.title}</DialogTitle>
            <DialogDescription>
              {selectedChecklist?.status === 'COMPLETED' ? 'Viewing completed report' : 'Check off items as you complete them'}
            </DialogDescription>
          </DialogHeader>
          {selectedChecklist && (
            <div className="space-y-4">
              <div className="space-y-3">
                {selectedChecklist.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={() => handleToggleItem(index)}
                      disabled={selectedChecklist.status === 'COMPLETED'}
                    />
                    <span className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={selectedChecklist.notes || ''}
                  onChange={(e) => setSelectedChecklist({ ...selectedChecklist, notes: e.target.value })}
                  placeholder="Add any notes or observations..."
                  rows={3}
                  disabled={selectedChecklist.status === 'COMPLETED'}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Progress: {getCompletionRate(selectedChecklist.items)}% ({selectedChecklist.items.filter(i => i.isCompleted).length}/{selectedChecklist.items.length} items)
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
              Close
            </Button>
            {selectedChecklist?.status !== 'COMPLETED' && (
              <>
                <Button variant="outline" onClick={() => handleSaveProgress(false)} disabled={saving}>
                  Save Progress
                </Button>
                <Button onClick={() => handleSaveProgress(true)} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
