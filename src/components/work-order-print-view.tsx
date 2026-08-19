'use client'

import { useTranslation } from '@/lib/i18n/use-translation'

// Simple date formatter
function formatDate(dateStr: string | null | undefined, includeTime = false): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', options)
}

interface WorkOrderPrintData {
  id: string
  workOrderNumber?: number | null
  description: string
  workOrderType?: 'SERVICE' | 'INSPECTION' | 'MAINTENANCE' | 'INSTALLATION' | 'STICKER_INSPECTION' | 'OTHER' | null
  scheduledDate?: string | null
  completedAt?: string | null
  price?: number | null
  // Report Fields - Universal
  inspectionDate?: string | null
  problemScope?: string | null
  findings?: string | null
  actionTaken?: string | null
  systemStatus?: 'WORKING' | 'NEEDS_ATTENTION' | 'CRITICAL' | null
  technicianNotes?: string | null
  // Report Fields - SERVICE
  partsReplaced?: string | null
  // Report Fields - INSTALLATION
  equipmentInstalled?: string | null
  installQuantity?: string | null
  completionStatus?: 'COMPLETED' | 'PARTIAL' | 'PENDING' | null
  // Report Fields - INSPECTION
  areasInspected?: string | null
  systemsChecked?: string | null
  deficiencies?: string | null
  recommendations?: string | null
  inspectionResult?: string | null
  // Report Fields - MAINTENANCE
  systemsMaintained?: string | null
  maintenancePerformed?: string | null
  partsServiced?: string | null
  testResult?: 'PASSED' | 'FAILED' | 'PARTIAL' | null
  nextMaintenanceDate?: string | null
  // Signatures
  technicianSignature?: string | null
  clientSignature?: string | null
  // Photos
  photos?: { url: string; caption?: string | null }[]
  // Branch/Client info
  branchName?: string
  branchAddress?: string
  clientName?: string
  // Technician
  technicianName?: string
  // Contract info (for contract work orders)
  contractTitle?: string | null
  visitIndex?: number | null
}

interface WorkOrderPrintViewProps {
  data: WorkOrderPrintData
  companyName?: string
  companyLogo?: string
}

export function WorkOrderPrintView({ data, companyName = 'Tasheel', companyLogo }: WorkOrderPrintViewProps) {
  const { t } = useTranslation()
  const tp = t.dashboard.printView
  const getWorkOrderTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'SERVICE': return tp.serviceReport
      case 'INSTALLATION': return tp.installationReport
      case 'MAINTENANCE': return tp.maintenanceReport
      case 'INSPECTION': return tp.inspectionReport
      case 'STICKER_INSPECTION': return tp.equipmentInspectionReport
      default: return tp.workOrderReport
    }
  }

  const getStatusBadge = (status: string | null | undefined, type: 'system' | 'completion' | 'inspection' | 'test') => {
    if (!status) return null

    const statusMap: Record<string, { label: string; color: string }> = {
      // System Status
      'WORKING': { label: `✅ ${tp.workingNormally}`, color: 'bg-green-100 text-green-800 border-green-300' },
      'NEEDS_ATTENTION': { label: `⚠️ ${tp.needsAttention}`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'CRITICAL': { label: `❌ ${tp.critical}`, color: 'bg-red-100 text-red-800 border-red-300' },
      // Completion Status
      'COMPLETED': { label: `✅ ${tp.completed}`, color: 'bg-green-100 text-green-800 border-green-300' },
      'PARTIAL': { label: `⚠️ ${tp.partial}`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'PENDING': { label: `⏳ ${tp.pending}`, color: 'bg-gray-100 text-gray-800 border-gray-300' },
      // Inspection Result
      'PASSED': { label: `✅ ${tp.passed}`, color: 'bg-green-100 text-green-800 border-green-300' },
      'PASS': { label: `✅ ${tp.passed}`, color: 'bg-green-100 text-green-800 border-green-300' },
      'ATTENTION_REQUIRED': { label: `⚠️ ${tp.attentionRequired}`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'FAILED': { label: `❌ ${tp.failed}`, color: 'bg-red-100 text-red-800 border-red-300' },
      'FAIL': { label: `❌ ${tp.failed}`, color: 'bg-red-100 text-red-800 border-red-300' },
    }

    const info = statusMap[status]
    if (!info) return null

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${info.color}`}>
        {info.label}
      </span>
    )
  }

  return (
    <div className="bg-white p-8 max-w-[800px] mx-auto print:p-4 print:max-w-none">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="h-12 mb-2" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800">
              {getWorkOrderTypeLabel(data.workOrderType)}
            </h2>
            {data.workOrderNumber && (
              <p className="text-lg font-mono text-gray-600">WO-{String(data.workOrderNumber).padStart(4, '0')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Work Order Details */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.facility}</p>
          <p className="font-medium">{data.branchName || '-'}</p>
          {data.branchAddress && <p className="text-sm text-gray-600">{data.branchAddress}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.client}</p>
          <p className="font-medium">{data.clientName || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.date}</p>
          <p className="font-medium">
            {data.inspectionDate ? formatDate(data.inspectionDate) :
              data.scheduledDate ? formatDate(data.scheduledDate) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.technician}</p>
          <p className="font-medium">{data.technicianName || '-'}</p>
        </div>
        {data.contractTitle && (
          <>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.contract}</p>
              <p className="font-medium">{data.contractTitle}</p>
            </div>
            {data.visitIndex !== null && data.visitIndex !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{tp.visit}</p>
                <p className="font-medium">#{data.visitIndex + 1}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Content - Dynamic based on type */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2">{tp.reportDetails}</h3>

        {/* SERVICE Report */}
        {data.workOrderType === 'SERVICE' && (
          <div className="space-y-3">
            {data.problemScope && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.issueReported}</p>
                <p className="whitespace-pre-wrap">{data.problemScope}</p>
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.findings}</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.actionTaken && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.actionTaken}</p>
                <p className="whitespace-pre-wrap">{data.actionTaken}</p>
              </div>
            )}
            {data.partsReplaced && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.partsReplaced}</p>
                <p>{data.partsReplaced}</p>
              </div>
            )}
            {data.systemStatus && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{tp.systemStatus}</p>
                {getStatusBadge(data.systemStatus, 'system')}
              </div>
            )}
          </div>
        )}

        {/* INSTALLATION Report */}
        {data.workOrderType === 'INSTALLATION' && (
          <div className="space-y-3">
            {data.problemScope && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.scopeOfInstallation}</p>
                <p className="whitespace-pre-wrap">{data.problemScope}</p>
              </div>
            )}
            {(data.equipmentInstalled || data.installQuantity) && (
              <div className="grid grid-cols-2 gap-4">
                {data.equipmentInstalled && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tp.equipmentInstalled}</p>
                    <p>{data.equipmentInstalled}</p>
                  </div>
                )}
                {data.installQuantity && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tp.quantity}</p>
                    <p>{data.installQuantity}</p>
                  </div>
                )}
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.testingResult}</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.completionStatus && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{tp.completionStatus}</p>
                {getStatusBadge(data.completionStatus, 'completion')}
              </div>
            )}
          </div>
        )}

        {/* INSPECTION Report */}
        {(data.workOrderType === 'INSPECTION' || data.workOrderType === 'STICKER_INSPECTION' || !data.workOrderType || data.workOrderType === 'OTHER') && (
          <div className="space-y-3">
            {(data.areasInspected || data.systemsChecked) && (
              <div className="grid grid-cols-2 gap-4">
                {data.areasInspected && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tp.areasInspected}</p>
                    <p>{data.areasInspected}</p>
                  </div>
                )}
                {data.systemsChecked && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tp.systemsChecked}</p>
                    <p>{data.systemsChecked}</p>
                  </div>
                )}
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.findings}</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.deficiencies && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.deficiencies}</p>
                <p className="whitespace-pre-wrap">{data.deficiencies}</p>
              </div>
            )}
            {data.recommendations && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.recommendation}</p>
                <p className="whitespace-pre-wrap">{data.recommendations}</p>
              </div>
            )}
            {data.inspectionResult && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{tp.inspectionResult}</p>
                {getStatusBadge(data.inspectionResult, 'inspection')}
              </div>
            )}
          </div>
        )}

        {/* MAINTENANCE Report */}
        {data.workOrderType === 'MAINTENANCE' && (
          <div className="space-y-3">
            {data.systemsMaintained && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.systemsMaintained}</p>
                <p>{data.systemsMaintained}</p>
              </div>
            )}
            {data.maintenancePerformed && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.maintenancePerformed}</p>
                <p className="whitespace-pre-wrap">{data.maintenancePerformed}</p>
              </div>
            )}
            {data.partsServiced && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.partsServiced}</p>
                <p>{data.partsServiced}</p>
              </div>
            )}
            {data.testResult && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{tp.testResult}</p>
                {getStatusBadge(data.testResult, 'test')}
              </div>
            )}
            {data.nextMaintenanceDate && (
              <div>
                <p className="text-sm font-medium text-gray-600">{tp.nextMaintenanceDate}</p>
                <p className="font-medium text-blue-600">
                  {formatDate(data.nextMaintenanceDate)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Technician Notes - Universal */}
        {data.technicianNotes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-600">{tp.technicianNotes}</p>
            <p className="whitespace-pre-wrap">{data.technicianNotes}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      {data.photos && data.photos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">{tp.photos}</h3>
          <div className="grid grid-cols-3 gap-2">
            {data.photos.slice(0, 6).map((photo, idx) => (
              <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {data.photos.length > 6 && (
            <p className="text-sm text-gray-500 mt-2">{tp.morePhotos.replace('{count}', String(data.photos.length - 6))}</p>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{tp.technicianSignature}</p>
          {data.technicianSignature ? (
            <img src={data.technicianSignature} alt={tp.technicianSignature} className="h-16 border-b border-gray-300" />
          ) : (
            <div className="h-16 border-b border-gray-300"></div>
          )}
          <p className="text-sm text-gray-500 mt-1">{data.technicianName || tp.technician}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{tp.clientSignature}</p>
          {data.clientSignature ? (
            <img src={data.clientSignature} alt={tp.clientSignature} className="h-16 border-b border-gray-300" />
          ) : (
            <div className="h-16 border-b border-gray-300"></div>
          )}
          <p className="text-sm text-gray-500 mt-1">{tp.clientRepresentative}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>{tp.generatedBy.replace('{company}', companyName)} • www.tasheel.live</p>
        <p className="text-xs mt-1">{tp.reportGeneratedOn.replace('{date}', formatDate(new Date().toISOString(), true))}</p>
      </div>
    </div>
  )
}
