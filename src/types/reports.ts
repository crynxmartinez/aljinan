// Report data types for each service type

// ============================================
// SERVICE REPORT (Repair/Service)
// ============================================
export interface PartReplaced {
  name: string
  quantity: number
  unitCost: number
  total: number
}

export interface ServiceReportData {
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

// ============================================
// INSPECTION REPORT
// ============================================
export interface InspectionChecklistItem {
  item: string
  status: 'pass' | 'fail' | 'na'
  notes: string
}

export interface InspectionReportData {
  checklistItems: InspectionChecklistItem[]
  overallStatus: 'pass' | 'fail' | 'conditional'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  nextInspectionDate: string
}

// ============================================
// MAINTENANCE REPORT
// ============================================
export interface MaintenanceTask {
  task: string
  completed: boolean
  notes: string
}

export interface Measurement {
  name: string
  value: string
  unit: string
  normalRange: string
  status: 'normal' | 'warning' | 'critical'
}

export interface ConsumableUsed {
  item: string
  quantity: string
}

export interface MaintenanceReportData {
  tasksPerformed: MaintenanceTask[]
  equipmentCondition: 'good' | 'fair' | 'poor' | 'critical'
  measurements: Measurement[]
  consumablesUsed: ConsumableUsed[]
  nextMaintenanceDate: string
}

// ============================================
// INSTALLATION REPORT
// ============================================
export interface EquipmentInstalled {
  name: string
  model: string
  serialNumber: string
  location: string
}

export interface CommissioningItem {
  item: string
  completed: boolean
  notes: string
}

export interface TestResult {
  test: string
  result: 'pass' | 'fail'
  notes: string
}

export interface InstallationReportData {
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

// ============================================
// UNION TYPE FOR ALL REPORT DATA
// ============================================
export type ReportData =
  | { type: 'SERVICE'; data: ServiceReportData }
  | { type: 'INSPECTION'; data: InspectionReportData }
  | { type: 'MAINTENANCE'; data: MaintenanceReportData }
  | { type: 'INSTALLATION'; data: InstallationReportData }
  | { type: 'STICKER_INSPECTION'; data: InspectionReportData }
  | { type: 'OTHER'; data: Record<string, unknown> }

// ============================================
// DEFAULT/EMPTY REPORT DATA
// ============================================
export const emptyServiceReportData: ServiceReportData = {
  problemDescription: '',
  rootCause: '',
  workPerformed: '',
  partsReplaced: [],
  laborHours: 0,
  laborRate: 0,
  laborCost: 0,
  totalPartsCost: 0,
  totalCost: 0,
  warrantyInfo: '',
  beforePhotos: [],
  afterPhotos: [],
}

export const emptyInspectionReportData: InspectionReportData = {
  checklistItems: [],
  overallStatus: 'pass',
  riskLevel: 'low',
  nextInspectionDate: '',
}

export const emptyMaintenanceReportData: MaintenanceReportData = {
  tasksPerformed: [],
  equipmentCondition: 'good',
  measurements: [],
  consumablesUsed: [],
  nextMaintenanceDate: '',
}

export const emptyInstallationReportData: InstallationReportData = {
  equipmentInstalled: [],
  configurationDetails: '',
  commissioningChecklist: [],
  testingResults: [],
  trainingProvided: false,
  trainingNotes: '',
  warrantyStartDate: '',
  warrantyEndDate: '',
  handoverSignature: '',
  handoverDate: '',
  handoverName: '',
}

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getEmptyReportData(workOrderType: string | null | undefined): ServiceReportData | InspectionReportData | MaintenanceReportData | InstallationReportData | null {
  switch (workOrderType) {
    case 'SERVICE':
      return { ...emptyServiceReportData }
    case 'INSPECTION':
    case 'STICKER_INSPECTION':
      return { ...emptyInspectionReportData }
    case 'MAINTENANCE':
      return { ...emptyMaintenanceReportData }
    case 'INSTALLATION':
      return { ...emptyInstallationReportData }
    default:
      return null
  }
}

export function getReportTitle(workOrderType: string | null | undefined): string {
  switch (workOrderType) {
    case 'SERVICE':
      return 'Service Report'
    case 'INSPECTION':
      return 'Inspection Report'
    case 'STICKER_INSPECTION':
      return 'Sticker Inspection Report'
    case 'MAINTENANCE':
      return 'Maintenance Report'
    case 'INSTALLATION':
      return 'Installation Report'
    default:
      return 'Work Order Report'
  }
}

export function getReportColor(workOrderType: string | null | undefined): string {
  switch (workOrderType) {
    case 'SERVICE':
      return 'orange'
    case 'INSPECTION':
    case 'STICKER_INSPECTION':
      return 'blue'
    case 'MAINTENANCE':
      return 'green'
    case 'INSTALLATION':
      return 'purple'
    default:
      return 'gray'
  }
}
