'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'

export function ImpersonationBanner() {
  const { t } = useTranslation()
  const ta = t.dashboard.layoutImpersonationBanner
  const router = useRouter()
  const [impersonation, setImpersonation] = useState<{
    adminEmail: string
    targetEmail: string
    targetRole: string
  } | null>(null)

  useEffect(() => {
    // Check for impersonation cookie
    const checkImpersonation = async () => {
      try {
        const response = await fetch('/api/admin/impersonate/status')
        if (response.ok) {
          const data = await response.json()
          if (data.impersonating) {
            setImpersonation(data)
          }
        }
      } catch {
        // Not impersonating or error
      }
    }
    checkImpersonation()
  }, [])

  const handleExitImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', { method: 'DELETE' })
      if (response.ok) {
        window.location.href = '/admin'
      }
    } catch (err) {
      console.error('Failed to exit impersonation:', err)
    }
  }

  if (!impersonation) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span>
          <strong>{ta.adminView}</strong> — {ta.viewingAs}{' '}
          <strong>{impersonation.targetEmail}</strong> ({impersonation.targetRole})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:text-white hover:bg-amber-600 h-7"
        onClick={handleExitImpersonation}
      >
        <LogOut className="h-3.5 w-3.5 me-1" />
        {ta.exitToAdmin}
      </Button>
    </div>
  )
}
