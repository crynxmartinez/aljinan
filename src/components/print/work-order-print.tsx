'use client'

import { useEffect, useState } from 'react'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  expectedExpiry: string | null
}

interface WorkOrderPrintData {
  id: string
  workOrderNumber: number
  description: string
  notes: string | null
  stage: string
  workOrderType: string
  scheduledDate: string | null
  price: number | null
  recurringType: string | null
  occurrenceIndex: number | null
  clientName: string
  branchName: string
  branchAddress: string
  branchPhone: string | null
  inspectionDate: string | null
  systemsChecked: string | null
  findings: string | null
  deficiencies: string | null
  recommendations: string | null
  technicianName: string | null
  technicianSignature: string | null
  technicianSignedAt: string | null
  supervisorName: string | null
  supervisorSignature: string | null
  supervisorSignedAt: string | null
  clientSignedByName: string | null
  clientSignature: string | null
  clientSignedAt: string | null
  equipment: Equipment[]
}

interface WorkOrderPrintProps {
  workOrderId: string
}

export function WorkOrderPrint({ workOrderId }: WorkOrderPrintProps) {
  const [data, setData] = useState<WorkOrderPrintData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrintData()
  }, [workOrderId])

  const fetchPrintData = async () => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/print-data`)
      if (!response.ok) throw new Error('Failed to fetch print data')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching print data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (data && !loading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [data, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing document...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Failed to load work order data</p>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      FOR_REVIEW: 'For Review',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled'
    }
    return labels[stage] || stage
  }

  const getWorkOrderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SERVICE: 'Service',
      INSPECTION: 'Inspection',
      MAINTENANCE: 'Maintenance',
      INSTALLATION: 'Installation',
      STICKER_INSPECTION: 'Sticker Inspection'
    }
    return labels[type] || type
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Ensure proper height calculation for pagination */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Hide non-print elements */
          body * {
            visibility: hidden;
          }
          
          /* Show only print container */
          .print-container, .print-container * {
            visibility: visible;
          }
          
          /* Fix positioning to allow multi-page flow */
          .print-container {
            position: static !important;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          /* A4 page setup */
          @page {
            size: A4;
            margin: 20mm;
          }
          
          /* Prevent page breaks inside important elements */
          .print-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Allow page breaks before sections if needed */
          .print-section {
            page-break-before: auto;
            break-before: auto;
          }
          
          /* Prevent orphaned table rows */
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      <div className="print-container max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="border-b-4 border-primary pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">TASHEEL</h1>
              <p className="text-sm text-muted-foreground">Safety Contractor Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">WORK ORDER</h2>
              <p className="text-lg font-semibold">WO #{data.workOrderNumber}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">CLIENT INFORMATION</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-semibold">{data.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-semibold">{data.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-semibold">{data.branchAddress}</p>
            </div>
            {data.branchPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-semibold">{data.branchPhone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Work Order Details */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">WORK ORDER DETAILS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold">{getWorkOrderTypeLabel(data.workOrderType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold">{getStageLabel(data.stage)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Date</p>
              <p className="font-semibold">{formatDate(data.scheduledDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-semibold">{formatCurrency(data.price)}</p>
            </div>
            {data.recurringType && data.recurringType !== 'ONCE' && (
              <div>
                <p className="text-sm text-muted-foreground">Recurring</p>
                <p className="font-semibold">
                  {data.recurringType} ({data.occurrenceIndex || 1})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">DESCRIPTION</h3>
          <p className="whitespace-pre-wrap">{data.description}</p>
          {data.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm font-semibold mb-1">Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Equipment List (for inspections) */}
        {data.equipment && data.equipment.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">
              EQUIPMENT LIST ({data.equipment.length} items)
            </h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Equipment #</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Location</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {data.equipment.map((eq) => (
                  <tr key={eq.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{eq.equipmentNumber}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {eq.equipmentType.replace(/_/g, ' ')}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{eq.location || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{formatDate(eq.expectedExpiry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inspection Results (if completed) */}
        {data.inspectionDate && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">INSPECTION RESULTS</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Inspection Date</p>
                <p className="font-semibold">{formatDate(data.inspectionDate)}</p>
              </div>
              {data.systemsChecked && (
                <div>
                  <p className="text-sm font-semibold mb-1">Systems Checked:</p>
                  <p className="text-sm whitespace-pre-wrap">{data.systemsChecked}</p>
                </div>
              )}
              {data.findings && (
                <div>
                  <p className="text-sm font-semibold mb-1">Findings:</p>
                  <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                </div>
              )}
              {data.deficiencies && (
                <div>
                  <p className="text-sm font-semibold mb-1">Deficiencies:</p>
                  <p className="text-sm whitespace-pre-wrap text-red-600">{data.deficiencies}</p>
                </div>
              )}
              {data.recommendations && (
                <div>
                  <p className="text-sm font-semibold mb-1">Recommendations:</p>
                  <p className="text-sm whitespace-pre-wrap">{data.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technician Name (if assigned) */}
        {data.technicianName && (
          <div className="mt-8 pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Technician Assigned:</p>
            <p className="text-base">{data.technicianName}</p>
            {data.technicianSignedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Signed on: {formatDate(data.technicianSignedAt)}
              </p>
            )}
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 pt-6 border-t-2">
          <h3 className="text-lg font-bold mb-4">SIGNATURES</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold mb-4">Supervisor Signature</p>
              <div className="border-b-2 border-gray-400 h-24 mb-2 flex items-center justify-center bg-white">
                {data.supervisorSignature && data.supervisorSignature.startsWith('data:image') && (
                  <img
                    src={data.supervisorSignature}
                    alt="Supervisor signature"
                    className="max-h-20 max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Name: {data.supervisorName || '___________________'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {data.supervisorSignedAt ? formatDate(data.supervisorSignedAt) : '___________________'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-4">Client Signature</p>
              <div className="border-b-2 border-gray-400 h-24 mb-2 flex items-center justify-center bg-white">
                {data.clientSignature && data.clientSignature.startsWith('data:image') && (
                  <img
                    src={data.clientSignature}
                    alt="Client signature"
                    className="max-h-20 max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Name: {data.clientSignedByName || '___________________'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {data.clientSignedAt ? formatDate(data.clientSignedAt) : '___________________'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>This is an official work order document from Tasheel Safety Management System</p>
          <p className="mt-1">For inquiries, please contact your contractor</p>
        </div>
      </div>
    </>
  )
}
