'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'

/**
 * Shared body for the per-route-group error boundaries.
 *
 * There were no boundaries anywhere in the app tree, so any uncaught render error showed
 * the framework default. A boundary needs to tell the user three things: that their data is
 * intact, how to retry, and how to get back somewhere useful.
 */
export function RouteError({
  error,
  reset,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string }
  reset: () => void
  homeHref: string
  homeLabel: string
}) {
  const { t } = useTranslation()
  const ta = t.dashboard.routeError
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>

        <h1 className="mb-2 text-xl font-bold">{ta.pageCouldNotBeLoaded}</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          {ta.nothingChanged}
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">
            {ta.reference} {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>{ta.tryAgain}</Button>
          <Button variant="outline" asChild>
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
