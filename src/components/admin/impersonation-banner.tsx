'use client'

import { AlertCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/use-translation'

interface ImpersonationBannerProps {
  targetUserName?: string | null
  targetUserEmail?: string | null
  realAdminEmail?: string | null
}

export function ImpersonationBanner({ targetUserName, targetUserEmail, realAdminEmail }: ImpersonationBannerProps) {
  const { t } = useTranslation()
  const ta = t.dashboard.adminImpersonationBanner
  const [exiting, setExiting] = useState(false)

  const handleExitImpersonation = async () => {
    setExiting(true)
    try {
      // Ends impersonation server-side: clears the marker cookie and revokes the session
      // we are currently holding as the target user.
      const response = await fetch('/api/admin/impersonate', { method: 'DELETE' })
      const data = await response.json().catch(() => null)

      await signOut({ redirect: false })

      // The admin must sign in as themselves again — their own session was replaced when
      // they started impersonating.
      window.location.href = data?.redirectUrl || '/login'
    } catch (error) {
      console.error('Failed to exit impersonation:', error)
      setExiting(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold">{ta.impersonationMode}</span>
          <span className="text-sm">
            {ta.viewingAs} <span className="font-medium">{targetUserName || targetUserEmail}</span>
            {' '} • {ta.admin} {realAdminEmail}
          </span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExitImpersonation}
        disabled={exiting}
        className="flex-shrink-0"
      >
        <LogOut className="h-4 w-4 me-2" />
        {exiting ? ta.exiting : ta.exitImpersonation}
      </Button>
    </div>
  )
}
