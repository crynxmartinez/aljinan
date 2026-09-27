'use client'
import { generatedField } from '@/lib/i18n/generated-content'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ClipboardList,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { formatDate as formatDateUtil } from '@/lib/i18n/format-date'

interface ChecklistItem {
  id: string
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

interface ClientBranchReportsProps {
  branchId: string
}

export function ClientBranchReports({ branchId }: ClientBranchReportsProps) {
  const { t, locale } = useTranslation()
  const tc = t.dashboard.clientBranchReportsPage
  const [reports, setReports] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Checklist | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklists`)
      if (response.ok) {
        const data = await response.json()
        // Client only sees completed checklists (reports)
        const filtered = data.filter((c: Checklist) => c.status === 'COMPLETED')
        setReports(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [branchId])

  const handleViewReport = (report: Checklist) => {
    setSelectedReport(report)
    setViewDialogOpen(true)
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
        <CardHeader>
          <CardTitle>{tc.title}</CardTitle>
          <CardDescription>
            {tc.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{tc.noReportsYet}</h3>
              <p className="text-muted-foreground max-w-md">
                {tc.noReportsDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{report.title}</h4>
                      <Badge className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {tc.completedBadge}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {report.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{tc.itemsChecked.replace('{count}', String(report.items.length))}</span>
                      <span>{tc.percentPassed.replace('{percent}', String(getCompletionRate(report.items)))}</span>
                      {report.completedAt && (
                        <span>{tc.completedOn.replace('{date}', formatDateUtil(report.completedAt, locale))}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="me-2 h-4 w-4" />
                    {tc.viewReportBtn}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.completedAt && (
                <>{tc.completedOnFull.replace('{date}', formatDateUtil(selectedReport.completedAt, locale))}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {selectedReport.description && (
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-sm">{tc.inspectionItemsHeading}</h4>
                <div className="space-y-2">
                  {selectedReport.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg ${item.isCompleted ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
                        }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className={item.isCompleted ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}>
                          {generatedField(item, 'description', locale)}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{generatedField(item, 'notes', locale)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReport.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{tc.inspectorNotesHeading}</h4>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedReport.notes}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>{tc.totalItems}</span>
                  <span className="font-medium">{selectedReport.items.length}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>{tc.passed}</span>
                  <span className="font-medium">{selectedReport.items.filter(i => i.isCompleted).length}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>{tc.failed}</span>
                  <span className="font-medium">{selectedReport.items.filter(i => !i.isCompleted).length}</span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t">
                  <span>{tc.passRate}</span>
                  <span>{getCompletionRate(selectedReport.items)}%</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
