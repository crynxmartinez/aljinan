import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportableWorkOrder {
  id: string
  description: string
  stage: string
  workOrderType: string | null
  scheduledDate: string | null
  price: number | null
  clientName: string
  branchName: string
  workOrderNumber?: number | null
}

export interface ExportableRequest {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  dueDate: string | null
  completedAt: string | null
  requestNumber?: number | null
  workOrderType?: string | null
  quotedPrice?: number | null
  quotedDate?: string | null
  recurringType?: string
}

export interface ExportOptions {
  includeDetails: boolean
  includeClient: boolean
  includePricing: boolean
  includeDates: boolean
  includePhotos: boolean
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return ''
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function exportWorkOrdersToExcel(
  data: ExportableWorkOrder[],
  options: ExportOptions
) {
  const rows = data.map(wo => {
    const row: Record<string, string | number> = {}
    if (wo.workOrderNumber) row['رقم الأمر'] = `WO-${String(wo.workOrderNumber).padStart(4, '0')}`
    row['الوصف'] = wo.description
    if (options.includeClient) {
      row['العميل'] = wo.clientName
      row['الفرع'] = wo.branchName
    }
    row['الحالة'] = formatStatus(wo.stage)
    row['النوع'] = formatStatus(wo.workOrderType)
    if (options.includeDates) {
      row['تاريخ الجدولة'] = formatDate(wo.scheduledDate)
    }
    if (options.includePricing) {
      row['السعر (ر.س)'] = wo.price ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'أوامر العمل')

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2
  }))
  ws['!cols'] = colWidths

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `work-orders-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export function exportWorkOrdersToCsv(
  data: ExportableWorkOrder[],
  options: ExportOptions
) {
  const rows = data.map(wo => {
    const row: Record<string, string | number> = {}
    if (wo.workOrderNumber) row['رقم الأمر'] = `WO-${String(wo.workOrderNumber).padStart(4, '0')}`
    row['الوصف'] = wo.description
    if (options.includeClient) {
      row['العميل'] = wo.clientName
      row['الفرع'] = wo.branchName
    }
    row['الحالة'] = formatStatus(wo.stage)
    row['النوع'] = formatStatus(wo.workOrderType)
    if (options.includeDates) {
      row['تاريخ الجدولة'] = formatDate(wo.scheduledDate)
    }
    if (options.includePricing) {
      row['السعر (ر.س)'] = wo.price ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `work-orders-${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportWorkOrdersToPdf(
  data: ExportableWorkOrder[],
  options: ExportOptions
) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.text('تقرير أوامر العمل', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.text(
    `تم الإنشاء في ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    doc.internal.pageSize.getWidth() / 2,
    22,
    { align: 'center' }
  )
  doc.text(`المجموع: ${data.length} أمر عمل`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' })

  // Prepare table columns
  const columns: Array<{ header: string; dataKey: string }> = []
  columns.push({ header: 'رقم الأمر', dataKey: 'woNumber' })
  columns.push({ header: 'الوصف', dataKey: 'description' })
  if (options.includeClient) {
    columns.push({ header: 'العميل', dataKey: 'client' })
    columns.push({ header: 'الفرع', dataKey: 'branch' })
  }
  columns.push({ header: 'الحالة', dataKey: 'status' })
  columns.push({ header: 'النوع', dataKey: 'type' })
  if (options.includeDates) {
    columns.push({ header: 'التاريخ', dataKey: 'date' })
  }
  if (options.includePricing) {
    columns.push({ header: 'السعر (ر.س)', dataKey: 'price' })
  }

  // Prepare table rows
  const rows = data.map(wo => {
    const row: Record<string, string> = {
      woNumber: wo.workOrderNumber ? `WO-${String(wo.workOrderNumber).padStart(4, '0')}` : '-',
      description: wo.description,
      status: formatStatus(wo.stage),
      type: formatStatus(wo.workOrderType),
    }
    if (options.includeClient) {
      row.client = wo.clientName
      row.branch = wo.branchName
    }
    if (options.includeDates) {
      row.date = formatDate(wo.scheduledDate)
    }
    if (options.includePricing) {
      row.price = wo.price ? wo.price.toLocaleString() : '-'
    }
    return row
  })

  // Generate table
  autoTable(doc, {
    startY: 35,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      'منصة تسهيل لإدارة السلامة - www.tasheel.live',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`work-orders-${new Date().toISOString().split('T')[0]}.pdf`)
}

export function exportRequestsToExcel(
  data: ExportableRequest[],
  options: ExportOptions
) {
  const rows = data.map(req => {
    const row: Record<string, string | number> = {}
    if (req.requestNumber) row['رقم الطلب'] = `REQ-${String(req.requestNumber).padStart(4, '0')}`
    row['العنوان'] = req.title
    if (options.includeDetails) {
      row['الوصف'] = req.description || ''
      row['النوع'] = req.workOrderType ? formatStatus(req.workOrderType) : ''
      row['الأولوية'] = formatStatus(req.priority)
      row['مُسند إلى'] = req.assignedTo || ''
    }
    row['الحالة'] = formatStatus(req.status)
    if (options.includeDates) {
      row['تاريخ الإنشاء'] = formatDate(req.createdAt)
      row['تاريخ الاستحقاق'] = formatDate(req.dueDate)
      row['تاريخ الإكمال'] = formatDate(req.completedAt)
      row['تاريخ التسعير'] = formatDate(req.quotedDate)
    }
    if (options.includePricing) {
      row['السعر المسعر (ر.س)'] = req.quotedPrice ?? ''
    }
    if (req.recurringType && req.recurringType !== 'ONCE') {
      row['التكرار'] = formatStatus(req.recurringType)
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'الطلبات')

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2
  }))
  ws['!cols'] = colWidths

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `requests-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export function exportRequestsToCsv(
  data: ExportableRequest[],
  options: ExportOptions
) {
  const rows = data.map(req => {
    const row: Record<string, string | number> = {}
    if (req.requestNumber) row['رقم الطلب'] = `REQ-${String(req.requestNumber).padStart(4, '0')}`
    row['العنوان'] = req.title
    if (options.includeDetails) {
      row['الوصف'] = req.description || ''
      row['النوع'] = req.workOrderType ? formatStatus(req.workOrderType) : ''
      row['الأولوية'] = formatStatus(req.priority)
      row['مُسند إلى'] = req.assignedTo || ''
    }
    row['الحالة'] = formatStatus(req.status)
    if (options.includeDates) {
      row['تاريخ الإنشاء'] = formatDate(req.createdAt)
      row['تاريخ الاستحقاق'] = formatDate(req.dueDate)
      row['تاريخ الإكمال'] = formatDate(req.completedAt)
    }
    if (options.includePricing) {
      row['السعر المسعر (ر.س)'] = req.quotedPrice ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `requests-${new Date().toISOString().split('T')[0]}.csv`)
}
