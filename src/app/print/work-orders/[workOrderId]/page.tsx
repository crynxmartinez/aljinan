'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WorkOrderPrint } from '@/components/print/work-order-print'

export default function WorkOrderPrintPage() {
  const params = useParams<{ workOrderId: string }>()
  const workOrderId = params.workOrderId

  useEffect(() => {
    const handleAfterPrint = () => {
      window.close()
    }

    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  if (!workOrderId) return null

  return <WorkOrderPrint workOrderId={workOrderId} />
}
