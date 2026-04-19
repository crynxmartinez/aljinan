'use client'

import { useState } from 'react'
import { Filter, X, Calendar as CalendarIcon, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

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
  dateRange?: { from: string; to: string }
  onDateRangeChange?: (range: { from: string; to: string }) => void
  clients?: { id: string; name: string }[]
  selectedClients?: string[]
  onClientChange?: (clients: string[]) => void
}

export function FilterPanel({ 
  filters, 
  onFilterChange, 
  activeFilterCount = 0,
  dateRange,
  onDateRangeChange,
  clients,
  selectedClients,
  onClientChange
}: FilterPanelProps) {
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
      <SheetContent className="w-80">
        <SheetHeader className="px-1">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your results by applying filters
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-2">
          <div className="py-6 space-y-6 px-1">
            {/* Date Range Filter */}
            {onDateRangeChange && (
              <>
                <div className="space-y-3 px-4">
                  <Label className="text-sm font-medium text-foreground">Date Range</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="date-from" className="text-xs font-medium text-muted-foreground">From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateRange?.from || ''}
                        onChange={(e) => onDateRangeChange?.({ from: e.target.value, to: dateRange?.to ?? '' })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-to" className="text-xs font-medium text-muted-foreground">To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateRange?.to || ''}
                        onChange={(e) => onDateRangeChange?.({ from: dateRange?.from ?? '', to: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
                <Separator className="my-2" />
              </>
            )}

            {/* Client Filter */}
            {clients && clients.length > 0 && onClientChange && (
              <>
                <div className="space-y-3 px-4">
                  <Label className="text-sm font-medium text-foreground">Clients</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10"
                      >
                        <span className="text-sm">
                          {selectedClients && selectedClients.length > 0
                            ? `${selectedClients.length} selected`
                            : 'Select clients...'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {clients.map((client) => (
                          <div
                            key={client.id}
                            className={cn(
                              "flex items-center space-x-2 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent",
                              selectedClients?.includes(client.id) && "bg-accent"
                            )}
                            onClick={() => {
                              if (selectedClients?.includes(client.id)) {
                                onClientChange(selectedClients.filter(id => id !== client.id))
                              } else {
                                onClientChange([...(selectedClients || []), client.id])
                              }
                            }}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedClients?.includes(client.id)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50"
                            )}>
                              {selectedClients?.includes(client.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <span className="text-sm">{client.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Separator className="my-2" />
              </>
            )}

            {/* Status and Type Filters */}
            {localFilters.map((group) => {
              const selectedCount = group.options.filter(opt => opt.checked).length
              return (
                <div key={group.id} className="space-y-3 px-4">
                  <Label className="text-sm font-medium text-foreground">{group.label}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10"
                      >
                        <span className="text-sm">
                          {selectedCount > 0
                            ? `${selectedCount} selected`
                            : `Select ${group.label.toLowerCase()}...`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {group.options.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "flex items-center space-x-2 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent",
                              option.checked && "bg-accent"
                            )}
                            onClick={() => handleToggle(group.id, option.value)}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              option.checked
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50"
                            )}>
                              {option.checked && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <SheetFooter className="flex gap-2 px-1">
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
