'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { RequestQuotePrint } from '@/components/print/request-quote-print'

export default function RequestQuotePrintPage() {
  const params = useParams<{ branchId: string; requestId: string }>()
  const branchId = params.branchId
  const requestId = params.requestId

  useEffect(() => {
    const handleAfterPrint = () => {
      window.close()
    }

    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  if (!branchId || !requestId) return null

  return <RequestQuotePrint branchId={branchId} requestId={requestId} />
}
