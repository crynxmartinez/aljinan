'use client'

import { RouteError } from '@/components/layout/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} homeHref="/dashboard" homeLabel="Back to dashboard" />
}
