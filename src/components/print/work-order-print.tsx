'use client'

import { useEffect, useState } from 'react'

interface Equipment {
  id: string
  equipmentNumber: string
  equipmentType: string
  location: string | null
  expectedExpiry: string | null
}

// Maintenance report types
interface MaintenanceTask {
  task: string
  completed: boolean
  notes: string
}

interface Measurement {
  name: string
  value: string
  unit: string
  normalRange: string
  status: 'normal' | 'warning' | 'critical'
}

interface ConsumableUsed {
  item: string
  quantity: string
}

interface MaintenanceReportData {
  tasksPerformed: MaintenanceTask[]
  equipmentCondition: 'good' | 'fair' | 'poor' | 'critical'
  measurements: Measurement[]
  consumablesUsed: ConsumableUsed[]
  nextMaintenanceDate: string
}

// Service report types
interface PartReplaced {
  name: string
  quantity: number
  unitCost: number
  total: number
}

interface ServiceReportData {
  problemDescription: string
  rootCause: string
  workPerformed: string
  partsReplaced: PartReplaced[]
  laborHours: number
  laborRate: number
  laborCost: number
  totalPartsCost: number
  totalCost: number
  warrantyInfo: string
  beforePhotos: string[]
  afterPhotos: string[]
}

// Installation report types
interface EquipmentInstalled {
  name: string
  model: string
  serialNumber: string
  location: string
}

interface CommissioningItem {
  item: string
  completed: boolean
  notes: string
}

interface TestResult {
  test: string
  result: 'pass' | 'fail'
  notes: string
}

interface InstallationReportData {
  equipmentInstalled: EquipmentInstalled[]
  configurationDetails: string
  commissioningChecklist: CommissioningItem[]
  testingResults: TestResult[]
  trainingProvided: boolean
  trainingNotes: string
  warrantyStartDate: string
  warrantyEndDate: string
  handoverSignature: string
  handoverDate: string
  handoverName: string
}

// Inspection report types
interface InspectionChecklistItem {
  item: string
  status: 'pass' | 'fail' | 'na'
  notes: string
}

interface InspectionReportData {
  checklistItems: InspectionChecklistItem[]
  overallStatus: 'pass' | 'fail' | 'conditional'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  nextInspectionDate: string
}

type ReportData = MaintenanceReportData | ServiceReportData | InstallationReportData | InspectionReportData | null

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
  // Report Fields - Universal
  inspectionDate: string | null
  problemScope: string | null
  findings: string | null
  actionTaken: string | null
  systemStatus: 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL' | null
  technicianNotes: string | null
  // Report Fields - SERVICE
  partsReplaced: string | null
  // Report Fields - INSTALLATION
  equipmentInstalled: string | null
  installQuantity: string | null
  completionStatus: 'COMPLETED' | 'PARTIAL' | 'PENDING' | null
  // Report Fields - INSPECTION
  areasInspected: string | null
  systemsChecked: string | null
  deficiencies: string | null
  recommendations: string | null
  inspectionResult: string | null
  // Report Fields - MAINTENANCE
  systemsMaintained: string | null
  maintenancePerformed: string | null
  partsServiced: string | null
  testResult: 'PASSED' | 'FAILED' | 'PARTIAL' | null
  nextMaintenanceDate: string | null
  // Legacy
  reportData: ReportData
  // Signatures
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
              <h2 className="text-2xl font-bold mb-1">WORK ORDER REPORT</h2>
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

        {/* NEW STRUCTURED REPORT - Uses new database fields */}
        {(data.problemScope || data.findings || data.actionTaken || data.systemStatus ||
          data.partsReplaced || data.equipmentInstalled || data.areasInspected ||
          data.systemsMaintained || data.maintenancePerformed) && (
            <div className="mb-6 print-section">
              <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">
                {data.workOrderType === 'SERVICE' ? 'SERVICE REPORT' :
                  data.workOrderType === 'INSTALLATION' ? 'INSTALLATION REPORT' :
                    data.workOrderType === 'MAINTENANCE' ? 'MAINTENANCE REPORT' :
                      data.workOrderType === 'INSPECTION' ? 'INSPECTION REPORT' : 'WORK REPORT'}
              </h3>
              <div className="space-y-3">
                {/* SERVICE Report Fields */}
                {data.workOrderType === 'SERVICE' && (
                  <>
                    {data.problemScope && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Issue Reported:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.problemScope}</p>
                      </div>
                    )}
                    {data.findings && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Findings:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                      </div>
                    )}
                    {data.actionTaken && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Action Taken:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.actionTaken}</p>
                      </div>
                    )}
                    {data.partsReplaced && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Parts Replaced:</p>
                        <p className="text-sm">{data.partsReplaced}</p>
                      </div>
                    )}
                    {data.systemStatus && (
                      <div>
                        <p className="text-sm font-semibold mb-1">System Status:</p>
                        <p className={`text-sm font-semibold ${data.systemStatus === 'WORKING' ? 'text-green-600' :
                            data.systemStatus === 'NEEDS_ATTENTION' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.systemStatus === 'WORKING' ? '✅ Working Normally' :
                            data.systemStatus === 'NEEDS_ATTENTION' ? '⚠️ Needs Attention' : '❌ Critical'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* INSTALLATION Report Fields */}
                {data.workOrderType === 'INSTALLATION' && (
                  <>
                    {data.problemScope && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Scope of Installation:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.problemScope}</p>
                      </div>
                    )}
                    {(data.equipmentInstalled || data.installQuantity) && (
                      <div className="grid grid-cols-2 gap-4">
                        {data.equipmentInstalled && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Equipment Installed:</p>
                            <p className="text-sm">{data.equipmentInstalled}</p>
                          </div>
                        )}
                        {data.installQuantity && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Quantity:</p>
                            <p className="text-sm">{data.installQuantity}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {data.findings && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Testing Result:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                      </div>
                    )}
                    {data.completionStatus && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Completion Status:</p>
                        <p className={`text-sm font-semibold ${data.completionStatus === 'COMPLETED' ? 'text-green-600' :
                            data.completionStatus === 'PARTIAL' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                          {data.completionStatus === 'COMPLETED' ? '✅ Completed' :
                            data.completionStatus === 'PARTIAL' ? '⚠️ Partial' : '⏳ Pending'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* INSPECTION Report Fields */}
                {(data.workOrderType === 'INSPECTION' || data.workOrderType === 'STICKER_INSPECTION' || !data.workOrderType) && (
                  <>
                    {(data.areasInspected || data.systemsChecked) && (
                      <div className="grid grid-cols-2 gap-4">
                        {data.areasInspected && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Areas Inspected:</p>
                            <p className="text-sm">{data.areasInspected}</p>
                          </div>
                        )}
                        {data.systemsChecked && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Systems Checked:</p>
                            <p className="text-sm">{data.systemsChecked}</p>
                          </div>
                        )}
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
                        <p className="text-sm whitespace-pre-wrap text-orange-700">{data.deficiencies}</p>
                      </div>
                    )}
                    {data.recommendations && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Recommendations:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.recommendations}</p>
                      </div>
                    )}
                    {data.inspectionResult && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Inspection Result:</p>
                        <p className={`text-sm font-semibold ${data.inspectionResult === 'PASSED' || data.inspectionResult === 'PASS' ? 'text-green-600' :
                            data.inspectionResult === 'ATTENTION_REQUIRED' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.inspectionResult === 'PASSED' || data.inspectionResult === 'PASS' ? '✅ Passed' :
                            data.inspectionResult === 'ATTENTION_REQUIRED' ? '⚠️ Attention Required' : '❌ Failed'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* MAINTENANCE Report Fields */}
                {data.workOrderType === 'MAINTENANCE' && (
                  <>
                    {data.systemsMaintained && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Systems Maintained:</p>
                        <p className="text-sm">{data.systemsMaintained}</p>
                      </div>
                    )}
                    {data.maintenancePerformed && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Maintenance Performed:</p>
                        <p className="text-sm whitespace-pre-wrap">{data.maintenancePerformed}</p>
                      </div>
                    )}
                    {data.partsServiced && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Parts Serviced:</p>
                        <p className="text-sm">{data.partsServiced}</p>
                      </div>
                    )}
                    {data.testResult && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Test Result:</p>
                        <p className={`text-sm font-semibold ${data.testResult === 'PASSED' ? 'text-green-600' :
                            data.testResult === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.testResult === 'PASSED' ? '✅ Passed' :
                            data.testResult === 'PARTIAL' ? '⚠️ Partial' : '❌ Failed'}
                        </p>
                      </div>
                    )}
                    {data.nextMaintenanceDate && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Next Maintenance Date:</p>
                        <p className="text-sm font-semibold text-blue-600">{formatDate(data.nextMaintenanceDate)}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Technician Notes - Universal */}
                {data.technicianNotes && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-semibold mb-1">Technician Notes:</p>
                    <p className="text-sm whitespace-pre-wrap">{data.technicianNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

        {/* Maintenance Report */}
        {data.workOrderType === 'MAINTENANCE' && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">MAINTENANCE REPORT</h3>
            <div className="space-y-4">
              {/* Equipment Condition */}
              <div>
                <p className="text-sm text-muted-foreground">Equipment Condition</p>
                <p className="font-semibold capitalize">{(data.reportData as MaintenanceReportData).equipmentCondition || '-'}</p>
              </div>

              {/* Tasks Performed */}
              {(data.reportData as MaintenanceReportData).tasksPerformed?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Tasks Performed:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-8">✓</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Task</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as MaintenanceReportData).tasksPerformed.map((task, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                            {task.completed ? '✓' : '—'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{task.task}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{task.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Measurements */}
              {(data.reportData as MaintenanceReportData).measurements?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Measurements:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Parameter</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Value</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Normal Range</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as MaintenanceReportData).measurements.map((m, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{m.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{m.value} {m.unit}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{m.normalRange}</td>
                          <td className={`border border-gray-300 px-3 py-2 text-sm capitalize ${m.status === 'critical' ? 'text-red-600 font-semibold' :
                            m.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                            }`}>{m.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Consumables Used */}
              {(data.reportData as MaintenanceReportData).consumablesUsed?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Consumables Used:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as MaintenanceReportData).consumablesUsed.map((c, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{c.item}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{c.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Next Maintenance Date */}
              {(data.reportData as MaintenanceReportData).nextMaintenanceDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Maintenance Date</p>
                  <p className="font-semibold">{formatDate((data.reportData as MaintenanceReportData).nextMaintenanceDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Report */}
        {data.workOrderType === 'SERVICE' && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">SERVICE REPORT</h3>
            <div className="space-y-3">
              {(data.reportData as ServiceReportData).problemDescription && (
                <div>
                  <p className="text-sm font-semibold mb-1">Problem Description:</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).problemDescription}</p>
                </div>
              )}
              {(data.reportData as ServiceReportData).rootCause && (
                <div>
                  <p className="text-sm font-semibold mb-1">Root Cause:</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).rootCause}</p>
                </div>
              )}
              {(data.reportData as ServiceReportData).workPerformed && (
                <div>
                  <p className="text-sm font-semibold mb-1">Work Performed:</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).workPerformed}</p>
                </div>
              )}

              {/* Parts Replaced */}
              {(data.reportData as ServiceReportData).partsReplaced?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Parts Replaced:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Part</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Unit Cost</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as ServiceReportData).partsReplaced.map((part, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{part.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{part.quantity}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{formatCurrency(part.unitCost)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{formatCurrency(part.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Labor & Cost Summary */}
              {((data.reportData as ServiceReportData).laborHours > 0 || (data.reportData as ServiceReportData).totalCost > 0) && (
                <div>
                  <p className="text-sm font-semibold mb-2">Cost Summary:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <tbody>
                      {(data.reportData as ServiceReportData).laborHours > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">Labor Hours</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{(data.reportData as ServiceReportData).laborHours} hrs</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).laborRate > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">Labor Rate</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).laborRate)}/hr</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).laborCost > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">Labor Cost</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).laborCost)}</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).totalPartsCost > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">Total Parts Cost</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).totalPartsCost)}</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).totalCost > 0 && (
                        <tr className="bg-gray-100 font-semibold">
                          <td className="border border-gray-300 px-3 py-2 text-sm">Total Cost</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).totalCost)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Before/After Photos */}
              {((data.reportData as ServiceReportData).beforePhotos?.length > 0 || (data.reportData as ServiceReportData).afterPhotos?.length > 0) && (
                <div>
                  <p className="text-sm font-semibold mb-2">Documentation Photos:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {(data.reportData as ServiceReportData).beforePhotos?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Before:</p>
                        <div className="flex flex-wrap gap-2">
                          {(data.reportData as ServiceReportData).beforePhotos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`Before ${idx + 1}`} className="w-24 h-24 object-cover border rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                    {(data.reportData as ServiceReportData).afterPhotos?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">After:</p>
                        <div className="flex flex-wrap gap-2">
                          {(data.reportData as ServiceReportData).afterPhotos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`After ${idx + 1}`} className="w-24 h-24 object-cover border rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(data.reportData as ServiceReportData).warrantyInfo && (
                <div>
                  <p className="text-sm font-semibold mb-1">Warranty Information:</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).warrantyInfo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installation Report */}
        {data.workOrderType === 'INSTALLATION' && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">INSTALLATION REPORT</h3>
            <div className="space-y-3">
              {/* Equipment Installed */}
              {(data.reportData as InstallationReportData).equipmentInstalled?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Equipment Installed:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Name</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Model</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Serial #</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InstallationReportData).equipmentInstalled.map((eq, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{eq.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{eq.model}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{eq.serialNumber}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{eq.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Configuration Details */}
              {(data.reportData as InstallationReportData).configurationDetails && (
                <div>
                  <p className="text-sm font-semibold mb-1">Configuration Details:</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as InstallationReportData).configurationDetails}</p>
                </div>
              )}

              {/* Commissioning Checklist */}
              {(data.reportData as InstallationReportData).commissioningChecklist?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Commissioning Checklist:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-8">✓</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InstallationReportData).commissioningChecklist.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                            {item.completed ? '✓' : '—'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.item}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Testing Results */}
              {(data.reportData as InstallationReportData).testingResults?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Testing Results:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Test</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Result</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InstallationReportData).testingResults.map((test, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{test.test}</td>
                          <td className={`border border-gray-300 px-3 py-2 text-sm font-semibold ${test.result === 'pass' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {test.result === 'pass' ? 'PASS' : 'FAIL'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{test.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Training */}
              {(data.reportData as InstallationReportData).trainingProvided && (
                <div>
                  <p className="text-sm font-semibold mb-1">Training Provided:</p>
                  <p className="text-sm">Yes</p>
                  {(data.reportData as InstallationReportData).trainingNotes && (
                    <p className="text-sm whitespace-pre-wrap mt-1">{(data.reportData as InstallationReportData).trainingNotes}</p>
                  )}
                </div>
              )}

              {/* Warranty Period */}
              {((data.reportData as InstallationReportData).warrantyStartDate || (data.reportData as InstallationReportData).warrantyEndDate) && (
                <div>
                  <p className="text-sm font-semibold mb-1">Warranty Period:</p>
                  <p className="text-sm">
                    {formatDate((data.reportData as InstallationReportData).warrantyStartDate)} - {formatDate((data.reportData as InstallationReportData).warrantyEndDate)}
                  </p>
                </div>
              )}

              {/* Handover */}
              {(data.reportData as InstallationReportData).handoverName && (
                <div>
                  <p className="text-sm font-semibold mb-1">Handover:</p>
                  <p className="text-sm">Received by: {(data.reportData as InstallationReportData).handoverName}</p>
                  {(data.reportData as InstallationReportData).handoverDate && (
                    <p className="text-sm">Date: {formatDate((data.reportData as InstallationReportData).handoverDate)}</p>
                  )}
                  {(data.reportData as InstallationReportData).handoverSignature && (
                    <div className="mt-2">
                      <img
                        src={(data.reportData as InstallationReportData).handoverSignature}
                        alt="Handover signature"
                        className="max-h-16 border rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inspection Report - using new reportData structure */}
        {(data.workOrderType === 'INSPECTION' || data.workOrderType === 'STICKER_INSPECTION') && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">
              {data.workOrderType === 'STICKER_INSPECTION' ? 'STICKER INSPECTION REPORT' : 'INSPECTION REPORT'}
            </h3>
            <div className="space-y-3">
              {/* Overall Status & Risk Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Status</p>
                  <p className={`font-semibold capitalize ${(data.reportData as InspectionReportData).overallStatus === 'pass' ? 'text-green-600' :
                    (data.reportData as InspectionReportData).overallStatus === 'fail' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                    {(data.reportData as InspectionReportData).overallStatus || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className={`font-semibold capitalize ${(data.reportData as InspectionReportData).riskLevel === 'critical' ? 'text-red-600' :
                    (data.reportData as InspectionReportData).riskLevel === 'high' ? 'text-orange-600' :
                      (data.reportData as InspectionReportData).riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                    {(data.reportData as InspectionReportData).riskLevel || '-'}
                  </p>
                </div>
              </div>

              {/* Checklist Items */}
              {(data.reportData as InspectionReportData).checklistItems?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Inspection Checklist:</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-20">Status</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InspectionReportData).checklistItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.item}</td>
                          <td className={`border border-gray-300 px-3 py-2 text-sm font-semibold text-center ${item.status === 'pass' ? 'text-green-600' :
                            item.status === 'fail' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {item.status === 'pass' ? 'PASS' : item.status === 'fail' ? 'FAIL' : 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Next Inspection Date */}
              {(data.reportData as InspectionReportData).nextInspectionDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Inspection Date</p>
                  <p className="font-semibold">{formatDate((data.reportData as InspectionReportData).nextInspectionDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inspection Results - legacy fields fallback (when no reportData but has inspectionDate) */}
        {(data.workOrderType === 'INSPECTION' || data.workOrderType === 'STICKER_INSPECTION') && !data.reportData && data.inspectionDate && (
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
