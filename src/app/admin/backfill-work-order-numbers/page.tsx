'use client'
import { LocalizedError } from '@/components/localized-error'
import { TranslatedText } from '@/components/translated-text'


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
          <CardTitle><TranslatedText path="copy.Backfill_Work_Order_Numbers" /></CardTitle>
          <CardDescription><TranslatedText path="copy.This_will_assign_work_order_numbers_to_all_existing_work_orders_t" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong><TranslatedText path="copy.Important" /></strong>{' '}<TranslatedText path="copy.This_operation_will" /></p>
            <ul className="text-sm text-yellow-800 mt-2 ms-4 list-disc space-y-1">
              <li><TranslatedText path="copy.Find_all_work_orders_with" />{' '}<code>workOrderNumber = null</code></li>
              <li><TranslatedText path="copy.Assign_sequential_numbers_starting_from_each_contractor_s_current" /></li>
              <li><TranslatedText path="copy.Update_the_contractor_s_counter_to_the_next_available_number" /></li>
              <li><TranslatedText path="copy.Process_work_orders_in_chronological_order_oldest_first" /></li>
            </ul>
          </div>

          <Button 
            onClick={handleBackfill} 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            <Hash className="me-2 h-4 w-4" /><TranslatedText path="copy.Backfill_Work_Order_Numbers" /></Button>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900"><TranslatedText path="copy.Error" /></p>
                <p className="text-sm text-red-700"><LocalizedError message={error} /></p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900"><TranslatedText path="copy.Success" /></p>
                  <p className="text-sm text-green-700">{result.message}</p>
                  <div className="mt-2 text-sm text-green-800">
                    <p><strong><TranslatedText path="copy.Contractors_Processed" /></strong> {result.contractorsProcessed}</p>
                    <p><strong><TranslatedText path="copy.Work_Orders_Updated" /></strong> {result.workOrdersUpdated}</p>
                  </div>
                </div>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg"><TranslatedText path="copy.Details_by_Contractor" /></h3>
                  {result.details.map((detail: any, i: number) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-lg">{detail.contractorName}</CardTitle>
                        <CardDescription><TranslatedText path="dashboard.clientBranchRequestsPage.assignedFallback" />{' '}{detail.workOrdersAssigned}{' '}<TranslatedText path="copy.work_order_numbers" /></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground"><TranslatedText path="copy.Number_Range" /></p>
                            <p className="font-semibold">{detail.numberRange}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground"><TranslatedText path="copy.New_Counter_Value" /></p>
                            <p className="font-semibold">{detail.newCounter}</p>
                          </div>
                        </div>

                        {detail.workOrders && detail.workOrders.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold mb-2"><TranslatedText path="copy.Updated_Work_Orders" /></p>
                            <div className="max-h-60 overflow-y-auto border rounded">
                              <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                  <tr>
                                    <th className="text-start p-2">WO #</th>
                                    <th className="text-start p-2"><TranslatedText path="dashboard.workOrdersPage.description" /></th>
                                    <th className="text-start p-2"><TranslatedText path="system.client" /></th>
                                    <th className="text-start p-2"><TranslatedText path="dashboard.portalWorkOrdersPage.branch" /></th>
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
                  <strong><TranslatedText path="copy.Next_step" /></strong>{' '}<TranslatedText path="copy.All_work_orders_now_have_proper_numbers_Try_printing_a_work_order" /></p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
