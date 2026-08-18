# Security Fixes — Phase Plan

Audit date: 2026-06-30
Audited by: Cascade

---

## 🔴 Critical (Fix First)

- [ ] **1. Add `middleware.ts`** — No route-level auth protection exists. Any handler that forgets `getServerSession()` is fully exposed.
  - File to create: `src/middleware.ts`
  - Protect: `/dashboard/*`, `/portal/*`, `/admin/*`, `/api/*` (except public endpoints)

- [ ] **2. Fix impersonation signin** — `src/app/api/admin/impersonate/signin/route.ts` trusts client-supplied `impersonationData` body. Rebuild the user object from the DB using only the `targetUserId` from the httpOnly cookie.

- [ ] **3. Fix rate limiting (Upstash Redis)** — `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set. All rate limiters fall back to in-memory store which is useless on Vercel serverless (each request = new instance). Add Upstash Redis env vars to Vercel.

- [ ] **4. Fix cron auth bypass** — `src/app/api/cron/work-order-notifications/route.ts` skips auth check when `NODE_ENV !== 'production'`. Should always require `CRON_SECRET` like `auto-archive` does.

- [ ] **5. Require current password on change-password** — `src/app/api/auth/change-password/route.ts` only takes `newPassword`. Anyone with a stolen session can silently hijack the account. Add `currentPassword` field and verify with bcrypt.

- [ ] **6. Rate limit + sanitize contact form** — `src/app/api/contact/route.ts` is a public endpoint with no rate limiting (DB flood risk) and no input sanitization. Add IP-based rate limit and sanitize all fields.

- [ ] **7. Fix S3 delete ownership check** — `src/app/api/upload/route.ts` DELETE handler only checks if user is logged in. Any authenticated user can delete any file. Verify file ownership before deletion.

---

## 🟡 Medium (Fix Second)

- [ ] **8. Fix verbose auth error messages** — `src/lib/auth.ts` throws `"User not found"` vs `"Invalid password"`, leaking whether an email is registered. Use a single generic message for both cases.

- [ ] **9. Persist audit logs to database** — `src/lib/audit-log.ts` only does `console.log`. Vercel logs are ephemeral. Uncomment and implement `prisma.auditLog.create()` or forward to an external service.

- [ ] **10. Add Content-Security-Policy header** — `next.config.ts` has HSTS, X-Frame-Options, etc. but no CSP. This is the primary browser-level XSS defense.

- [ ] **11. Replace regex HTML sanitizer** — `src/lib/sanitize.ts` `sanitizeHtml()` is bypassable via nested/encoded tags. Replace with `sanitize-html` or `dompurify` library.

- [ ] **12. Fix `sanitizePlainText` entity decoding** — `src/lib/sanitize.ts:50-56` decodes HTML entities (`&lt;` → `<`) before storing. XSS payloads can survive if the decoded output is ever rendered as HTML.

- [ ] **13. Review S3 public-read ACL** — `src/lib/s3.ts` uploads all files with `ACL: 'public-read'`. Inspection photos, certificates, and signatures are sensitive client data. Consider private ACL + signed URLs.

---

## ✅ Already Good (No Action Needed)

- bcrypt cost 12 for passwords
- Forgot-password is email-enumeration-safe
- Constant-time CSRF token comparison
- HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options)
- File type + extension whitelist
- Double-extension attack check
- Prisma ORM (no raw SQL injection risk)
- JWT session with 24h expiry
- Admin cannot impersonate other admins
