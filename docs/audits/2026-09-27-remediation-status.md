# Remediation release status — 27 September 2026

The user authorized fixing and pushing on 27 September. Target: `production`; `main` must remain unchanged. This is a verified repair batch, **not completion of every acceptance item in the 50-task plan**.

## Implemented

- Contractor analytics now scopes all queries to the owner; staff queries and search use current database branch assignments. Permission-sensitive search caches are bypassed. Monthly bounds are exclusive; client revenue no longer stops at 500 work orders.
- Client draft visibility is restricted in invoice/contract/quotation details, search, documents, related certificates and contract-payment lists. Contract signing cannot select a draft.
- Upload callers provide branch/type data. File access resolves saved attachments and current branch authorization, including older uploads missing a branch association. Deletion is restricted to the uploader with current branch access.
- **Additional security finding:** certificate update/delete and appointment deletion accepted an authorized branch with another branch's record ID. Writes now bind both IDs. Certificate creation also verifies related contract/work-order branch ownership. Regression tests include a real-database hostile request in the access suite.
- English/Arabic wording is wired across secondary UI, forms and accessibility controls. Shared enum labels cover the current display enums. Error displays resolve approved wording at render time, including a language switch; unknown backend details get a safe localized recovery instruction. This is a compatibility layer, not completion of a typed error-code API migration.
- Work-order filters derive labels from selected IDs; analytics refreshes by locale and cancels stale requests. Money/date/print/export paths use selected locale, preserving zero values. Request PDF export now produces a PDF with a bundled, licensed Arabic font. CSV protects formula-leading customer strings.
- Notification inbox uses the full unread count; mounted controls refresh; historical broken links are repaired. Exact known historical templates render in either locale without translating captured customer text. Popup priority no longer uses alphabetic ordering; unsuccessful mark-read does not pretend to succeed.
- Account verification lets the recipient set a password directly and consumes the token with the credential update. It no longer depends on delivering a generated password after consuming the token. Email delivery checks provider-returned errors as well as thrown failures; verification/reset links carry locale.
- Contractor appointments have visible create/detail controls. The activity panel has an authorized comments endpoint and pagination. Removed stale calls/dialogs for nonexistent project APIs, an unused remember-me promise, and fabricated subscription details/buttons.
- Mobile navigation uses a modal drawer, closes with Escape and restores trigger focus. Theme-aware cards and locale/theme-aware toasts replace known forced-white/fixed-position cases.
- Five unused PDF/print components were removed after a source/scripts/tests import search found no callers. Active routes use `components/print` and `lib/export/export-utils.ts`.
- Next.js upgraded to 16.3.6 and compatible dependency fixes applied. Production is included in CI branch filters. No warning-ceiling increase.

## Local evidence

- Production build passed (Next.js 16.3.6).
- 84 unit/component tests passed across 16 files, including drawer tests in both languages and scoped comment tests. Final CI reruns the complete suite.
- Type checking passed as part of the build. A test-fixture certificate enum typo found during a separate check was corrected to `INSPECTION` before the successful build.
- Lint: 197 warnings, zero errors, below the unchanged ceiling of 205. These warnings are still debt, not a clean-lint claim.
- Certificate write regression was observed failing before the fix. Localization detector tests include positive violations and user-data negative controls.
- Actual XLSX bytes were parsed back and checked for Arabic headers, customer content and numeric zero; CSV formula escaping was checked. PDF layout is not visually certified.
- Drawer component tests verify closed links are absent, Escape closes, and focus returns to the trigger. They do not replace real mobile screenshots or drag testing.
- `git diff --check` passed.

## Verification limits

Windows Device Guard blocked the embedded PostgreSQL executable. Local database integration tests therefore could not run. Automatic approval review separately rejected starting the local app with supplied test settings (reason: “blocked by policy”). No attempt was made to bypass either restriction. GitHub's isolated Postgres suite is the database release gate. Both CI jobs passed for the initial batch in run https://github.com/crynxmartinez/aljinan/actions/runs/36289729208; the final follow-up is rechecked before updating production.

The preview browser reached Vercel deployment protection, requiring a Vercel login; no authentication bypass was attempted. Real-browser screenshots, authenticated multi-role walkthroughs, live storage/email delivery and visual Arabic PDF inspection remain unverified. No production customer data was changed for testing. No database schema migration is included in this batch.

## Explicit remaining work

1. Complete T01/T02/T49: review every original candidate and route/state/role combination. `localization-backlog.json` is a **no-new-candidates baseline**, not a whitelist declaring existing entries correct. Removed candidates may remain in the baseline until review; guard output reports the current count. Brand names, IDs, sample emails, dormant code and real defects must remain distinct.
2. T36/T37: typed notification events, atomic persistence/outbox, idempotency/retries across all nine writers. Current exact-template rendering repairs language; it does not guarantee delivery for every business mutation. Unknown historical text is preserved, not guessed.
3. T40: persisted recipient-language preference and invitation locale; links now carry locale, but some callers still choose it from the actor.
4. T41: provenance for generated saved record titles/descriptions and a historical dry-run report. User-entered/signed content must not be mass-translated.
5. T17: stable API error codes/parameters and more specific validation recovery. Safe generic fallback may replace unknown detailed legacy errors.
6. T45/T47/T48/T49: full real-browser RTL/LTR, dark/light, mobile, Kanban drag, uploads, map/provider and installed-app review. T43 also requires visual PDF review.
7. Dependencies: latest audit after compatible fixes reports six high findings (Prisma/transitive tooling, Electron and legacy SheetJS). Do not force-downgrade Prisma to resolve an npm suggestion. SheetJS is used for writing exports, not parsing uploaded workbooks; that limits but does not erase the dependency finding. Desktop Electron requires a separate major-version compatibility check.

Remote commit/check URLs and production synchronization are recorded in the task's final response. Passing CI must not be described as completion of these remaining items.

## Closure work in progress (supersedes remaining-work items 2–4 and 7 above)

The closure branch now includes atomic domain/notification persistence, fail-closed and retry-safe expiry jobs, durable notification template IDs/parameters, recipient locale preferences and invitation-language selection, provenance for generated defaults, and reviewed localization exceptions. Search now includes quotations with the same draft/branch restrictions; client search statuses translate too. Dependency audit reports zero known vulnerabilities after compatible fixes; desktop startup remains a separate smoke-test limitation.

CI run 36293643839 passed both jobs for commit 4fbb9c8, including authenticated owner/client/admin/technician/supervisor browser checks in EN/AR and light/dark, desktop/mobile. Downloaded screenshots were inspected: the Arabic owner sidebar/tabs were right-to-left; the inspection exposed one raw role label now corrected. Expanded public/print checks and the subsequent schema changes require a fresh CI run and are not covered by that earlier result.

The additive migration introduces recipient locale and JSON metadata. Exact historical generator matches receive provenance metadata only; customer text is unchanged. Production builds apply tracked migrations before compiling; previews only check migration status and cannot mutate a shared production database. An unmigrated preview is intentionally blocked. No production database migration has been run from this workstation.

Remaining verification is explicit: current-head integration/migration/browser results, screenshot/PDF review, historical-data migration fixtures, external map/mail/storage behavior, and reconciliation of the original candidate/route inventory. Existing lint warnings remain tracked debt under the unchanged 205 ceiling.
