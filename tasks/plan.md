# System reliability and complete English/Arabic remediation plan

Date: 27 September 2026. Status: implementation in progress. The user explicitly authorized fixing and pushing on 27 September; target production. See ../docs/audits/2026-09-27-remediation-status.md for completed repairs, evidence and remaining work.

## Outcome

Every supported, platform-owned surface must follow the selected language and direction, including navigation, dialogs, validation, errors, statuses, notifications, search, print and exports. Language changes must work without losing form input or retaining old-language labels. Security, broken workflows and misleading controls found during the audit must also be repaired before release.

Evidence:

- [Initial audit: S1–S5, L1–L9, F1–F14](../docs/audits/2026-09-27-system-localization-audit.md)
- [Deeper follow-up: D01–D16](../docs/audits/2026-09-27-deep-audit-follow-up.md)
- [AST review inventory](../docs/audits/2026-09-27-localization-candidates.json)
- [Implementation checklist with dependencies and acceptance checks](todo.md)

## Decisions that prevent a sixth incomplete sweep

### Keep the existing localization system; close its bypasses

Retain `translations.ts`, `useTranslation`, the locale cookie and server helpers. A new translation library would not automatically fix literals, saved text, copied state or wrong API contracts. Introduce narrow typed helpers around existing infrastructure: enum labels, message descriptors, formatting and API error codes. Use plural-aware messages where counts change grammar. Enforce key and interpolation parity while allowing intentional Arabic grammar differences.

### Classify the source of every displayed string

The coverage ledger must distinguish dictionary content, UI literals, server-generated defaults, raw enums, server errors, persisted system text, user content and third-party text. Each candidate gets a disposition: confirmed defect, accepted exception with reason, dormant code, or unverified. Record source location, route/state, owner task, and verification evidence. Import reachability is a lead, not proof of rendering.

Do not silently translate customer names, notes, filenames or signed/issued artifacts. Use bidi isolation for mixed-direction content and preserve IDs, email addresses and phone numbers appropriately. Brand names, file formats and the language switcher's language names are legitimate exceptions.

### Derive language-dependent text at render time

Keep stable status IDs, selected filter values and error codes in state. Derive their visible labels from the current locale. API responses should prefer semantic data over pretranslated labels. If a server payload must include translated text, include locale in the request/cache key and refetch on locale change. Authorization scope must also participate in caching independently of language.

### Make messages and generated content explicit

Use stable message/template identifiers with typed parameters. API errors retain appropriate HTTP status and return a public code/parameters; clients localize them with a safe unknown-error fallback. Do not display arbitrary internal server error text.

Notifications need a versioned event/template identity, parameters, recipient, destination and deduplication key. A notification type alone may not identify its exact sentence. New system-generated record defaults need provenance. Legacy conversion must have a dry run, exact evidence-based matches, preserved originals and an unresolved-record report. Never apply broad regex or machine translation to customer data.

### Standardize formatting intentionally

Require locale for shared date, timestamp, currency and number formatters. Preserve the established Western-digit preference in Arabic. Specify Gregorian calendar explicitly where the business expects it. Recommend Asia/Riyadh for business timestamps, with date-only values handled independently; validate this against actual scheduling requirements before altering stored data. Use exclusive next-day/month boundaries. Zero is a valid price, not a missing value.

### Repair access and workflow contracts before cosmetic completion

Tenant isolation, staff assignments and draft publication rules must be enforced server-side across all read paths. Upload association repair must not expose draft/private documents. Save successful domain changes and their required notification events atomically; delivery retries must be observable and deduplicated. Prefer recoverable account setup links to fragile generated-password email delivery.

## Execution phases

### Phase 0 — Establish reproducible coverage and stop new gaps

Record the current dirty tree and preserve existing work. Turn the AST inventory into a reviewed ledger and map all 44 page routes, nested tabs/dialogs/actions, 79 API routes and output generators. Add isolated fixtures and a failing regression for each high-priority issue before its fix. Add a static guard with narrow, reviewed exceptions; explicitly test that it catches representative injected violations in fixtures.

**Exit:** all source candidates classified or explicitly pending; the ledger shows what has and has not been exercised. New unreviewed wording cannot enter changed code unnoticed. Known findings remain open until their behavior is verified.

### Phase 1 — Secure data and restore failing core operations

Repair contractor analytics scope, assigned-branch search, and lifecycle visibility for invoices/contracts/quotations/documents/files. Correct payment upload fields and branch attachment association. Repair email rejection handling and recoverable verification. Patch affected dependencies compatibly, with a fresh advisory check and build; do not force a Prisma downgrade. Include `production` in CI coverage early.

**Exit:** two-tenant and restricted-staff tests prove no cross-scope results; clients cannot read drafts through secondary paths; both parties can access intended published attachments; rejected email delivery cannot report completed delivery.

### Phase 2 — Close shared localization bypasses

Add typed enum/message/error/formatting helpers. Correct malformed-success JSON handling. Fix work-order filters and analytics switching behavior, then migrate shared accessibility labels and error boundaries. Correct mixed-language dictionary values. Keep forms and selected filters intact while changing language.

**Exit:** shared components pass EN→AR→EN without refresh; stored UI state contains semantic values, and unknown errors/enums have localized safe fallbacks. Calendar/currency choices are consistent and explicit.

### Phase 3 — Complete each role's actual workflows

Work through contractor requests/Kanban, contracts/billing, equipment/certificates/documents, company/team/settings; then client equivalents and admin pages/tools; then marketing/auth/install surfaces. Each slice includes its server defaults, dialogs, errors and accessibility text. Reuse working translated components where appropriate but verify each live consumer. Complete appointment controls, restore the activity route and retire/migrate removed project calls. Correct unsupported subscription claims, remember-me behavior, calendar overflow, date filters and incomplete analytics aggregates.

**Exit per slice:** loaded, empty, invalid, failed and successful states are recorded in both languages. Dynamic enums, optional labels, plural messages and secondary dialogs are covered. No dead action is presented as functional.

### Phase 4 — Localize persistent events and generated output

Migrate all nine notification writers to the event contract. Test event→recipient→inbox→link→target behavior and read/unread refresh. Add recipient-language email handling and locale-carrying links. Localize generated document defaults without changing user text. Complete legacy inventory/dry-run conversion. Repair print/export locale, raw statuses, zero-price formatting and the PDF option that actually produces Excel. Render and inspect the output; dormant PDF code must be removed or covered before activation.

**Exit:** new notifications and generated labels can render in either language, old records have a documented outcome, links resolve to visible records, and exported file content/format matches the chosen language and option.

### Phase 5 — Verify direction, theme, mobile and accessibility

Check actual layout rather than assuming translated text proves RTL. Verify right-hand Arabic navigation, branch tabs, Kanban reading order/drag behavior, dropdown arrow keys, calendar controls, drawers, toast direction and mixed-text fields. Correct forced white app surfaces while preserving intentional paper/signature backgrounds. Give the mobile menu focus containment, Escape dismissal and focus restoration. Verify map-provider language and installed-app behavior separately.

**Exit:** representative desktop/mobile widths work in EN/AR × light/dark with keyboard coverage, no hidden-menu focus leaks and no layout reversal applied twice. Unsupported external behavior is documented, not marked passed.

### Phase 6 — Independent closure review and release preparation

Run the complete coverage matrix, database/access tests, localization guard, typecheck, lint, unit/component/browser tests and production build. Trial forward migrations on an isolated database containing legacy records. Review the diff against both audits and the ledger, not just against recent commits. Prepare a local review build with safe role-specific fixture accounts. Push/deploy only after the user's subsequent explicit release approval.

**Exit:** every finding is fixed with evidence or remains visibly open; no critical/high-impact unresolved defect is concealed by a green build. The user can review the complete local result before release.

## Coverage and acceptance matrix

| Dimension | Required evidence |
|---|---|
| Pages | All 44 current page routes, plus shared layouts, error/loading/not-found states; update inventory if routes change. |
| Roles | Contractor, client, admin and applicable supervisor/technician/restricted-admin views; invalid roles get access-denied tests rather than fake page access. |
| Language | Cold EN, cold AR, EN→AR→EN on an open page, reload/persistence, notification/deep-link entry. |
| States | Populated, empty, loading, validation failure, server failure, permission denial; open dialogs, selected filters and unsaved inputs during switching. |
| Layout | Desktop and mobile, light and dark; long Arabic labels, mixed-script names, large amounts, zero/missing values. |
| Data | Two tenants; staff with one assigned branch; draft/published records; old/new notifications; user text that must remain unchanged. |
| Outputs | Search snippets, activity, notification body/link, email subject/body/link, print, actual PDF/XLSX, downloads and manifest/install copy. |
| Time/count | Month-end, leap year, selected end-day timestamps, relevant timezone cases; zero/one/two/few/many message counts. |

Core supported routes receive language/theme/viewport smoke coverage; high-risk workflows receive the full action/state combinations. Pairwise testing can reduce low-risk combinations only with the omission recorded. A screenshot of one page cannot close an entire domain.

## Regression protection

1. AST guard catches platform-owned JSX text/attributes, message literals, enum prettification, fixed locale formatters and translated state initialization. Extend scope to dictionary quality, API fallbacks, exports and persisted-message writers. Use narrow documented exceptions; never exempt a whole directory simply to pass CI.
2. Translation tests check keys, types, placeholders, enum coverage and reviewed glossary/content. Script-based language heuristics raise review candidates rather than rejecting all Latin characters in Arabic.
3. Rendered component/browser tests exercise language changes, accessible names and forced failure paths. Test configuration must actually discover TSX and browser tests.
4. Request/response contract tests cover uploads, missing routes and malformed responses. Tenant/lifecycle tests assert returned content, not only status codes or route classification.
5. Notification tests cover all registered event writers, intended recipients, retries, read state and valid destination tabs. Export tests inspect file contents and types; PDF rendering checks Arabic shaping and fonts.
6. CI runs on the deployment branch and PRs. Do not raise the existing lint-warning ceiling to conceal new warnings. Existing 199 warnings require tracked cleanup rather than a false zero-warning claim.

## Definition of done

- Every audit ID maps to a completed task with a regression test or recorded manual evidence.
- No unreviewed candidate remains in the release coverage; accepted exceptions have a precise reason. A dormant file is not marked localized merely because no page imports it.
- No known platform-owned wrong-language text remains in tested required states. Legacy unknowns must be resolved or explicitly reported as remaining work; they cannot be silently exempted from a completeness claim.
- Appropriate access, upload, email, notification, calendar and export workflows pass end-to-end with isolated services/data.
- Arabic content receives a fluency/domain terminology review; automated key parity is insufficient.
- Actual browser/output evidence, build results and migration trial results are attached to the checklist. Unrun checks are marked unrun.
- Existing local edits are preserved, and no push occurs until the user approves release.

## Risks and implementation choices

| Risk/choice | Handling |
|---|---|
| Old records lack provenance | Inventory and dry run first; preserve originals; only deterministic conversions; unresolved cases remain visible. |
| Upload repair exposes drafts | Define publication/ownership policy before association repair; test uploader, recipient and unrelated tenant. |
| Notification loss or duplication | Transactional event persistence, retry state and deduplication; test failure after commit and repeated delivery. |
| Large shared files cause conflicts | Sequential edits to dictionary/schema/shared components; keep domain slices small and verify after each. |
| Third-party language behavior | Test actual provider response and SDK reload behavior; record external limits. |
| Product promises lack implementation | Prefer removing unsupported subscription/remember-me/PDF controls until backed by real behavior; document the final choice. |
| Security package update causes regressions | Verify current official advisory, compatible lockfile update, relevant tests and fresh build; avoid blanket audit force. |

No elapsed-time promise is made before the candidate ledger and legacy-data inventory are complete. Progress is measured by verified workflow coverage and closed findings, not number of strings replaced.
