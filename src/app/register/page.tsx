import { redirect } from 'next/navigation'

/**
 * Self-service registration is not implemented.
 *
 * This page previously rendered a full signup form that POSTed to /api/auth/register — a
 * route that does not exist. Every marketing CTA pointed here, so each attempted signup
 * 404ed, and because the handler called response.json() on an HTML error body, the visitor
 * saw a raw JSON parse error rather than anything actionable.
 *
 * Onboarding today is admin-driven: a platform admin creates the contractor, who receives a
 * verification email and sets their own password. The marketing CTAs now point at /contact,
 * and this route redirects there so existing links and bookmarks still land somewhere real.
 *
 * To restore self-service signup: implement POST /api/auth/register with email
 * verification, rate limiting and the server-side password policy from lib/password-
 * validation, then replace this file with the form again.
 */
export default function RegisterPage() {
  redirect('/contact')
}
