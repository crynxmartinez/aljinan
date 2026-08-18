import { toast } from 'sonner'

/**
 * The single way to call our API from the browser.
 *
 * Ad-hoc fetch calls outnumbered `response.ok` checks across twelve components — worst in
 * checklist-kanban at 16 calls to 13 checks. An unchecked call makes a 403 or a 500
 * indistinguishable from success: the optimistic UI update stays on screen and the user
 * believes their work saved. Four modules had no error surface at all.
 *
 * This throws on any non-2xx, carries the server's message, and shows it. Callers that need
 * to react further can catch; callers that just need the happy path can await and trust it.
 */

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/** Messages worth saying plainly, rather than passing through whatever the server said. */
function messageForStatus(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage

  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'That item could no longer be found.'
    case 409:
      return 'That conflicts with the current state. Refresh and try again.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    default:
      return status >= 500
        ? 'Something went wrong on our side. Nothing was changed.'
        : 'That request could not be completed.'
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** Set false to handle the error yourself without a toast. Defaults to true. */
  showToast?: boolean
}

async function request<T>(method: string, url: string, options: RequestOptions = {}): Promise<T> {
  const { body, showToast = true, headers, ...rest } = options

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  let response: Response
  try {
    response = await fetch(url, {
      method,
      ...rest,
      headers: isFormData
        ? headers
        : { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    // Network-level failure: no response at all.
    const message = 'Could not reach the server. Check your connection and try again.'
    if (showToast) toast.error(message)
    throw new ApiError(message, 0)
  }

  if (!response.ok) {
    // The server may answer with JSON, or with an HTML error page — which is what made an
    // earlier bug show visitors a raw JSON parse error instead of anything useful.
    let serverMessage: string | undefined
    let details: unknown
    try {
      const payload = await response.json()
      serverMessage = typeof payload?.error === 'string' ? payload.error : undefined
      details = payload?.details
    } catch {
      // not JSON; fall back to the status
    }

    const message = messageForStatus(response.status, serverMessage)
    if (showToast) toast.error(message)
    throw new ApiError(message, response.status, details)
  }

  if (response.status === 204) return undefined as T

  try {
    return (await response.json()) as T
  } catch {
    return undefined as T
  }
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, { ...options, body }),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', url, { ...options, body }),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, { ...options, body }),
  delete: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('DELETE', url, { ...options, body }),
}

/**
 * Apply an optimistic change, run the write, and put the state back if it fails.
 *
 * The pattern the notification centre now uses. Without the rollback an optimistic update
 * silently disagrees with the server for as long as the page stays open.
 */
export async function withOptimisticUpdate<S>(
  current: S,
  apply: (state: S) => void,
  write: () => Promise<unknown>
): Promise<boolean> {
  apply(current)
  try {
    await write()
    return true
  } catch {
    apply(current)
    return false
  }
}
