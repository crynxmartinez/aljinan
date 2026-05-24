'use client'

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
  const getWorkOrderTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'SERVICE': return 'Service Report'
      case 'INSTALLATION': return 'Installation Report'
      case 'MAINTENANCE': return 'Preventive Maintenance Report'
      case 'INSPECTION': return 'Inspection Report'
      case 'STICKER_INSPECTION': return 'Equipment Inspection Report'
      default: return 'Work Order Report'
    }
  }

  const getStatusBadge = (status: string | null | undefined, type: 'system' | 'completion' | 'inspection' | 'test') => {
    if (!status) return null

    const statusMap: Record<string, { label: string; color: string }> = {
      // System Status
      'WORKING': { label: '✅ Working Normally', color: 'bg-green-100 text-green-800 border-green-300' },
      'NEEDS_ATTENTION': { label: '⚠️ Needs Attention', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'CRITICAL': { label: '❌ Critical', color: 'bg-red-100 text-red-800 border-red-300' },
      // Completion Status
      'COMPLETED': { label: '✅ Completed', color: 'bg-green-100 text-green-800 border-green-300' },
      'PARTIAL': { label: '⚠️ Partial', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'PENDING': { label: '⏳ Pending', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      // Inspection Result
      'PASSED': { label: '✅ Passed', color: 'bg-green-100 text-green-800 border-green-300' },
      'PASS': { label: '✅ Passed', color: 'bg-green-100 text-green-800 border-green-300' },
      'ATTENTION_REQUIRED': { label: '⚠️ Attention Required', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'FAILED': { label: '❌ Failed', color: 'bg-red-100 text-red-800 border-red-300' },
      'FAIL': { label: '❌ Failed', color: 'bg-red-100 text-red-800 border-red-300' },
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
          <p className="text-xs text-gray-500 uppercase tracking-wide">Facility</p>
          <p className="font-medium">{data.branchName || '-'}</p>
          {data.branchAddress && <p className="text-sm text-gray-600">{data.branchAddress}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
          <p className="font-medium">{data.clientName || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
          <p className="font-medium">
            {data.inspectionDate ? formatDate(data.inspectionDate) :
              data.scheduledDate ? formatDate(data.scheduledDate) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Technician</p>
          <p className="font-medium">{data.technicianName || '-'}</p>
        </div>
        {data.contractTitle && (
          <>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Contract</p>
              <p className="font-medium">{data.contractTitle}</p>
            </div>
            {data.visitIndex !== null && data.visitIndex !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Visit</p>
                <p className="font-medium">#{data.visitIndex + 1}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Content - Dynamic based on type */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2">Report Details</h3>

        {/* SERVICE Report */}
        {data.workOrderType === 'SERVICE' && (
          <div className="space-y-3">
            {data.problemScope && (
              <div>
                <p className="text-sm font-medium text-gray-600">Issue Reported</p>
                <p className="whitespace-pre-wrap">{data.problemScope}</p>
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">Findings</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.actionTaken && (
              <div>
                <p className="text-sm font-medium text-gray-600">Action Taken</p>
                <p className="whitespace-pre-wrap">{data.actionTaken}</p>
              </div>
            )}
            {data.partsReplaced && (
              <div>
                <p className="text-sm font-medium text-gray-600">Parts Replaced</p>
                <p>{data.partsReplaced}</p>
              </div>
            )}
            {data.systemStatus && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">System Status</p>
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
                <p className="text-sm font-medium text-gray-600">Scope of Installation</p>
                <p className="whitespace-pre-wrap">{data.problemScope}</p>
              </div>
            )}
            {(data.equipmentInstalled || data.installQuantity) && (
              <div className="grid grid-cols-2 gap-4">
                {data.equipmentInstalled && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Equipment Installed</p>
                    <p>{data.equipmentInstalled}</p>
                  </div>
                )}
                {data.installQuantity && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quantity</p>
                    <p>{data.installQuantity}</p>
                  </div>
                )}
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">Testing Result</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.completionStatus && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completion Status</p>
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
                    <p className="text-sm font-medium text-gray-600">Areas Inspected</p>
                    <p>{data.areasInspected}</p>
                  </div>
                )}
                {data.systemsChecked && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Systems Checked</p>
                    <p>{data.systemsChecked}</p>
                  </div>
                )}
              </div>
            )}
            {data.findings && (
              <div>
                <p className="text-sm font-medium text-gray-600">Findings</p>
                <p className="whitespace-pre-wrap">{data.findings}</p>
              </div>
            )}
            {data.deficiencies && (
              <div>
                <p className="text-sm font-medium text-gray-600">Deficiencies</p>
                <p className="whitespace-pre-wrap">{data.deficiencies}</p>
              </div>
            )}
            {data.recommendations && (
              <div>
                <p className="text-sm font-medium text-gray-600">Recommendation</p>
                <p className="whitespace-pre-wrap">{data.recommendations}</p>
              </div>
            )}
            {data.inspectionResult && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inspection Result</p>
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
                <p className="text-sm font-medium text-gray-600">Systems Maintained</p>
                <p>{data.systemsMaintained}</p>
              </div>
            )}
            {data.maintenancePerformed && (
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Performed</p>
                <p className="whitespace-pre-wrap">{data.maintenancePerformed}</p>
              </div>
            )}
            {data.partsServiced && (
              <div>
                <p className="text-sm font-medium text-gray-600">Parts Serviced</p>
                <p>{data.partsServiced}</p>
              </div>
            )}
            {data.testResult && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Test Result</p>
                {getStatusBadge(data.testResult, 'test')}
              </div>
            )}
            {data.nextMaintenanceDate && (
              <div>
                <p className="text-sm font-medium text-gray-600">Next Maintenance Date</p>
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
            <p className="text-sm font-medium text-gray-600">Technician Notes</p>
            <p className="whitespace-pre-wrap">{data.technicianNotes}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      {data.photos && data.photos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Photos</h3>
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
            <p className="text-sm text-gray-500 mt-2">+{data.photos.length - 6} more photos</p>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Technician Signature</p>
          {data.technicianSignature ? (
            <img src={data.technicianSignature} alt="Technician Signature" className="h-16 border-b border-gray-300" />
          ) : (
            <div className="h-16 border-b border-gray-300"></div>
          )}
          <p className="text-sm text-gray-500 mt-1">{data.technicianName || 'Technician'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Client Signature</p>
          {data.clientSignature ? (
            <img src={data.clientSignature} alt="Client Signature" className="h-16 border-b border-gray-300" />
          ) : (
            <div className="h-16 border-b border-gray-300"></div>
          )}
          <p className="text-sm text-gray-500 mt-1">Client Representative</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Generated by {companyName} • www.tasheel.live</p>
        <p className="text-xs mt-1">Report generated on {formatDate(new Date().toISOString(), true)}</p>
      </div>
    </div>
  )
}
