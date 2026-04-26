'use client'

import { useEffect, useState } from 'react'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  expectedExpiry: string | null
}

interface RequestPrintData {
  id: string
  requestNumber: number | null
  title: string
  description: string | null
  priority: string
  status: string
  workOrderType: string | null
  recurringType: string | null
  needsCertificate: boolean | null
  preferredDate: string | null
  preferredTimeSlot: string | null
  quotedPrice: number | null
  quotedDate: string | null
  quotedAt: string | null
  clientName: string
  branchName: string
  branchAddress: string
  branchPhone: string | null
  createdAt: string
  equipment: Equipment[]
}

interface RequestQuotePrintProps {
  requestId: string
  branchId: string
  onClose: () => void
}

export function RequestQuotePrint({ requestId, branchId, onClose }: RequestQuotePrintProps) {
  const [data, setData] = useState<RequestPrintData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrintData()
  }, [requestId])

  const fetchPrintData = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/requests/${requestId}/print-data`)
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
        onClose()
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
        <p className="text-red-600">Failed to load request data</p>
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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      URGENT: 'Urgent'
    }
    return labels[priority] || priority
  }

  const getWorkOrderTypeLabel = (type: string | null) => {
    if (!type) return '-'
    const labels: Record<string, string> = {
      SERVICE: 'Service',
      INSPECTION: 'Inspection',
      MAINTENANCE: 'Maintenance',
      INSTALLATION: 'Installation',
      STICKER_INSPECTION: 'Sticker Inspection'
    }
    return labels[type] || type
  }

  const getRecurringLabel = (type: string | null) => {
    if (!type || type === 'ONCE') return 'One-time'
    const labels: Record<string, string> = {
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      SEMI_ANNUALLY: 'Semi-Annually',
      ANNUALLY: 'Annually'
    }
    return labels[type] || type
  }

  const isQuoted = data.status === 'QUOTED' || data.quotedPrice

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
              <h2 className="text-2xl font-bold mb-1">
                {isQuoted ? 'SERVICE QUOTATION' : 'SERVICE REQUEST'}
              </h2>
              {data.requestNumber && (
                <p className="text-lg font-semibold">REQ #{data.requestNumber}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6">
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

        {/* Request Details */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">REQUEST DETAILS</h3>
          <div className="mb-3">
            <p className="text-lg font-bold">{data.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Service Type</p>
              <p className="font-semibold">{getWorkOrderTypeLabel(data.workOrderType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="font-semibold">{getPriorityLabel(data.priority)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-semibold">{getRecurringLabel(data.recurringType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Certificate Required</p>
              <p className="font-semibold">{data.needsCertificate ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested Date</p>
              <p className="font-semibold">{formatDate(data.createdAt)}</p>
            </div>
            {data.preferredDate && (
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date</p>
                <p className="font-semibold">{formatDate(data.preferredDate)}</p>
              </div>
            )}
            {data.preferredTimeSlot && (
              <div>
                <p className="text-sm text-muted-foreground">Preferred Time</p>
                <p className="font-semibold">{data.preferredTimeSlot}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">DESCRIPTION</h3>
            <p className="whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        {/* Equipment List */}
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

        {/* Quotation Section (if quoted) */}
        {isQuoted && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-900">QUOTATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Service Price</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.quotedPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Proposed Date</p>
                <p className="text-lg font-semibold text-blue-900">{formatDate(data.quotedDate)}</p>
              </div>
              {data.quotedAt && (
                <div>
                  <p className="text-sm text-blue-700">Quote Date</p>
                  <p className="font-semibold text-blue-900">{formatDate(data.quotedAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="text-sm font-bold mb-2">TERMS & CONDITIONS</h3>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Payment terms as per agreement</li>
            <li>• Service to be completed as per scheduled date</li>
            {data.needsCertificate && <li>• Certificate will be issued upon completion</li>}
            <li>• Any additional work requires separate quotation</li>
            <li>• Cancellation policy as per contract terms</li>
          </ul>
        </div>

        {/* Signature Section */}
        {isQuoted && (
          <div className="mt-8 pt-6 border-t-2">
            <h3 className="text-lg font-bold mb-4">CLIENT ACCEPTANCE</h3>
            <div className="mb-6 p-4 border-2 border-gray-300 rounded">
              <label className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 border-2 border-gray-400"></div>
                <span className="font-semibold">I accept this quotation and authorize the work to proceed</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-4">Authorized Signature</p>
                <div className="border-b-2 border-gray-400 h-16 mb-2"></div>
                <p className="text-xs text-muted-foreground">Name: ___________________</p>
                <p className="text-xs text-muted-foreground mt-1">Position: ___________________</p>
                <p className="text-xs text-muted-foreground mt-1">Date: ___________________</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-4">Company Stamp</p>
                <div className="border-2 border-gray-400 h-24 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>This is an official {isQuoted ? 'quotation' : 'request'} document from Tasheel Safety Management System</p>
          <p className="mt-1">For inquiries, please contact your contractor</p>
        </div>
      </div>
    </>
  )
}
