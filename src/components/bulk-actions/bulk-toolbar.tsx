'use client'

import { CheckSquare, Trash2, UserPlus, Edit, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface BulkToolbarProps {
  selectedCount: number
  onAssign?: () => void
  onChangeStatus?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onClearSelection: () => void
}

export function BulkToolbar({
  selectedCount,
  onAssign,
  onChangeStatus,
  onDelete,
  onEdit,
  onClearSelection,
}: BulkToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
        <div className="flex items-center gap-2 px-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            <Badge variant="secondary" className="mr-2">
              {selectedCount}
            </Badge>
            {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          {onAssign && (
            <Button variant="outline" size="sm" onClick={onAssign}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}

          {onChangeStatus && (
            <Button variant="outline" size="sm" onClick={onChangeStatus}>
              <Edit className="h-4 w-4 mr-2" />
              Change Status
            </Button>
          )}

          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>More Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onClearSelection}>
                Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  )
}
