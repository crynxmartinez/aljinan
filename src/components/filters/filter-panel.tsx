'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  value: string
  label: string
  checked: boolean
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

interface FilterPanelProps {
  filters: FilterGroup[]
  onFilterChange: (filters: FilterGroup[]) => void
  activeFilterCount?: number
}

export function FilterPanel({ filters, onFilterChange, activeFilterCount = 0 }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (groupId: string, optionValue: string) => {
    const updated = localFilters.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          options: group.options.map(opt =>
            opt.value === optionValue ? { ...opt, checked: !opt.checked } : opt
          ),
        }
      }
      return group
    })
    setLocalFilters(updated)
  }

  const handleClearAll = () => {
    const cleared = localFilters.map(group => ({
      ...group,
      options: group.options.map(opt => ({ ...opt, checked: false })),
    }))
    setLocalFilters(cleared)
  }

  const handleApply = () => {
    onFilterChange(localFilters)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setLocalFilters(filters)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your results by applying filters
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {localFilters.map((group) => (
            <div key={group.id} className="space-y-3">
              <Label className="text-sm font-semibold">{group.label}</Label>
              <div className="space-y-2">
                {group.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${group.id}-${option.value}`}
                      checked={option.checked}
                      onCheckedChange={() => handleToggle(group.id, option.value)}
                    />
                    <label
                      htmlFor={`${group.id}-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function QuickFilters({
  filters,
  onFilterClick,
}: {
  filters: { label: string; value: string; active: boolean }[]
  onFilterClick: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={filter.active ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterClick(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
