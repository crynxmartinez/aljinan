'use client'

import { AlertCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface ImpersonationBannerProps {
  targetUserName?: string | null
  targetUserEmail?: string | null
  realAdminEmail?: string | null
}

export function ImpersonationBanner({ targetUserName, targetUserEmail, realAdminEmail }: ImpersonationBannerProps) {
  const [exiting, setExiting] = useState(false)

  const handleExitImpersonation = async () => {
    setExiting(true)
    try {
      // Clear impersonation cookie
      await fetch('/api/admin/impersonate', { method: 'DELETE' })

      // Sign out and redirect to admin page
      await signOut({ redirect: false })
      window.location.href = '/admin'
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
          <span className="font-semibold">Impersonation Mode:</span>
          <span className="text-sm">
            Viewing as <span className="font-medium">{targetUserName || targetUserEmail}</span>
            {' '} • Admin: {realAdminEmail}
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
        <LogOut className="h-4 w-4 mr-2" />
        {exiting ? 'Exiting...' : 'Exit Impersonation'}
      </Button>
    </div>
  )
}
