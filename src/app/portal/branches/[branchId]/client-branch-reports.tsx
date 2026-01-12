'use client'

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
  projectId?: string | null
}

export function ClientBranchReports({ branchId, projectId }: ClientBranchReportsProps) {
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
        let filtered = data.filter((c: Checklist) => c.status === 'COMPLETED')
        // Also filter by projectId if selected
        if (projectId) {
          filtered = filtered.filter((c: Checklist & { projectId?: string }) => c.projectId === projectId)
        }
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
  }, [branchId, projectId])

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
          <CardTitle>Inspection Reports</CardTitle>
          <CardDescription>
            Completed inspection checklists and reports for this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground max-w-md">
                Completed inspection reports from your contractor will appear here.
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
                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {report.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{report.items.length} items checked</span>
                      <span>{getCompletionRate(report.items)}% passed</span>
                      {report.completedAt && (
                        <span>Completed {new Date(report.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Report
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
                <>Completed on {new Date(selectedReport.completedAt).toLocaleDateString()}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {selectedReport.description && (
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Inspection Items</h4>
                <div className="space-y-2">
                  {selectedReport.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg ${
                        item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className={item.isCompleted ? 'text-green-800' : 'text-red-800'}>
                          {item.description}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReport.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Inspector Notes</h4>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedReport.notes}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Items</span>
                  <span className="font-medium">{selectedReport.items.length}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Passed</span>
                  <span className="font-medium">{selectedReport.items.filter(i => i.isCompleted).length}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Failed</span>
                  <span className="font-medium">{selectedReport.items.filter(i => !i.isCompleted).length}</span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t">
                  <span>Pass Rate</span>
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
