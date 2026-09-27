'use client'
import { useTranslation } from '@/lib/i18n/use-translation'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Shown when a panel could not load its data.
 *
 * Several modules caught a failed read, logged it to the console, and then rendered their
 * normal empty state — so "we could not reach the server" and "there is nothing here" looked
 * identical. On a compliance platform that matters: an empty certificates list reads as
 * "this branch has no certificates", which is a different and much worse claim than "we could
 * not load them".
 */
export function LoadFailure({
  onRetry,
  message,
}: {
  onRetry?: () => void
  message?: string
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{message ?? t.system.loadFailed}</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {t.system.loadFailedDetail}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            <RefreshCw className="me-2 h-4 w-4" />
            {t.system.retry}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
