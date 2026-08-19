'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n/use-translation'

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
  const { t } = useTranslation()
  const tp = t.dashboard.workOrderPrint
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
          <p className="text-muted-foreground">{tp.preparingDocument}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{tp.failedToLoad}</p>
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
      SCHEDULED: tp.stageScheduled,
      IN_PROGRESS: tp.stageInProgress,
      FOR_REVIEW: tp.stageForReview,
      COMPLETED: tp.stageCompleted,
      CANCELLED: tp.stageCancelled
    }
    return labels[stage] || stage
  }

  const getWorkOrderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SERVICE: tp.woTypeService,
      INSPECTION: tp.woTypeInspection,
      MAINTENANCE: tp.woTypeMaintenance,
      INSTALLATION: tp.woTypeInstallation,
      STICKER_INSPECTION: tp.woTypeStickerInspection
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
              <p className="text-sm text-muted-foreground">{tp.safetyContractorManagement}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-1">{tp.workOrderReport}</h2>
              <p className="text-lg font-semibold">WO #{data.workOrderNumber}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tp.generated} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.clientInformation}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{tp.companyName}</p>
              <p className="font-semibold">{data.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tp.branch}</p>
              <p className="font-semibold">{data.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tp.address}</p>
              <p className="font-semibold">{data.branchAddress}</p>
            </div>
            {data.branchPhone && (
              <div>
                <p className="text-sm text-muted-foreground">{tp.contact}</p>
                <p className="font-semibold">{data.branchPhone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Work Order Details */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.workOrderDetails}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{tp.type}</p>
              <p className="font-semibold">{getWorkOrderTypeLabel(data.workOrderType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tp.status}</p>
              <p className="font-semibold">{getStageLabel(data.stage)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tp.scheduledDate}</p>
              <p className="font-semibold">{formatDate(data.scheduledDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tp.price}</p>
              <p className="font-semibold">{formatCurrency(data.price)}</p>
            </div>
            {data.recurringType && data.recurringType !== 'ONCE' && (
              <div>
                <p className="text-sm text-muted-foreground">{tp.recurring}</p>
                <p className="font-semibold">
                  {data.recurringType} ({data.occurrenceIndex || 1})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 print-section">
          <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.description}</h3>
          <p className="whitespace-pre-wrap">{data.description}</p>
          {data.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm font-semibold mb-1">{tp.notes}</p>
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
                {data.workOrderType === 'SERVICE' ? tp.serviceReport :
                  data.workOrderType === 'INSTALLATION' ? tp.installationReport :
                    data.workOrderType === 'MAINTENANCE' ? tp.maintenanceReport :
                      data.workOrderType === 'INSPECTION' ? tp.inspectionReport : tp.workReport}
              </h3>
              <div className="space-y-3">
                {/* SERVICE Report Fields */}
                {data.workOrderType === 'SERVICE' && (
                  <>
                    {data.problemScope && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.issueReported}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.problemScope}</p>
                      </div>
                    )}
                    {data.findings && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.findings}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                      </div>
                    )}
                    {data.actionTaken && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.actionTaken}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.actionTaken}</p>
                      </div>
                    )}
                    {data.partsReplaced && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.partsReplaced}</p>
                        <p className="text-sm">{data.partsReplaced}</p>
                      </div>
                    )}
                    {data.systemStatus && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.systemStatus}</p>
                        <p className={`text-sm font-semibold ${data.systemStatus === 'WORKING' ? 'text-green-600' :
                          data.systemStatus === 'NEEDS_ATTENTION' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.systemStatus === 'WORKING' ? `✅ ${tp.workingNormally}` :
                            data.systemStatus === 'NEEDS_ATTENTION' ? `⚠️ ${tp.needsAttention}` : `❌ ${tp.critical}`}
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
                        <p className="text-sm font-semibold mb-1">{tp.scopeOfInstallation}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.problemScope}</p>
                      </div>
                    )}
                    {(data.equipmentInstalled || data.installQuantity) && (
                      <div className="grid grid-cols-2 gap-4">
                        {data.equipmentInstalled && (
                          <div>
                            <p className="text-sm font-semibold mb-1">{tp.equipmentInstalled}</p>
                            <p className="text-sm">{data.equipmentInstalled}</p>
                          </div>
                        )}
                        {data.installQuantity && (
                          <div>
                            <p className="text-sm font-semibold mb-1">{tp.quantity}</p>
                            <p className="text-sm">{data.installQuantity}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {data.findings && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.testingResult}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                      </div>
                    )}
                    {data.completionStatus && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.completionStatus}</p>
                        <p className={`text-sm font-semibold ${data.completionStatus === 'COMPLETED' ? 'text-green-600' :
                          data.completionStatus === 'PARTIAL' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                          {data.completionStatus === 'COMPLETED' ? `✅ ${tp.completed}` :
                            data.completionStatus === 'PARTIAL' ? `⚠️ ${tp.partial}` : `⏳ ${tp.pending}`}
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
                            <p className="text-sm font-semibold mb-1">{tp.areasInspected}</p>
                            <p className="text-sm">{data.areasInspected}</p>
                          </div>
                        )}
                        {data.systemsChecked && (
                          <div>
                            <p className="text-sm font-semibold mb-1">{tp.systemsChecked}</p>
                            <p className="text-sm">{data.systemsChecked}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {data.findings && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.findings}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                      </div>
                    )}
                    {data.deficiencies && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.deficiencies}</p>
                        <p className="text-sm whitespace-pre-wrap text-orange-700">{data.deficiencies}</p>
                      </div>
                    )}
                    {data.recommendations && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.recommendations}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.recommendations}</p>
                      </div>
                    )}
                    {data.inspectionResult && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.inspectionResult}</p>
                        <p className={`text-sm font-semibold ${data.inspectionResult === 'PASSED' ? 'text-green-600' :
                          data.inspectionResult === 'ATTENTION_REQUIRED' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.inspectionResult === 'PASSED' ? `✅ ${tp.passed}` :
                            data.inspectionResult === 'ATTENTION_REQUIRED' ? `⚠️ ${tp.attentionRequired}` : `❌ ${tp.failed}`}
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
                        <p className="text-sm font-semibold mb-1">{tp.systemsMaintained}</p>
                        <p className="text-sm">{data.systemsMaintained}</p>
                      </div>
                    )}
                    {data.maintenancePerformed && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.maintenancePerformed}</p>
                        <p className="text-sm whitespace-pre-wrap">{data.maintenancePerformed}</p>
                      </div>
                    )}
                    {data.partsServiced && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.partsServiced}</p>
                        <p className="text-sm">{data.partsServiced}</p>
                      </div>
                    )}
                    {data.testResult && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.testResult}</p>
                        <p className={`text-sm font-semibold ${data.testResult === 'PASSED' ? 'text-green-600' :
                          data.testResult === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {data.testResult === 'PASSED' ? `✅ ${tp.passed}` :
                            data.testResult === 'PARTIAL' ? `⚠️ ${tp.partial}` : `❌ ${tp.failed}`}
                        </p>
                      </div>
                    )}
                    {data.nextMaintenanceDate && (
                      <div>
                        <p className="text-sm font-semibold mb-1">{tp.nextMaintenanceDate}</p>
                        <p className="text-sm font-semibold text-blue-600">{formatDate(data.nextMaintenanceDate)}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Technician Notes - Universal */}
                {data.technicianNotes && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-semibold mb-1">{tp.technicianNotes}</p>
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
              {tp.equipmentList.replace('{count}', String(data.equipment.length))}
            </h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.equipmentNumber}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.type}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.location}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.expiryDate}</th>
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
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.maintenanceReport}</h3>
            <div className="space-y-4">
              {/* Equipment Condition */}
              <div>
                <p className="text-sm text-muted-foreground">{tp.equipmentCondition}</p>
                <p className="font-semibold capitalize">{(data.reportData as MaintenanceReportData).equipmentCondition || '-'}</p>
              </div>

              {/* Tasks Performed */}
              {(data.reportData as MaintenanceReportData).tasksPerformed?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{tp.tasksPerformed}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-8">✓</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.task}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.notes}</th>
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
                  <p className="text-sm font-semibold mb-2">{tp.measurements}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.parameter}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.value}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.normalRange}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.status}</th>
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
                  <p className="text-sm font-semibold mb-2">{tp.consumablesUsed}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.item}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.quantity}</th>
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
                  <p className="text-sm text-muted-foreground">{tp.nextMaintenanceDate}</p>
                  <p className="font-semibold">{formatDate((data.reportData as MaintenanceReportData).nextMaintenanceDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Report */}
        {data.workOrderType === 'SERVICE' && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.serviceReport}</h3>
            <div className="space-y-3">
              {(data.reportData as ServiceReportData).problemDescription && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.problemDescription}</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).problemDescription}</p>
                </div>
              )}
              {(data.reportData as ServiceReportData).rootCause && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.rootCause}</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).rootCause}</p>
                </div>
              )}
              {(data.reportData as ServiceReportData).workPerformed && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.workPerformed}</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).workPerformed}</p>
                </div>
              )}

              {/* Parts Replaced */}
              {(data.reportData as ServiceReportData).partsReplaced?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{tp.partsReplaced}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.part}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.qty}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.unitCost}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.total}</th>
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
                  <p className="text-sm font-semibold mb-2">{tp.costSummary}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <tbody>
                      {(data.reportData as ServiceReportData).laborHours > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{tp.laborHours}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{(data.reportData as ServiceReportData).laborHours} {tp.hrs}</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).laborRate > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{tp.laborRate}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).laborRate)}/hr</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).laborCost > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{tp.laborCost}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).laborCost)}</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).totalPartsCost > 0 && (
                        <tr>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{tp.totalPartsCost}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency((data.reportData as ServiceReportData).totalPartsCost)}</td>
                        </tr>
                      )}
                      {(data.reportData as ServiceReportData).totalCost > 0 && (
                        <tr className="bg-gray-100 font-semibold">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{tp.totalCost}</td>
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
                  <p className="text-sm font-semibold mb-2">{tp.documentationPhotos}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {(data.reportData as ServiceReportData).beforePhotos?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{tp.before}</p>
                        <div className="flex flex-wrap gap-2">
                          {(data.reportData as ServiceReportData).beforePhotos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`${tp.before} ${idx + 1}`} className="w-24 h-24 object-cover border rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                    {(data.reportData as ServiceReportData).afterPhotos?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{tp.after}</p>
                        <div className="flex flex-wrap gap-2">
                          {(data.reportData as ServiceReportData).afterPhotos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`${tp.after} ${idx + 1}`} className="w-24 h-24 object-cover border rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(data.reportData as ServiceReportData).warrantyInfo && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.warrantyInformation}</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as ServiceReportData).warrantyInfo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installation Report */}
        {data.workOrderType === 'INSTALLATION' && data.reportData && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.installationReport}</h3>
            <div className="space-y-3">
              {/* Equipment Installed */}
              {(data.reportData as InstallationReportData).equipmentInstalled?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{tp.equipmentInstalled}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.name}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.model}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.serialNumber}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.location}</th>
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
                  <p className="text-sm font-semibold mb-1">{tp.configurationDetails}</p>
                  <p className="text-sm whitespace-pre-wrap">{(data.reportData as InstallationReportData).configurationDetails}</p>
                </div>
              )}

              {/* Commissioning Checklist */}
              {(data.reportData as InstallationReportData).commissioningChecklist?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{tp.commissioningChecklist}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-8">✓</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.item}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.notes}</th>
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
                  <p className="text-sm font-semibold mb-2">{tp.testingResults}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.test}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.result}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InstallationReportData).testingResults.map((test, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{test.test}</td>
                          <td className={`border border-gray-300 px-3 py-2 text-sm font-semibold ${test.result === 'pass' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {test.result === 'pass' ? tp.pass : tp.fail}
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
                  <p className="text-sm font-semibold mb-1">{tp.trainingProvided}</p>
                  <p className="text-sm">{tp.yes}</p>
                  {(data.reportData as InstallationReportData).trainingNotes && (
                    <p className="text-sm whitespace-pre-wrap mt-1">{(data.reportData as InstallationReportData).trainingNotes}</p>
                  )}
                </div>
              )}

              {/* Warranty Period */}
              {((data.reportData as InstallationReportData).warrantyStartDate || (data.reportData as InstallationReportData).warrantyEndDate) && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.warrantyPeriod}</p>
                  <p className="text-sm">
                    {formatDate((data.reportData as InstallationReportData).warrantyStartDate)} - {formatDate((data.reportData as InstallationReportData).warrantyEndDate)}
                  </p>
                </div>
              )}

              {/* Handover */}
              {(data.reportData as InstallationReportData).handoverName && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.handover}</p>
                  <p className="text-sm">{tp.receivedBy} {(data.reportData as InstallationReportData).handoverName}</p>
                  {(data.reportData as InstallationReportData).handoverDate && (
                    <p className="text-sm">{tp.date} {formatDate((data.reportData as InstallationReportData).handoverDate)}</p>
                  )}
                  {(data.reportData as InstallationReportData).handoverSignature && (
                    <div className="mt-2">
                      <img
                        src={(data.reportData as InstallationReportData).handoverSignature}
                        alt={tp.handover}
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
              {data.workOrderType === 'STICKER_INSPECTION' ? tp.stickerInspectionReport : tp.inspectionReport}
            </h3>
            <div className="space-y-3">
              {/* Overall Status & Risk Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{tp.overallStatus}</p>
                  <p className={`font-semibold capitalize ${(data.reportData as InspectionReportData).overallStatus === 'pass' ? 'text-green-600' :
                    (data.reportData as InspectionReportData).overallStatus === 'fail' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                    {(data.reportData as InspectionReportData).overallStatus || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tp.riskLevel}</p>
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
                  <p className="text-sm font-semibold mb-2">{tp.inspectionChecklist}</p>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.item}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-20">{tp.status}</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{tp.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.reportData as InspectionReportData).checklistItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.item}</td>
                          <td className={`border border-gray-300 px-3 py-2 text-sm font-semibold text-center ${item.status === 'pass' ? 'text-green-600' :
                            item.status === 'fail' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {item.status === 'pass' ? tp.pass : item.status === 'fail' ? tp.fail : tp.na}
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
                  <p className="text-sm text-muted-foreground">{tp.nextInspectionDate}</p>
                  <p className="font-semibold">{formatDate((data.reportData as InspectionReportData).nextInspectionDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inspection Results - legacy fields fallback (when no reportData but has inspectionDate) */}
        {(data.workOrderType === 'INSPECTION' || data.workOrderType === 'STICKER_INSPECTION') && !data.reportData && data.inspectionDate && (
          <div className="mb-6 print-section">
            <h3 className="text-lg font-bold mb-3 text-primary border-b pb-2">{tp.inspectionResults}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{tp.inspectionDate}</p>
                <p className="font-semibold">{formatDate(data.inspectionDate)}</p>
              </div>
              {data.systemsChecked && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.systemsChecked}</p>
                  <p className="text-sm whitespace-pre-wrap">{data.systemsChecked}</p>
                </div>
              )}
              {data.findings && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.findings}</p>
                  <p className="text-sm whitespace-pre-wrap">{data.findings}</p>
                </div>
              )}
              {data.deficiencies && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.deficiencies}</p>
                  <p className="text-sm whitespace-pre-wrap text-red-600">{data.deficiencies}</p>
                </div>
              )}
              {data.recommendations && (
                <div>
                  <p className="text-sm font-semibold mb-1">{tp.recommendations}</p>
                  <p className="text-sm whitespace-pre-wrap">{data.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technician Name (if assigned) */}
        {data.technicianName && (
          <div className="mt-8 pt-4 border-t">
            <p className="text-sm font-semibold mb-2">{tp.technicianAssigned}</p>
            <p className="text-base">{data.technicianName}</p>
            {data.technicianSignedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {tp.signedOn} {formatDate(data.technicianSignedAt)}
              </p>
            )}
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 pt-6 border-t-2">
          <h3 className="text-lg font-bold mb-4">{tp.signatures}</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold mb-4">{tp.supervisorSignature}</p>
              <div className="border-b-2 border-gray-400 h-24 mb-2 flex items-center justify-center bg-white">
                {data.supervisorSignature && data.supervisorSignature.startsWith('data:image') && (
                  <img
                    src={data.supervisorSignature}
                    alt={tp.supervisorSignature}
                    className="max-h-20 max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tp.nameLabel} {data.supervisorName || '___________________'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tp.dateLabel} {data.supervisorSignedAt ? formatDate(data.supervisorSignedAt) : '___________________'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-4">{tp.clientSignature}</p>
              <div className="border-b-2 border-gray-400 h-24 mb-2 flex items-center justify-center bg-white">
                {data.clientSignature && data.clientSignature.startsWith('data:image') && (
                  <img
                    src={data.clientSignature}
                    alt={tp.clientSignature}
                    className="max-h-20 max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tp.nameLabel} {data.clientSignedByName || '___________________'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tp.dateLabel} {data.clientSignedAt ? formatDate(data.clientSignedAt) : '___________________'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>{tp.officialWorkOrderDoc}</p>
          <p className="mt-1">{t.dashboard.requestQuotePrint.forInquiries}</p>
        </div>
      </div>
    </>
  )
}
