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
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ChecklistItemStage = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'FOR_REVIEW' | 'COMPLETED'
type ChecklistItemType = 'SCHEDULED' | 'ADHOC'

interface ChecklistItem {
  id: string
  description: string
  notes: string | null
  stage: ChecklistItemStage
  type: ChecklistItemType
  scheduledDate: string | null
  price: number | null
  isCompleted: boolean
  checklistId: string
  checklistTitle: string
  projectTitle: string | null
}

interface ChecklistKanbanProps {
  branchId: string
  projectId?: string | null
}

const STAGES: { id: ChecklistItemStage; label: string; color: string; bgColor: string; icon: typeof Clock }[] = [
  { id: 'REQUESTED', label: 'Requested', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', icon: AlertCircle },
  { id: 'SCHEDULED', label: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Calendar },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: Clock },
  { id: 'FOR_REVIEW', label: 'For Review', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: FileText },
  { id: 'COMPLETED', label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
]

function formatDate(dateString: string | null) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function ChecklistKanban({ branchId, projectId }: ChecklistKanbanProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [branchId, projectId])

  async function fetchItems() {
    try {
      const url = projectId 
        ? `/api/branches/${branchId}/checklist-items?projectId=${projectId}`
        : `/api/branches/${branchId}/checklist-items`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch checklist items:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemsByStage = (stage: ChecklistItemStage) => {
    return items.filter(item => item.stage === stage)
  }

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Work Orders
              </CardTitle>
              <CardDescription>
                Kanban view of all approved work orders
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {items.length} total items
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No work orders yet</p>
              <p className="text-sm text-muted-foreground">
                Work orders will appear here once quotations are approved
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageItems = getItemsByStage(stage.id)
                const StageIcon = stage.icon
                
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'flex-shrink-0 w-72 rounded-lg border-2',
                      stage.bgColor
                    )}
                  >
                    <div className={cn('p-3 border-b', stage.bgColor)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StageIcon className={cn('h-4 w-4', stage.color)} />
                          <span className={cn('font-semibold text-sm', stage.color)}>
                            {stage.label}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stageItems.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[400px] p-2">
                      <div className="space-y-2">
                        {stageItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <p className="font-medium text-sm line-clamp-2 mb-2">
                              {item.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {item.type === 'ADHOC' ? (
                                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                                    Ad-hoc
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                                    Scheduled
                                  </Badge>
                                )}
                              </div>
                              
                              {item.scheduledDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.scheduledDate)}
                                </div>
                              )}
                            </div>
                            
                            {item.price && (
                              <div className="mt-2 text-xs font-medium text-green-700">
                                {formatCurrency(item.price)}
                              </div>
                            )}
                            
                            {item.projectTitle && (
                              <div className="mt-2 text-xs text-muted-foreground truncate">
                                {item.projectTitle}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {stageItems.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No items
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Work Order Details</DialogTitle>
            <DialogDescription>
              View details for this work order
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{selectedItem.description}</p>
              </div>
              
              {selectedItem.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Stage</h4>
                  <Badge className={cn(
                    STAGES.find(s => s.id === selectedItem.stage)?.bgColor,
                    STAGES.find(s => s.id === selectedItem.stage)?.color
                  )}>
                    {STAGES.find(s => s.id === selectedItem.stage)?.label}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                  <Badge variant="outline">
                    {selectedItem.type === 'ADHOC' ? 'Ad-hoc' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
              
              {selectedItem.scheduledDate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Scheduled Date</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedItem.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {selectedItem.price && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Price</h4>
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(selectedItem.price)}
                  </p>
                </div>
              )}
              
              {selectedItem.projectTitle && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Project</h4>
                  <p className="text-sm">{selectedItem.projectTitle}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
