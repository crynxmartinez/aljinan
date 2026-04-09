'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle, Hash } from 'lucide-react'

export default function BackfillWorkOrderNumbersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBackfill = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/backfill-work-order-numbers', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to backfill work order numbers')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Backfill Work Order Numbers</CardTitle>
          <CardDescription>
            This will assign work order numbers to all existing work orders that don't have one yet.
            Numbers will be assigned chronologically per contractor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ Important:</strong> This operation will:
            </p>
            <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc space-y-1">
              <li>Find all work orders with <code>workOrderNumber = null</code></li>
              <li>Assign sequential numbers starting from each contractor's current counter</li>
              <li>Update the contractor's counter to the next available number</li>
              <li>Process work orders in chronological order (oldest first)</li>
            </ul>
          </div>

          <Button 
            onClick={handleBackfill} 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Hash className="mr-2 h-4 w-4" />
            Backfill Work Order Numbers
          </Button>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Success!</p>
                  <p className="text-sm text-green-700">{result.message}</p>
                  <div className="mt-2 text-sm text-green-800">
                    <p><strong>Contractors Processed:</strong> {result.contractorsProcessed}</p>
                    <p><strong>Work Orders Updated:</strong> {result.workOrdersUpdated}</p>
                  </div>
                </div>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Details by Contractor</h3>
                  {result.details.map((detail: any, i: number) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-lg">{detail.contractorName}</CardTitle>
                        <CardDescription>
                          Assigned {detail.workOrdersAssigned} work order numbers
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Number Range</p>
                            <p className="font-semibold">{detail.numberRange}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">New Counter Value</p>
                            <p className="font-semibold">{detail.newCounter}</p>
                          </div>
                        </div>

                        {detail.workOrders && detail.workOrders.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold mb-2">Updated Work Orders:</p>
                            <div className="max-h-60 overflow-y-auto border rounded">
                              <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                  <tr>
                                    <th className="text-left p-2">WO #</th>
                                    <th className="text-left p-2">Description</th>
                                    <th className="text-left p-2">Client</th>
                                    <th className="text-left p-2">Branch</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.workOrders.map((wo: any, j: number) => (
                                    <tr key={j} className="border-t">
                                      <td className="p-2 font-mono">{wo.assignedNumber}</td>
                                      <td className="p-2">{wo.description}</td>
                                      <td className="p-2 text-muted-foreground">{wo.clientName}</td>
                                      <td className="p-2 text-muted-foreground">{wo.branchName}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>✅ Next step:</strong> All work orders now have proper numbers. 
                  Try printing a work order to verify!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
