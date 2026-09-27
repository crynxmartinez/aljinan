# Full-system audit closure — 27 September 2026

This report supersedes the earlier batch-status report. Target branch: **production**. Main is not part of this release. The user authorized fixes and release; earlier local-review-only wording in the original plan is historical.

## Audit scope and traceability

- 44 page routes and 81 API route files inventoried in `2026-09-27-route-coverage.json`.
- All 987 original source candidates retained with dispositions in `2026-09-27-candidate-reconciliation.json`. Removed code, changed visible sinks, diagnostic errors, dynamic content and customer text remain distinguishable. A static disposition is not a claim that every possible UI state was exercised.
- Current guard has 103 narrowly reviewed exceptions, each with a reason in `localization-exceptions.json`. It detects literal visible text/attributes, toast/error copy, fixed locale formatting, direct enums, enums disguised by case/underscore replacement, and translated filter labels frozen in initial state.
- The original audit and source fingerprints remain unchanged as baseline evidence.

## Findings and repair evidence

| Finding group | Repair / evidence |
|---|---|
| S1/S2, F2/F3, D14 | Tenant-scoped analytics and current staff branch assignments; proper whole-day/month boundaries and full aggregation. `access-regressions`, `format-boundaries`, and the real database access matrix. |
| S4, D13 | Publication checks on draft invoices/contracts/quotations and associated documents; certificate/appointment writes bind both branch and record. Unit access regressions and hostile cross-tenant integration requests. |
| S5, D09 | Email rejection is reported truthfully; recipient-selected password setup; recipient language persisted; explicit invitation language; safe HTML interpolation. `activation`, `email-delivery`, `admin-invitation`, `preferences`. |
| S3, F12 | Compatible dependency updates; npm audit clean at verification; blocking security audit added to CI. Official GitHub actions pinned to Node-24 releases. Lint ceiling unchanged at 205. |
| L1, D08, F6/F7/F8 | Durable bilingual notification descriptors, shared rendering including proven generated-title parameters, correct links/read counts, transactional notification persistence, cron authentication/deduplication, contractor cancellation delivery. Notification unit suites plus rollback/cancellation integration tests. |
| L2/L3, D04/D05, F4/F14 | Locale-required date/currency helpers, Gregorian/Riyadh conventions, numeric zero preserved; actual XLSX/CSV verification; Arabic-font PDF export and active print routes; inactive renderers removed. `export-locale`, `locale-formatting`, `format-boundaries`, browser PDFs. |
| L4/L7/L8/L9, D02/D06 | Dictionary-backed labels, placeholders, accessibility names, statuses, time slots, document defaults and translated search categories/results. Quotation search now obeys branch/publication rules. `i18n`, `localization-components`, `localization-guard`, `search-results`, browser matrix. |
| L5/L6, D01/D15 | Explicit locale and enum contracts; key/interpolation parity tests; filter labels derived from stable values; approved error-code rendering with safe unknown-error fallback. |
| D03 | Generated certificate/maintenance defaults carry original-value provenance; customer edits disable generated translation. Additive historical migration updates metadata only on exact generator matches. Migration integration test verifies repeatability and unchanged customer findings. |
| F5, D10/D11 | Contractor/client appointment and quotation UI wired; scoped activity endpoint; obsolete project requests removed. Route/role browser tests and activities tests. |
| D07, F13 | Removed fabricated subscription facts/inert controls and unused remember-me checkbox. |
| D12 | Upload request contract repaired; saved attachments determine authorized sharing, including legacy uploads without branch metadata. `attachment-access` and upload/access tests. No blanket legacy rewrite or public-file workaround. |
| F9/F10/F11 | Modal mobile drawer with Escape/focus restoration, RTL tabs/sidebar, theme-aware surfaces and drag preview, locale/theme-aware toasts, print-only light paper. Component tests and role screenshots. |
| D16 | Localized manifest endpoint; address requests explicitly carry locale; transient lookup warnings derive text at render time. Google map controls depend on the initial SDK load language; see external limits below. |

## Verification and review

Successful CI evidence before the final workflow/guard changes:
- `36295447644`: migration repeatability/customer-edit preservation and cancellation delivery passed.
- `36295677743`: both jobs passed; 44-page inventory; route suite includes public/auth routes, client details/new branch, all three shells, five roles, branch tabs, both locales/themes, mobile navigation, work-order and request-quotation prints.
- `36295970925`: both jobs passed after repairing transformed enums and remaining dark-surface cases.
- `36296342276`: both jobs passed with pinned Node-24 actions and the blocking dependency audit. Vercel preview failed separately; its cause is not inferred from the GitHub checks.

Browser suite has six tests with many route/locale/theme assertions, not six individual screenshots. Actual screenshots/PDFs are uploaded as `browser-evidence` (7-day retention). The local review copies are in the workstation temporary directory and are not shipped as application files.

Visual review found and corrected an orphaned print-footer page and a dark-mode print canvas. A short work-order PDF must now be one page, and print media must report a light color scheme. Arabic shaping, RTL header/field order, mobile right-hand navigation and dark surfaces were inspected. Customer-provided English fixture names intentionally remain English in Arabic views.

Latest source review considered transaction rollback, authorization scope, draft visibility, additive migration safety, preserved user text, dependency compatibility and query limits. There are still pre-existing lint warnings; passing the unchanged ceiling is not a zero-warning claim.

## Deployment and recovery

The migration only adds locale/JSON metadata columns and fills metadata for exact historical generator matches. It does not rewrite titles, descriptions, notes, signatures or file bytes. Existing application versions tolerate these extra columns. To roll back application behavior, redeploy the previous application revision; do not drop these columns or delete migration history.

Production Vercel builds apply tracked migrations before building. Preview builds check migration status and never alter a shared production database. A missing/failed migration blocks the new deployment rather than publishing incompatible code. Actual production migration/deployment status must be checked separately from a successful GitHub push.

## Explicit verification boundaries

- No production customer records, emails or storage objects were used as test fixtures. Provider email/storage failures were mocked; real delivery and signed-object retrieval depend on deployed credentials and provider availability.
- Windows Device Guard prevented local Postgres execution. An earlier automatic approval review blocked local app startup with test settings; it was not bypassed. Real database and browser verification ran in isolated GitHub CI instead.
- Vercel preview protection requires an authorized login, unavailable in this session. Deployment health is not inferred from CI.
- Google Maps only chooses its UI language when the SDK first loads. Per-request place/geocoder language now follows the selection; already-loaded vendor controls may require a full reload. Installed PWA metadata refresh timing is browser/OS-controlled. No forced reload that discards unsaved form input was added.
- Historical customer text without reliable generator provenance is preserved. This is intentional, not a request to translate signed/customer-authored content automatically.
- The Electron entrypoint/module mode and dependency security were repaired; an installed desktop package was not launched on this workstation.
- Route smoke coverage does not certify every possible combination of edits, drag gestures, uploads or live provider responses. Remaining manual acceptance items stay unchecked in `tasks/todo.md` rather than being silently claimed as tested.
