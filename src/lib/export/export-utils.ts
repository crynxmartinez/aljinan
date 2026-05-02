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
  return new Date(dateStr).toLocaleDateString('en-US', {
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
    if (wo.workOrderNumber) row['WO #'] = `WO-${String(wo.workOrderNumber).padStart(4, '0')}`
    row['Description'] = wo.description
    if (options.includeClient) {
      row['Client'] = wo.clientName
      row['Branch'] = wo.branchName
    }
    row['Status'] = formatStatus(wo.stage)
    row['Type'] = formatStatus(wo.workOrderType)
    if (options.includeDates) {
      row['Scheduled Date'] = formatDate(wo.scheduledDate)
    }
    if (options.includePricing) {
      row['Price (SAR)'] = wo.price ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Work Orders')

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
    if (wo.workOrderNumber) row['WO #'] = `WO-${String(wo.workOrderNumber).padStart(4, '0')}`
    row['Description'] = wo.description
    if (options.includeClient) {
      row['Client'] = wo.clientName
      row['Branch'] = wo.branchName
    }
    row['Status'] = formatStatus(wo.stage)
    row['Type'] = formatStatus(wo.workOrderType)
    if (options.includeDates) {
      row['Scheduled Date'] = formatDate(wo.scheduledDate)
    }
    if (options.includePricing) {
      row['Price (SAR)'] = wo.price ?? ''
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
  doc.text('Work Orders Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    doc.internal.pageSize.getWidth() / 2,
    22,
    { align: 'center' }
  )
  doc.text(`Total: ${data.length} work orders`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' })

  // Prepare table columns
  const columns: Array<{ header: string; dataKey: string }> = []
  columns.push({ header: 'WO #', dataKey: 'woNumber' })
  columns.push({ header: 'Description', dataKey: 'description' })
  if (options.includeClient) {
    columns.push({ header: 'Client', dataKey: 'client' })
    columns.push({ header: 'Branch', dataKey: 'branch' })
  }
  columns.push({ header: 'Status', dataKey: 'status' })
  columns.push({ header: 'Type', dataKey: 'type' })
  if (options.includeDates) {
    columns.push({ header: 'Date', dataKey: 'date' })
  }
  if (options.includePricing) {
    columns.push({ header: 'Price (SAR)', dataKey: 'price' })
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
      'Tasheel Safety Management Platform - www.tasheel.live',
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
    if (req.requestNumber) row['REQ #'] = `REQ-${String(req.requestNumber).padStart(4, '0')}`
    row['Title'] = req.title
    if (options.includeDetails) {
      row['Description'] = req.description || ''
      row['Type'] = req.workOrderType ? formatStatus(req.workOrderType) : ''
      row['Priority'] = formatStatus(req.priority)
      row['Assigned To'] = req.assignedTo || ''
    }
    row['Status'] = formatStatus(req.status)
    if (options.includeDates) {
      row['Created'] = formatDate(req.createdAt)
      row['Due Date'] = formatDate(req.dueDate)
      row['Completed'] = formatDate(req.completedAt)
      row['Quoted Date'] = formatDate(req.quotedDate)
    }
    if (options.includePricing) {
      row['Quoted Price (SAR)'] = req.quotedPrice ?? ''
    }
    if (req.recurringType && req.recurringType !== 'ONCE') {
      row['Frequency'] = formatStatus(req.recurringType)
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Requests')

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
    if (req.requestNumber) row['REQ #'] = `REQ-${String(req.requestNumber).padStart(4, '0')}`
    row['Title'] = req.title
    if (options.includeDetails) {
      row['Description'] = req.description || ''
      row['Type'] = req.workOrderType ? formatStatus(req.workOrderType) : ''
      row['Priority'] = formatStatus(req.priority)
      row['Assigned To'] = req.assignedTo || ''
    }
    row['Status'] = formatStatus(req.status)
    if (options.includeDates) {
      row['Created'] = formatDate(req.createdAt)
      row['Due Date'] = formatDate(req.dueDate)
      row['Completed'] = formatDate(req.completedAt)
    }
    if (options.includePricing) {
      row['Quoted Price (SAR)'] = req.quotedPrice ?? ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `requests-${new Date().toISOString().split('T')[0]}.csv`)
}
