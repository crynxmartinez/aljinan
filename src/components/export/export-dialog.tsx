'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
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
import { useTranslation } from '@/lib/i18n/use-translation'

interface ExportDialogProps {
  title?: string
  description?: string
  itemCount: number
  onExport: (format: string, options: Record<string, boolean>, dateRange?: { from: string; to: string }) => void
  showDateRange?: boolean
}

export function ExportDialog({
  title,
  description,
  itemCount,
  onExport,
  showDateRange = false,
}: ExportDialogProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.exportDialog
  const resolvedTitle = title ?? ta.exportData
  const resolvedDescription = description ?? ta.chooseExportFormat
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
      value: 'excel',
      label: ta.excelSpreadsheet,
      description: ta.editableXlsx,
      icon: FileSpreadsheet,
    },
    {
      value: 'pdf',
      label: ta.pdfReport,
      description: ta.professionalFormattedReport,
      icon: FileText,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {ta.export}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Filter */}
          {showDateRange && (
            <div className="space-y-3">
              <Label>{ta.dateRange}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{ta.from}</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{ta.to}</label>
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
            <Label>{ta.selectFormat}</Label>
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
            <Label>{ta.include}</Label>
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
                  {ta.workOrderDetails}
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
                  {ta.clientInformation}
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
                  {ta.pricing}
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
                  {ta.datesAndStatus}
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
                  {ta.photosAndAttachments}
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{itemCount}</span> {ta.itemsWillBeExported}{' '}
              <span className="font-medium text-foreground">
                {formatOptions.find((f) => f.value === format)?.label}
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {ta.cancel}
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>{ta.exporting}</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {ta.export}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
