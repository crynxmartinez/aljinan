'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/use-translation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
} from '@/components/ui/dropdown-menu'
import {
  FileCheck,
  Plus,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Link as LinkIcon,
  Award,
  ClipboardList,
  Calendar,
  PenTool,
  ChevronDown,
  ChevronRight,
  X,
  Building,
  Edit,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ContractWorkOrdersDisplay } from './contract-work-orders-display'
import { ContractAttachmentsSection } from './contract-attachments-section'
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone'
import { api } from '@/lib/api-client'

interface WorkOrder {
  id: string
  description: string
  price: number | null
  scheduledDate: string | null
  stage: string
}

interface Checklist {
  id: string
  title: string
  items: WorkOrder[]
}

interface ContractSystem {
  id: string
  name: string
  description: string | null
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
  visitDates: string[]
  dateMode: 'MANUAL' | 'AUTOMATIC'
  paymentDueDates: string[]
  paymentAmounts: string[] // Amount per payment as string for input
  paymentDateMode: 'AUTOMATIC' | 'MANUAL'
  pricePerVisit: number | null
  order: number
}

interface ContractPayment {
  id: string
  paymentNo: number
  dueDate: string | null
  amount: number | null
  status: string
  order: number
}

interface Contract {
  id: string
  title: string
  description: string | null
  fileName: string | null
  fileUrl: string | null
  fileSize: number | null
  startDate: string | null
  endDate: string | null
  autoRenew: boolean
  startSignedAt: string | null
  endSignedAt: string | null
  startSignatureUrl: string | null
  endSignatureUrl: string | null
  certificateFileName: string | null
  certificateUrl: string | null
  totalValue: number | null
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'COMPLETED' | 'EXPIRED' | 'TERMINATED'
  createdAt: string
  checklist: Checklist | null
  systems: ContractSystem[]
  payments: ContractPayment[]
}

interface ContractsListProps {
  branchId: string
}

export function ContractsList({ branchId }: ContractsListProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const tcl = t.dashboard.contractsList
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [attachPdfDialogOpen, setAttachPdfDialogOpen] = useState(false)
  const [attachCertDialogOpen, setAttachCertDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [certUrl, setCertUrl] = useState('')
  const [certFileName, setCertFileName] = useState('')

  // Contract file upload state
  const [contractFile, setContractFile] = useState<{ url: string; name: string } | null>(null)
  const [uploadingContract, setUploadingContract] = useState(false)
  const [editContractFile, setEditContractFile] = useState<{ url: string; name: string } | null>(null)
  const [uploadingEditContract, setUploadingEditContract] = useState(false)

  // Success message state
  const [successMessage, setSuccessMessage] = useState('')

  // System form type
  type SystemForm = {
    name: string
    description: string
    frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
    visitDates: string[]
    dateMode: 'MANUAL' | 'AUTOMATIC'
    paymentDueDates: string[]
    paymentAmounts: string[]
    paymentDateMode: 'AUTOMATIC' | 'MANUAL'
  }

  // Payment form type
  type PaymentForm = {
    paymentNo: number
    dueDate: string
    amount: string
  }

  const [newContract, setNewContract] = useState({
    title: '',
    description: '',
    fileName: '',
    fileUrl: '',
    startDate: '',
    endDate: '',
    autoRenew: false,
    status: 'DRAFT' as Contract['status'],
    systems: [] as SystemForm[],
    payments: [
      { paymentNo: 1, dueDate: '', amount: '' },
      { paymentNo: 2, dueDate: '', amount: '' },
      { paymentNo: 3, dueDate: '', amount: '' },
      { paymentNo: 4, dueDate: '', amount: '' },
    ] as PaymentForm[],
  })

  // Edit contract state
  const [editContract, setEditContract] = useState<{
    id: string
    title: string
    description: string
    fileName: string
    fileUrl: string
    startDate: string
    endDate: string
    autoRenew: boolean
    systems: SystemForm[]
    payments: PaymentForm[]
  } | null>(null)

  // Standalone work orders state
  const [standaloneWorkOrders, setStandaloneWorkOrders] = useState<{ id: string; description: string; scheduledDate: string | null; stage: string; price: number | null; workOrderType: string | null }[]>([])
  const [stickerInspections, setStickerInspections] = useState<{ id: string; description: string; scheduledDate: string | null; stage: string; price: number | null; workOrderType: string | null }[]>([])
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
  const [stickerInspectionsExpanded, setStickerInspectionsExpanded] = useState(true)

  // Helper: Get number of visits based on frequency
  const getVisitCount = (frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY') => {
    switch (frequency) {
      case 'MONTHLY': return 12
      case 'QUARTERLY': return 4
      case 'SEMI_ANNUALLY': return 2
      case 'ANNUALLY': return 1
      default: return 1
    }
  }

  // Helper: Add a new system
  const addSystem = () => {
    setNewContract({
      ...newContract,
      systems: [
        ...newContract.systems,
        { name: '', description: '', frequency: 'QUARTERLY', visitDates: ['', '', '', ''], dateMode: 'MANUAL', paymentDueDates: ['', '', '', ''], paymentAmounts: ['', '', '', ''], paymentDateMode: 'AUTOMATIC' }
      ]
    })
  }

  // Helper: Remove a system
  const removeSystem = (index: number) => {
    const updated = [...newContract.systems]
    updated.splice(index, 1)
    setNewContract({ ...newContract, systems: updated })
  }

  // Helper: Calculate auto dates based on frequency and first date
  const calculateAutoDates = (firstDate: string, frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'): string[] => {
    if (!firstDate) return Array(getVisitCount(frequency)).fill('')

    const monthIncrement = {
      'MONTHLY': 1,
      'QUARTERLY': 3,
      'SEMI_ANNUALLY': 6,
      'ANNUALLY': 12
    }

    const visitCount = getVisitCount(frequency)
    const dates: string[] = [firstDate]
    const startDate = new Date(firstDate)

    for (let i = 1; i < visitCount; i++) {
      const nextDate = new Date(startDate)
      nextDate.setMonth(nextDate.getMonth() + (monthIncrement[frequency] * i))
      dates.push(nextDate.toISOString().split('T')[0])
    }

    return dates
  }

  // Helper: Calculate payment due dates (visit date + 10 days)
  const calculatePaymentDueDates = (visitDates: string[]): string[] => {
    return visitDates.map(visitDate => {
      if (!visitDate) return ''
      const date = new Date(visitDate)
      date.setDate(date.getDate() + 10)
      return date.toISOString().split('T')[0]
    })
  }

  // Helper: Update a system field
  const updateSystem = (index: number, field: keyof SystemForm, value: string | string[]) => {
    const updated = [...newContract.systems]
    if (field === 'frequency') {
      const freq = value as 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
      const visitCount = getVisitCount(freq)
      // If automatic mode, recalculate dates from first date
      if (updated[index].dateMode === 'AUTOMATIC' && updated[index].visitDates[0]) {
        const newVisitDates = calculateAutoDates(updated[index].visitDates[0], freq)
        updated[index] = {
          ...updated[index],
          frequency: freq,
          visitDates: newVisitDates,
          paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : Array(visitCount).fill(''),
          paymentAmounts: Array(visitCount).fill('')
        }
      } else {
        updated[index] = {
          ...updated[index],
          frequency: freq,
          visitDates: Array(visitCount).fill(''),
          paymentDueDates: Array(visitCount).fill(''),
          paymentAmounts: Array(visitCount).fill('')
        }
      }
    } else if (field === 'dateMode') {
      const mode = value as 'MANUAL' | 'AUTOMATIC'
      if (mode === 'AUTOMATIC' && updated[index].visitDates[0]) {
        // Auto-calculate dates from first date
        const newVisitDates = calculateAutoDates(updated[index].visitDates[0], updated[index].frequency)
        updated[index] = {
          ...updated[index],
          dateMode: mode,
          visitDates: newVisitDates,
          paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[index].paymentDueDates
        }
      } else {
        updated[index] = { ...updated[index], dateMode: mode }
      }
    } else if (field === 'paymentDateMode') {
      const mode = value as 'AUTOMATIC' | 'MANUAL'
      if (mode === 'AUTOMATIC') {
        // Auto-calculate payment dates from visit dates
        updated[index] = {
          ...updated[index],
          paymentDateMode: mode,
          paymentDueDates: calculatePaymentDueDates(updated[index].visitDates)
        }
      } else {
        updated[index] = { ...updated[index], paymentDateMode: mode }
      }
    } else if (field === 'visitDates') {
      const newVisitDates = value as string[]
      updated[index] = {
        ...updated[index],
        visitDates: newVisitDates,
        paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[index].paymentDueDates
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setNewContract({ ...newContract, systems: updated })
  }

  // Helper: Update a visit date for a system
  const updateVisitDate = (systemIndex: number, dateIndex: number, value: string) => {
    const updated = [...newContract.systems]

    // If automatic mode and changing first date, recalculate all dates
    if (updated[systemIndex].dateMode === 'AUTOMATIC' && dateIndex === 0) {
      const newVisitDates = calculateAutoDates(value, updated[systemIndex].frequency)
      updated[systemIndex] = {
        ...updated[systemIndex],
        visitDates: newVisitDates,
        paymentDueDates: updated[systemIndex].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[systemIndex].paymentDueDates
      }
    } else {
      const dates = [...updated[systemIndex].visitDates]
      dates[dateIndex] = value
      // Also update payment due date if in automatic mode
      const paymentDates = [...updated[systemIndex].paymentDueDates]
      if (updated[systemIndex].paymentDateMode === 'AUTOMATIC' && value) {
        const paymentDate = new Date(value)
        paymentDate.setDate(paymentDate.getDate() + 10)
        paymentDates[dateIndex] = paymentDate.toISOString().split('T')[0]
      }
      updated[systemIndex] = { ...updated[systemIndex], visitDates: dates, paymentDueDates: paymentDates }
    }
    setNewContract({ ...newContract, systems: updated })
  }

  // Helper: Update a payment due date for a system
  const updatePaymentDueDate = (systemIndex: number, dateIndex: number, value: string) => {
    const updated = [...newContract.systems]
    const paymentDates = [...updated[systemIndex].paymentDueDates]
    paymentDates[dateIndex] = value
    updated[systemIndex] = { ...updated[systemIndex], paymentDueDates: paymentDates }
    setNewContract({ ...newContract, systems: updated })
  }

  // Helper: Update a payment amount for a system
  const updatePaymentAmount = (systemIndex: number, amountIndex: number, value: string) => {
    const updated = [...newContract.systems]
    const amounts = [...updated[systemIndex].paymentAmounts]
    amounts[amountIndex] = value
    updated[systemIndex] = { ...updated[systemIndex], paymentAmounts: amounts }
    setNewContract({ ...newContract, systems: updated })
  }

  // Helper: Update a payment field
  const updatePayment = (index: number, field: 'dueDate' | 'amount', value: string) => {
    const updated = [...newContract.payments]
    updated[index] = { ...updated[index], [field]: value }
    setNewContract({ ...newContract, payments: updated })
  }

  // Helper: Get ordinal suffix
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  // Handle contract file upload (create form)
  const handleContractFileUpload = async (files: File[]) => {
    if (files.length === 0) return
    setUploadingContract(true)
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('type', 'document')
      formData.append('folder', 'contracts')
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      setContractFile({ url: data.url, name: data.filename })
      setNewContract({ ...newContract, fileName: data.filename, fileUrl: data.url })
    } catch (err) {
      console.error('Failed to upload contract file:', err)
      setError('Failed to upload contract file')
    } finally {
      setUploadingContract(false)
    }
  }

  // Handle contract file upload (edit form)
  const handleEditContractFileUpload = async (files: File[]) => {
    if (files.length === 0 || !editContract) return
    setUploadingEditContract(true)
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('type', 'document')
      formData.append('folder', 'contracts')
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      setEditContractFile({ url: data.url, name: data.filename })
      setEditContract({ ...editContract, fileName: data.filename, fileUrl: data.url })
    } catch (err) {
      console.error('Failed to upload contract file:', err)
      setError('Failed to upload contract file')
    } finally {
      setUploadingEditContract(false)
    }
  }

  // Helper: Open edit dialog with contract data
  const openEditDialog = (contract: Contract) => {
    setEditContract({
      id: contract.id,
      title: contract.title,
      description: contract.description || '',
      fileName: contract.fileName || '',
      fileUrl: contract.fileUrl || '',
      startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
      endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
      autoRenew: contract.autoRenew,
      systems: contract.systems?.map(s => ({
        name: s.name,
        description: s.description || '',
        frequency: s.frequency,
        visitDates: Array.isArray(s.visitDates) ? s.visitDates.map((d: string) => d ? d.split('T')[0] : '') : [],
        dateMode: (s.dateMode as 'MANUAL' | 'AUTOMATIC') || 'MANUAL',
        paymentDueDates: Array.isArray(s.paymentDueDates) ? s.paymentDueDates.map((d: string) => d ? d.split('T')[0] : '') : [],
        paymentAmounts: Array.isArray(s.paymentAmounts) ? (s.paymentAmounts as (number | string | null)[]).map(a => a?.toString() || '') : Array(getVisitCount(s.frequency)).fill(''),
        paymentDateMode: (s.paymentDateMode as 'AUTOMATIC' | 'MANUAL') || 'AUTOMATIC'
      })) || [],
      payments: contract.payments?.length > 0
        ? contract.payments.map(p => ({
          paymentNo: p.paymentNo,
          dueDate: p.dueDate ? p.dueDate.split('T')[0] : '',
          amount: p.amount?.toString() || ''
        }))
        : [
          { paymentNo: 1, dueDate: '', amount: '' },
          { paymentNo: 2, dueDate: '', amount: '' },
          { paymentNo: 3, dueDate: '', amount: '' },
          { paymentNo: 4, dueDate: '', amount: '' },
        ]
    })
    // Set existing file if present
    if (contract.fileUrl && contract.fileName) {
      setEditContractFile({ url: contract.fileUrl, name: contract.fileName })
    } else {
      setEditContractFile(null)
    }
    setEditDialogOpen(true)
  }

  // Helper functions for edit form
  const addEditSystem = () => {
    if (!editContract) return
    setEditContract({
      ...editContract,
      systems: [
        ...editContract.systems,
        { name: '', description: '', frequency: 'QUARTERLY', visitDates: ['', '', '', ''], dateMode: 'MANUAL', paymentDueDates: ['', '', '', ''], paymentAmounts: ['', '', '', ''], paymentDateMode: 'AUTOMATIC' }
      ]
    })
  }

  const removeEditSystem = (index: number) => {
    if (!editContract) return
    const updated = [...editContract.systems]
    updated.splice(index, 1)
    setEditContract({ ...editContract, systems: updated })
  }

  const updateEditSystem = (index: number, field: keyof SystemForm, value: string | string[]) => {
    if (!editContract) return
    const updated = [...editContract.systems]
    if (field === 'frequency') {
      const freq = value as 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
      const visitCount = getVisitCount(freq)
      // If automatic mode, recalculate dates from first date
      if (updated[index].dateMode === 'AUTOMATIC' && updated[index].visitDates[0]) {
        const newVisitDates = calculateAutoDates(updated[index].visitDates[0], freq)
        updated[index] = {
          ...updated[index],
          frequency: freq,
          visitDates: newVisitDates,
          paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : Array(visitCount).fill(''),
          paymentAmounts: Array(visitCount).fill('')
        }
      } else {
        updated[index] = {
          ...updated[index],
          frequency: freq,
          visitDates: Array(visitCount).fill(''),
          paymentDueDates: Array(visitCount).fill(''),
          paymentAmounts: Array(visitCount).fill('')
        }
      }
    } else if (field === 'dateMode') {
      const mode = value as 'MANUAL' | 'AUTOMATIC'
      if (mode === 'AUTOMATIC' && updated[index].visitDates[0]) {
        // Auto-calculate dates from first date
        const newVisitDates = calculateAutoDates(updated[index].visitDates[0], updated[index].frequency)
        updated[index] = {
          ...updated[index],
          dateMode: mode,
          visitDates: newVisitDates,
          paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[index].paymentDueDates
        }
      } else {
        updated[index] = { ...updated[index], dateMode: mode }
      }
    } else if (field === 'paymentDateMode') {
      const mode = value as 'AUTOMATIC' | 'MANUAL'
      if (mode === 'AUTOMATIC') {
        // Auto-calculate payment dates from visit dates
        updated[index] = {
          ...updated[index],
          paymentDateMode: mode,
          paymentDueDates: calculatePaymentDueDates(updated[index].visitDates)
        }
      } else {
        updated[index] = { ...updated[index], paymentDateMode: mode }
      }
    } else if (field === 'visitDates') {
      const newVisitDates = value as string[]
      updated[index] = {
        ...updated[index],
        visitDates: newVisitDates,
        paymentDueDates: updated[index].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[index].paymentDueDates
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setEditContract({ ...editContract, systems: updated })
  }

  const updateEditVisitDate = (systemIndex: number, dateIndex: number, value: string) => {
    if (!editContract) return
    const updated = [...editContract.systems]

    // If automatic mode and changing first date, recalculate all dates
    if (updated[systemIndex].dateMode === 'AUTOMATIC' && dateIndex === 0) {
      const newVisitDates = calculateAutoDates(value, updated[systemIndex].frequency)
      updated[systemIndex] = {
        ...updated[systemIndex],
        visitDates: newVisitDates,
        paymentDueDates: updated[systemIndex].paymentDateMode === 'AUTOMATIC' ? calculatePaymentDueDates(newVisitDates) : updated[systemIndex].paymentDueDates
      }
    } else {
      const dates = [...updated[systemIndex].visitDates]
      dates[dateIndex] = value
      // Also update payment due date if in automatic mode
      const paymentDates = [...updated[systemIndex].paymentDueDates]
      if (updated[systemIndex].paymentDateMode === 'AUTOMATIC' && value) {
        const paymentDate = new Date(value)
        paymentDate.setDate(paymentDate.getDate() + 10)
        paymentDates[dateIndex] = paymentDate.toISOString().split('T')[0]
      }
      updated[systemIndex] = { ...updated[systemIndex], visitDates: dates, paymentDueDates: paymentDates }
    }
    setEditContract({ ...editContract, systems: updated })
  }

  // Helper: Update a payment due date for edit form
  const updateEditPaymentDueDate = (systemIndex: number, dateIndex: number, value: string) => {
    if (!editContract) return
    const updated = [...editContract.systems]
    const paymentDates = [...updated[systemIndex].paymentDueDates]
    paymentDates[dateIndex] = value
    updated[systemIndex] = { ...updated[systemIndex], paymentDueDates: paymentDates }
    setEditContract({ ...editContract, systems: updated })
  }

  // Helper: Update a payment amount for edit form
  const updateEditPaymentAmount = (systemIndex: number, amountIndex: number, value: string) => {
    if (!editContract) return
    const updated = [...editContract.systems]
    const amounts = [...updated[systemIndex].paymentAmounts]
    amounts[amountIndex] = value
    updated[systemIndex] = { ...updated[systemIndex], paymentAmounts: amounts }
    setEditContract({ ...editContract, systems: updated })
  }

  const updateEditPayment = (index: number, field: 'dueDate' | 'amount', value: string) => {
    if (!editContract) return
    const updated = [...editContract.payments]
    updated[index] = { ...updated[index], [field]: value }
    setEditContract({ ...editContract, payments: updated })
  }

  // Handle edit contract submit
  const handleEditContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContract) return

    setEditing(true)
    setError('')

    try {
      // Prepare systems data
      const systemsData = editContract.systems
        .filter(s => s.name.trim())
        .map(s => ({
          name: s.name,
          description: s.description || null,
          frequency: s.frequency,
          visitDates: s.visitDates.filter(d => d),
          dateMode: s.dateMode,
          paymentDueDates: s.paymentDueDates.filter(d => d),
          paymentAmounts: s.paymentAmounts,
          paymentDateMode: s.paymentDateMode
        }))

      // Prepare payments data
      const paymentsData = editContract.payments
        .filter(p => p.dueDate)
        .map(p => ({
          paymentNo: p.paymentNo,
          dueDate: p.dueDate || null,
          amount: p.amount ? parseFloat(p.amount) : null
        }))

      const response = await fetch(`/api/branches/${branchId}/contracts/${editContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editContract.title,
          description: editContract.description || null,
          fileName: editContract.fileName || null,
          fileUrl: editContract.fileUrl || null,
          startDate: editContract.startDate || null,
          endDate: editContract.endDate || null,
          autoRenew: editContract.autoRenew,
          systems: systemsData,
          payments: paymentsData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contract')
      }

      setEditDialogOpen(false)
      setEditContract(null)
      fetchContracts()
      router.refresh()

      // Show notification if re-signature is required
      if (data.requiresResignature) {
        setSuccessMessage('Contract updated. The client will need to re-sign the contract to approve the changes.')
        // Auto-hide after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setEditing(false)
    }
  }

  const fetchContracts = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/contracts`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStandaloneWorkOrders = async () => {
    try {
      const response = await fetch(`/api/branches/${branchId}/checklist-items`)
      if (response.ok) {
        const data = await response.json()
        // Filter for standalone work orders (contractTitle is null) - excludes sticker inspections
        const standalone = data.filter((wo: { contractTitle: string | null; workOrderType: string | null }) =>
          wo.contractTitle === null && wo.workOrderType !== 'STICKER_INSPECTION'
        )
        setStandaloneWorkOrders(standalone)
        // Filter for sticker inspections
        const stickers = data.filter((wo: { contractTitle: string | null; workOrderType: string | null }) =>
          wo.contractTitle === null && wo.workOrderType === 'STICKER_INSPECTION'
        )
        setStickerInspections(stickers)
      }
    } catch (err) {
      console.error('Failed to fetch standalone work orders:', err)
    }
  }

  useEffect(() => {
    fetchContracts()
    fetchStandaloneWorkOrders()
  }, [branchId])

  const handleCreateContract = async (e: React.FormEvent, activateImmediately: boolean = false) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      // Prepare systems data - filter out empty systems
      const systemsData = newContract.systems
        .filter(s => s.name.trim())
        .map(s => ({
          name: s.name,
          description: s.description || null,
          frequency: s.frequency,
          visitDates: s.visitDates.filter(d => d), // Filter out empty dates
          dateMode: s.dateMode,
          paymentDueDates: s.paymentDueDates.filter(d => d),
          paymentAmounts: s.paymentAmounts,
          paymentDateMode: s.paymentDateMode
        }))

      // Prepare payments data - filter out payments without dates
      const paymentsData = newContract.payments
        .filter(p => p.dueDate)
        .map(p => ({
          paymentNo: p.paymentNo,
          dueDate: p.dueDate || null,
          amount: p.amount ? parseFloat(p.amount) : null
        }))

      // Create the contract
      const response = await fetch(`/api/branches/${branchId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newContract.title,
          description: newContract.description || null,
          fileName: newContract.fileName || null,
          fileUrl: newContract.fileUrl || null,
          startDate: newContract.startDate || null,
          endDate: newContract.endDate || null,
          autoRenew: newContract.autoRenew,
          status: activateImmediately ? 'PENDING_SIGNATURE' : 'DRAFT',
          systems: systemsData,
          payments: paymentsData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create contract')
      }

      setCreateDialogOpen(false)
      setContractFile(null)
      setNewContract({
        title: '',
        description: '',
        fileName: '',
        fileUrl: '',
        startDate: '',
        endDate: '',
        autoRenew: false,
        status: 'DRAFT',
        systems: [],
        payments: [
          { paymentNo: 1, dueDate: '', amount: '' },
          { paymentNo: 2, dueDate: '', amount: '' },
          { paymentNo: 3, dueDate: '', amount: '' },
          { paymentNo: 4, dueDate: '', amount: '' },
        ],
      })
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (contractId: string, status: Contract['status']) => {
    try {
      await api.patch(`/api/branches/${branchId}/contracts/${contractId}`, { status })
      fetchContracts()
      router.refresh()
    } catch (err) {
      console.error('Failed to update contract:', err)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm(tcl.deleteConfirm)) return

    try {
      await api.delete(`/api/branches/${branchId}/contracts/${contractId}`)
      fetchContracts()
      router.refresh()
    } catch (err) {
      console.error('Failed to delete contract:', err)
    }
  }

  const openAttachPdfDialog = (contract: Contract) => {
    setSelectedContract(contract)
    setPdfUrl(contract.fileUrl || '')
    setPdfFileName(contract.fileName || '')
    setError('')
    setAttachPdfDialogOpen(true)
  }

  const handleAttachPdf = async () => {
    if (!selectedContract) return
    setAttaching(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: pdfUrl,
          fileName: pdfFileName || 'Contract Document.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to attach PDF')
      }

      setAttachPdfDialogOpen(false)
      setPdfUrl('')
      setPdfFileName('')
      setSelectedContract(null)
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAttaching(false)
    }
  }

  const openAttachCertDialog = (contract: Contract) => {
    setSelectedContract(contract)
    setCertUrl(contract.certificateUrl || '')
    setCertFileName(contract.certificateFileName || '')
    setError('')
    setAttachCertDialogOpen(true)
  }

  const handleAttachCert = async () => {
    if (!selectedContract) return
    setAttaching(true)
    setError('')

    try {
      const response = await fetch(`/api/branches/${branchId}/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateUrl: certUrl,
          certificateFileName: certFileName || 'Certificate.pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to attach certificate')
      }

      setAttachCertDialogOpen(false)
      setCertUrl('')
      setCertFileName('')
      setSelectedContract(null)
      fetchContracts()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAttaching(false)
    }
  }

  const getStatusBadge = (status: Contract['status']) => {
    const config: Record<string, { style: string; icon: typeof FileText; label: string }> = {
      DRAFT: { style: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
      PENDING_SIGNATURE: { style: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Awaiting Signature' },
      SIGNED: { style: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Active' },
      COMPLETED: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
      EXPIRED: { style: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Expired' },
      TERMINATED: { style: 'bg-red-100 text-red-700', icon: XCircle, label: 'Terminated' },
    }
    const { style, icon: Icon, label } = config[status] || config.DRAFT
    return (
      <Badge className={`${style} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      SEMI_ANNUALLY: 'Semi-Annually',
      ANNUALLY: 'Annually'
    }
    return labels[frequency] || frequency
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Success Message Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{tcl.contracts}</CardTitle>
            <CardDescription>{tcl.contractsDesc}</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            Add Contract
          </Button>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{tcl.noContractsYet}</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {tcl.noContractsDesc}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                Add Contract
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => {
                const workOrderCount = contract.checklist?.items.length || 0

                return (
                  <div
                    key={contract.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedContract(contract)
                      setDetailDialogOpen(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{contract.title}</h4>
                          {getStatusBadge(contract.status)}
                        </div>
                        {contract.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {contract.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {contract.startDate && contract.endDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(contract.startDate).toLocaleDateString('ar-SA')} - {new Date(contract.endDate).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          {contract.totalValue && (
                            <span className="font-medium text-primary">
                              ر.س {contract.totalValue.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {workOrderCount > 0 && (
                            <span className="flex items-center gap-1">
                              <ClipboardList className="h-3 w-3" />
                              {workOrderCount} {tcl.workOrdersCount.replace("{count}", "")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Indicator Badges */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Badge
                        variant="outline"
                        className={contract.fileUrl
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                        }
                      >
                        <FileText className="h-3 w-3 me-1" />
                        {tcl.pdf} {contract.fileUrl ? '✓' : '—'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={contract.certificateUrl
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                        }
                      >
                        <Award className="h-3 w-3 me-1" />
                        {tcl.cert} {contract.certificateUrl ? '✓' : '—'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={contract.startSignedAt
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                        }
                      >
                        <PenTool className="h-3 w-3 me-1" />
                        {tcl.signed} {contract.startSignedAt ? '✓' : '—'}
                      </Badge>

                      <div className="flex-1" />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(contract)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedContract(contract)
                          setDetailDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Requests Section - Read-only, no signatures needed */}
      {standaloneWorkOrders.length > 0 && (
        <Collapsible open={standaloneExpanded} onOpenChange={setStandaloneExpanded}>
          <Card className="border-blue-200 bg-blue-50/30 mt-6">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {standaloneExpanded ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronRight className="h-5 w-5 text-blue-600" />}
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <ClipboardList className="h-5 w-5" />
                      Service Requests
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-700">{tcl.adhoc}</Badge>
                    <Badge variant="secondary">{standaloneWorkOrders.length}</Badge>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-blue-700">
                      ر.س {standaloneWorkOrders.reduce((sum, wo) => sum + (wo.price || 0), 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-600">{tcl.totalValue}</p>
                  </div>
                </div>
                <CardDescription className="text-blue-600 text-start mt-2">
                  {tcl.serviceRequestsDesc}
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {standaloneWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                    >
                      <div className="space-y-1">
                        <span className="font-medium">{wo.description}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {wo.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(wo.scheduledDate).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {wo.stage}
                          </Badge>
                        </div>
                      </div>
                      {wo.price && (
                        <span className="font-semibold text-blue-700">
                          ر.س {wo.price.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    {tcl.serviceRequestsNote}
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Sticker Inspections Section - Read-only, no signatures needed */}
      {stickerInspections.length > 0 && (
        <Collapsible open={stickerInspectionsExpanded} onOpenChange={setStickerInspectionsExpanded}>
          <Card className="border-amber-200 bg-amber-50/30 mt-6">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stickerInspectionsExpanded ? <ChevronDown className="h-5 w-5 text-amber-600" /> : <ChevronRight className="h-5 w-5 text-amber-600" />}
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <ClipboardList className="h-5 w-5" />
                      Sticker Inspections
                    </CardTitle>
                    <Badge className="bg-amber-100 text-amber-700">{tcl.equipment}</Badge>
                    <Badge variant="secondary">{stickerInspections.length}</Badge>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-amber-700">
                      ر.س {stickerInspections.reduce((sum, wo) => sum + (wo.price || 0), 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-amber-600">{tcl.totalValue}</p>
                  </div>
                </div>
                <CardDescription className="text-amber-600 text-start mt-2">
                  {tcl.stickerInspectionsDesc}
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {stickerInspections.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                    >
                      <div className="space-y-1">
                        <span className="font-medium">{wo.description}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {wo.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(wo.scheduledDate).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {wo.stage}
                          </Badge>
                        </div>
                      </div>
                      {wo.price && (
                        <span className="font-semibold text-amber-700">
                          ر.س {wo.price.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    {tcl.stickerInspectionsNote}
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tcl.createContract}</DialogTitle>
            <DialogDescription>
              {tcl.createContractDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContract}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-6">
              {/* Contract Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{tcl.contractTitle}</Label>
                <Input
                  id="title"
                  value={newContract.title}
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  placeholder={tcl.titlePlaceholder}
                  required
                />
              </div>

              {/* Dates and Auto-Renew */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{tcl.startDate}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{tcl.endDate}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tcl.autoRenew}</Label>
                  <div className="flex items-center h-10">
                    <Switch
                      checked={newContract.autoRenew}
                      onCheckedChange={(checked) => setNewContract({ ...newContract, autoRenew: checked })}
                    />
                    <span className="ms-2 text-sm text-muted-foreground">
                      {newContract.autoRenew ? tcl.yes : tcl.no}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scope of Work Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">{tcl.scopeOfWorkTitle}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addSystem}>
                    <Plus className="h-4 w-4 me-1" />
                    Add System
                  </Button>
                </div>

                {newContract.systems.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">{tcl.noSystemsAdded}</p>
                    <Button type="button" variant="link" size="sm" onClick={addSystem}>
                      Add your first system
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {newContract.systems.map((system, sysIndex) => (
                      <div key={sysIndex} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{tcl.systemNumber.replace('{index}', String(sysIndex + 1))}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSystem(sysIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* System Name */}
                        <div className="space-y-2">
                          <Input
                            value={system.name}
                            onChange={(e) => updateSystem(sysIndex, 'name', e.target.value)}
                            placeholder={tcl.systemPlaceholder}
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">{tcl.descriptionOptional}</Label>
                          <Textarea
                            value={system.description}
                            onChange={(e) => updateSystem(sysIndex, 'description', e.target.value)}
                            placeholder={tcl.descriptionPlaceholder}
                            rows={2}
                          />
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                          <Label>{tcl.frequency}</Label>
                          <Select
                            value={system.frequency}
                            onValueChange={(value) => updateSystem(sysIndex, 'frequency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={tcl.selectFrequency} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">{tcl.monthlyVisits}</SelectItem>
                              <SelectItem value="QUARTERLY">{tcl.quarterlyVisits}</SelectItem>
                              <SelectItem value="SEMI_ANNUALLY">{tcl.semiAnnuallyVisits}</SelectItem>
                              <SelectItem value="ANNUALLY">{tcl.annuallyVisits}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Mode Toggle */}
                        <div className="flex items-center gap-3 py-2">
                          <Label className="text-xs text-muted-foreground">{tcl.dateEntry}</Label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateSystem(sysIndex, 'dateMode', 'MANUAL')}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${system.dateMode === 'MANUAL'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                              Manual
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSystem(sysIndex, 'dateMode', 'AUTOMATIC')}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${system.dateMode === 'AUTOMATIC'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                              Auto-Calculate
                            </button>
                          </div>
                        </div>

                        {/* Visit Dates */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            {system.dateMode === 'AUTOMATIC'
                              ? tcl.visitDatesAuto
                              : tcl.visitDatesManual}
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {system.visitDates.map((date, dateIndex) => (
                              <div key={dateIndex} className="space-y-1">
                                <Label className="text-xs">{getOrdinal(dateIndex + 1)} {tcl.visit}</Label>
                                <Input
                                  type="date"
                                  value={date}
                                  onChange={(e) => updateVisitDate(sysIndex, dateIndex, e.target.value)}
                                  disabled={system.dateMode === 'AUTOMATIC' && dateIndex > 0}
                                  className={system.dateMode === 'AUTOMATIC' && dateIndex > 0 ? 'bg-muted' : ''}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment Due Dates */}
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">{tcl.paymentDueDates}</Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateSystem(sysIndex, 'paymentDateMode', 'MANUAL')}
                                className={`text-xs px-2 py-1 rounded ${system.paymentDateMode === 'MANUAL'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                              >
                                Manual
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSystem(sysIndex, 'paymentDateMode', 'AUTOMATIC')}
                                className={`text-xs px-2 py-1 rounded ${system.paymentDateMode === 'AUTOMATIC'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                              >
                                Auto (+10 days)
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {system.paymentDueDates.map((date, dateIndex) => (
                              <div key={dateIndex} className="grid grid-cols-3 gap-2 items-end">
                                <div className="space-y-1">
                                  <Label className="text-xs">{getOrdinal(dateIndex + 1)} {tcl.paymentDue}</Label>
                                  <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => updatePaymentDueDate(sysIndex, dateIndex, e.target.value)}
                                    disabled={system.paymentDateMode === 'AUTOMATIC'}
                                    className={system.paymentDateMode === 'AUTOMATIC' ? 'bg-muted' : ''}
                                  />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <Label className="text-xs">{tcl.amountSar}</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={system.paymentAmounts[dateIndex] || ''}
                                    onChange={(e) => updatePaymentAmount(sysIndex, dateIndex, e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Contract Section */}
              <div className="space-y-2">
                <Label>{tcl.uploadContractOptional}</Label>
                <FileUploadDropzone
                  onFilesSelected={handleContractFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  multiple={false}
                  uploading={uploadingContract}
                  uploadedFiles={contractFile ? [contractFile] : []}
                  onRemoveFile={() => {
                    setContractFile(null)
                    setNewContract({ ...newContract, fileName: '', fileUrl: '' })
                  }}
                  label={tcl.uploadContractLabel}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating || !newContract.title}
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateContract(e, true)
                }}
              >
                {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                Create Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) setEditContract(null)
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tcl.editContract}</DialogTitle>
            <DialogDescription>
              {tcl.editContractDesc}
            </DialogDescription>
          </DialogHeader>
          {editContract && (
            <form onSubmit={handleEditContract}>
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="space-y-6">
                {/* Contract Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">{tcl.contractTitle}</Label>
                  <Input
                    id="edit-title"
                    value={editContract.title}
                    onChange={(e) => setEditContract({ ...editContract, title: e.target.value })}
                    placeholder={tcl.titlePlaceholder}
                    required
                  />
                </div>

                {/* Dates and Auto-Renew */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">{tcl.startDate}</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editContract.startDate}
                      onChange={(e) => setEditContract({ ...editContract, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">{tcl.endDate}</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editContract.endDate}
                      onChange={(e) => setEditContract({ ...editContract, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tcl.autoRenew}</Label>
                    <div className="flex items-center h-10">
                      <Switch
                        checked={editContract.autoRenew}
                        onCheckedChange={(checked) => setEditContract({ ...editContract, autoRenew: checked })}
                      />
                      <span className="ms-2 text-sm text-muted-foreground">
                        {editContract.autoRenew ? tcl.yes : tcl.no}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scope of Work Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide">{tcl.scopeOfWorkTitle}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addEditSystem}>
                      <Plus className="h-4 w-4 me-1" />
                      Add System
                    </Button>
                  </div>

                  {editContract.systems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground text-sm">{tcl.noSystemsAdded}</p>
                      <Button type="button" variant="link" size="sm" onClick={addEditSystem}>
                        Add your first system
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {editContract.systems.map((system, sysIndex) => (
                        <div key={sysIndex} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{tcl.systemNumber.replace('{index}', String(sysIndex + 1))}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEditSystem(sysIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* System Name */}
                          <div className="space-y-2">
                            <Input
                              value={system.name}
                              onChange={(e) => updateEditSystem(sysIndex, 'name', e.target.value)}
                              placeholder={tcl.systemPlaceholder}
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">{tcl.descriptionOptional}</Label>
                            <Textarea
                              value={system.description}
                              onChange={(e) => updateEditSystem(sysIndex, 'description', e.target.value)}
                              placeholder={tcl.descriptionPlaceholder}
                              rows={2}
                            />
                          </div>

                          {/* Frequency */}
                          <div className="space-y-2">
                            <Label>{tcl.frequency}</Label>
                            <Select
                              value={system.frequency}
                              onValueChange={(value) => updateEditSystem(sysIndex, 'frequency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={tcl.selectFrequency} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MONTHLY">{tcl.monthlyVisits}</SelectItem>
                                <SelectItem value="QUARTERLY">{tcl.quarterlyVisits}</SelectItem>
                                <SelectItem value="SEMI_ANNUALLY">{tcl.semiAnnuallyVisits}</SelectItem>
                                <SelectItem value="ANNUALLY">{tcl.annuallyVisits}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Date Mode Toggle */}
                          <div className="flex items-center gap-3 py-2">
                            <Label className="text-xs text-muted-foreground">{tcl.dateEntry}</Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateEditSystem(sysIndex, 'dateMode', 'MANUAL')}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${system.dateMode === 'MANUAL'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                              >
                                Manual
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEditSystem(sysIndex, 'dateMode', 'AUTOMATIC')}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${system.dateMode === 'AUTOMATIC'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                              >
                                Auto-Calculate
                              </button>
                            </div>
                          </div>

                          {/* Visit Dates */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {system.dateMode === 'AUTOMATIC'
                                ? tcl.visitDatesAuto
                                : tcl.visitDatesManual}
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {system.visitDates.map((date, dateIndex) => (
                                <div key={dateIndex} className="space-y-1">
                                  <Label className="text-xs">{getOrdinal(dateIndex + 1)} {tcl.visit}</Label>
                                  <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => updateEditVisitDate(sysIndex, dateIndex, e.target.value)}
                                    disabled={system.dateMode === 'AUTOMATIC' && dateIndex > 0}
                                    className={system.dateMode === 'AUTOMATIC' && dateIndex > 0 ? 'bg-muted' : ''}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment Due Dates */}
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">{tcl.paymentDueDates}</Label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateEditSystem(sysIndex, 'paymentDateMode', 'MANUAL')}
                                  className={`text-xs px-2 py-1 rounded ${system.paymentDateMode === 'MANUAL'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                  Manual
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateEditSystem(sysIndex, 'paymentDateMode', 'AUTOMATIC')}
                                  className={`text-xs px-2 py-1 rounded ${system.paymentDateMode === 'AUTOMATIC'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                  Auto (+10 days)
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {system.paymentDueDates.map((date, dateIndex) => (
                                <div key={dateIndex} className="grid grid-cols-3 gap-2 items-end">
                                  <div className="space-y-1">
                                    <Label className="text-xs">{getOrdinal(dateIndex + 1)} {tcl.paymentDue}</Label>
                                    <Input
                                      type="date"
                                      value={date}
                                      onChange={(e) => updateEditPaymentDueDate(sysIndex, dateIndex, e.target.value)}
                                      disabled={system.paymentDateMode === 'AUTOMATIC'}
                                      className={system.paymentDateMode === 'AUTOMATIC' ? 'bg-muted' : ''}
                                    />
                                  </div>
                                  <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">{tcl.amountSar}</Label>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={system.paymentAmounts[dateIndex] || ''}
                                      onChange={(e) => updateEditPaymentAmount(sysIndex, dateIndex, e.target.value)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Contract Section */}
                <div className="space-y-2">
                  <Label>{tcl.contractDocumentOptional}</Label>
                  <FileUploadDropzone
                    onFilesSelected={handleEditContractFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                    multiple={false}
                    uploading={uploadingEditContract}
                    uploadedFiles={editContractFile ? [editContractFile] : []}
                    onRemoveFile={() => {
                      setEditContractFile(null)
                      setEditContract({ ...editContract, fileName: '', fileUrl: '' })
                    }}
                    label={tcl.uploadContractLabel}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  setEditDialogOpen(false)
                  setEditContract(null)
                }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editing || !editContract.title}
                >
                  {editing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {selectedContract?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedContract?.description || tcl.contractDetails}
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{tcl.status}</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{tcl.totalValue}</p>
                  <p className="font-bold text-lg text-primary">
                    ر.س {(selectedContract.totalValue || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {selectedContract.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tcl.startDate}</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedContract.startDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                )}
                {selectedContract.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{tcl.endDate}</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedContract.endDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                )}
              </div>

              {/* Signatures Status */}
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <PenTool className="h-4 w-4" />
                  Signatures
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedContract.startSignedAt ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{tcl.startSigned} {new Date(selectedContract.startSignedAt).toLocaleDateString('ar-SA')}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-muted-foreground">{tcl.startAwaiting}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedContract.endSignedAt ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{tcl.endSigned} {new Date(selectedContract.endSignedAt).toLocaleDateString('ar-SA')}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{tcl.endPending}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Scope of Work (Systems) Section */}
              {selectedContract.systems && selectedContract.systems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Scope of Work
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailDialogOpen(false)
                        openEditDialog(selectedContract)
                      }}
                    >
                      <Edit className="h-3 w-3 me-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedContract.systems.map((system, index) => {
                      const paymentDueDates = (system.paymentDueDates as string[]) || []
                      const paymentAmounts = (system.paymentAmounts as unknown as (number | null)[]) || []
                      return (
                        <div key={system.id || index} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{system.name}</p>
                            <Badge variant="outline">{getFrequencyLabel(system.frequency)}</Badge>
                          </div>
                          {system.description && (
                            <p className="text-sm text-muted-foreground mb-2">{system.description}</p>
                          )}
                          {system.visitDates && system.visitDates.length > 0 && (
                            <div className="space-y-2 mt-3">
                              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                                <span>{tcl.visitDate}</span>
                                <span>{tcl.paymentDueCol}</span>
                                <span>{tcl.amountCol}</span>
                              </div>
                              {system.visitDates.map((date: string, i: number) => (
                                <div key={i} className="grid grid-cols-3 gap-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {date ? new Date(date).toLocaleDateString('ar-SA') : '—'}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {paymentDueDates[i] ? new Date(paymentDueDates[i]).toLocaleDateString('ar-SA') : '—'}
                                  </div>
                                  <div className="font-medium">
                                    {paymentAmounts[i] ? `ر.س ${paymentAmounts[i]?.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}` : '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Payment Terms Section */}
              {selectedContract.payments && selectedContract.payments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Payment Terms
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tcl.payment}</TableHead>
                        <TableHead>{tcl.dueDate}</TableHead>
                        <TableHead>{tcl.amountCol}</TableHead>
                        <TableHead>{tcl.status}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContract.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{tcl.payment} #{payment.paymentNo}</TableCell>
                          <TableCell>
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('ar-SA') : '—'}
                          </TableCell>
                          <TableCell>
                            {payment.amount ? `ر.س ${payment.amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}` : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'PAID' ? 'default' : payment.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Work Orders Section */}
              {selectedContract.checklist && selectedContract.checklist.items.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Work Orders
                  </h3>
                  <ContractWorkOrdersDisplay
                    workOrders={selectedContract.checklist.items}
                    showStatus={true}
                  />
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Documents & Attachments
                </h3>
                <ContractAttachmentsSection
                  contractId={selectedContract.id}
                  branchId={branchId}
                  fileUrl={selectedContract.fileUrl}
                  fileName={selectedContract.fileName}
                  isContractor={true}
                  onUpdate={() => {
                    fetchContracts()
                    router.refresh()
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attach PDF Dialog */}
      <Dialog open={attachPdfDialogOpen} onOpenChange={setAttachPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tcl.attachContractPdf}</DialogTitle>
            <DialogDescription>
              {tcl.attachContractPdfDesc}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdfFileName">{tcl.fileName}</Label>
              <Input
                id="pdfFileName"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder="e.g., Service Agreement 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">{tcl.pdfUrl}</Label>
              <Input
                id="pdfUrl"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                {tcl.pdfUrlHelp}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachPdfDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttachPdf} disabled={attaching || !pdfUrl}>
              {attaching ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="me-2 h-4 w-4" />
              )}
              Attach PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Certificate Dialog */}
      <Dialog open={attachCertDialogOpen} onOpenChange={setAttachCertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tcl.attachCertificate}</DialogTitle>
            <DialogDescription>
              {tcl.attachCertificateDesc}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certFileName">{tcl.fileName}</Label>
              <Input
                id="certFileName"
                value={certFileName}
                onChange={(e) => setCertFileName(e.target.value)}
                placeholder="e.g., Service Certificate 2026.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certUrl">{tcl.certificateUrl}</Label>
              <Input
                id="certUrl"
                value={certUrl}
                onChange={(e) => setCertUrl(e.target.value)}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                {tcl.certificateUrlHelp}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachCertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttachCert} disabled={attaching || !certUrl}>
              {attaching ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="me-2 h-4 w-4" />
              )}
              Attach Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
