'use client'

import { toast, type ExternalToast } from 'sonner'
import { browserLocale, errorMessage } from './errors'
import { localizeError } from './error-text'

/** Legacy fetch consumers must not bypass localization through toast descriptions. */
export function showErrorToast(message: unknown, options?: ExternalToast) {
  const locale = browserLocale()
  const description = options?.description
  return toast.error(localizeError(typeof message === 'string' && message ? message : errorMessage(500, locale), locale), {
    ...options,
    ...(typeof description === 'string' ? { description: localizeError(description, locale) } : {}),
  })
}
