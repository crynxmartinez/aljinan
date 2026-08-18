'use client'

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
  message = 'This could not be loaded.',
}: {
  onRetry?: () => void
  message?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This is not the same as there being nothing here — we could not reach the server.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
