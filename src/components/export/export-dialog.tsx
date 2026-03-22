'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

interface ExportDialogProps {
  title?: string
  description?: string
  itemCount: number
  onExport: (format: string, options: Record<string, boolean>, dateRange?: { from: string; to: string }) => void
  showDateRange?: boolean
}

export function ExportDialog({
  title = 'Export Data',
  description = 'Choose export format and options',
  itemCount,
  onExport,
  showDateRange = false,
}: ExportDialogProps) {
  const [format, setFormat] = useState('excel')
  const [options, setOptions] = useState({
    includeDetails: true,
    includeClient: true,
    includePricing: true,
    includeDates: true,
    includePhotos: false,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const dateRange = (showDateRange && dateFrom && dateTo)
        ? { from: dateFrom, to: dateTo }
        : undefined
      await onExport(format, options, dateRange)
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Report',
      description: 'Professional formatted report',
      icon: FileText,
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Editable .xlsx file',
      icon: FileSpreadsheet,
    },
    {
      value: 'csv',
      label: 'CSV File',
      description: 'Comma-separated values',
      icon: File,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Filter */}
          {showDateRange && (
            <div className="space-y-3">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Select Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setFormat(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="details"
                  checked={options.includeDetails}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDetails: checked as boolean })
                  }
                />
                <label htmlFor="details" className="text-sm cursor-pointer">
                  Work order details
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="client"
                  checked={options.includeClient}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeClient: checked as boolean })
                  }
                />
                <label htmlFor="client" className="text-sm cursor-pointer">
                  Client information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pricing"
                  checked={options.includePricing}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includePricing: checked as boolean })
                  }
                />
                <label htmlFor="pricing" className="text-sm cursor-pointer">
                  Pricing
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dates"
                  checked={options.includeDates}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDates: checked as boolean })
                  }
                />
                <label htmlFor="dates" className="text-sm cursor-pointer">
                  Dates and status
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="photos"
                  checked={options.includePhotos}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includePhotos: checked as boolean })
                  }
                />
                <label htmlFor="photos" className="text-sm cursor-pointer">
                  Photos and attachments
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{itemCount}</span> items
              will be exported as{' '}
              <span className="font-medium text-foreground">
                {formatOptions.find((f) => f.value === format)?.label}
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
