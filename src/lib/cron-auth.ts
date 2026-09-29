/**
 * Cron routes must fail closed: a missing deployment secret is a configuration error, not
 * permission for an unauthenticated caller to run a destructive background job.
 */
export function isAuthorizedCronRequest(
  request: Request,
  cronSecret: string | undefined = process.env.CRON_SECRET
): boolean {
  return Boolean(cronSecret) && request.headers.get('authorization') === `Bearer ${cronSecret}`
}
