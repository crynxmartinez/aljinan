# System and English/Arabic audit — 27 September 2026

Audit of the current local checkout, including 11 pre-existing modified files. Application code was not changed. No commit, push, database mutation, or real email delivery was performed.

## Scope and verification

- Repository-wide source inventory: 320 TypeScript/TSX files, including 79 API route files. Broad searches covered UI literals, formatting, direction, theme classes, notifications, exports and security boundaries; selected execution paths were then manually traced. This is not a claim that every line or live workflow was exhaustively tested.
- `npm run type-check`: passed.
- `npm test`: 45/45 passed across 4 files, including the 4 i18n tests.
- `npm run lint`: passed with 199 warnings, 0 errors; the configured ceiling is 205.
- Dictionary inspection: 3,082 string leaves in each locale. No Arabic characters found in English dictionary values. Arabic values containing only Latin words were email/phone examples, file-format labels and AppImage. The singular item-count translation intentionally omits the count placeholder in Arabic; this is not itself a defect.
- Calendar overflow reproduced using the same JavaScript date operation: 31 January 2026 plus one month becomes 3 March 2026.
- Resend SDK error behavior verified with a mocked HTTP 422 response, with no network delivery: the promise resolves to `{ data: null, error: ... }`, rather than throwing.
- Analytics/search query scope checked against current source and with mocked session/cache/Prisma query capture. No live tenant data was accessed.
- `npm audit --omit=dev`: 12 affected package entries, comprising 1 critical, 10 high and 1 moderate. Counts include transitive packages and are not counts of demonstrated exploitable application paths.
- Not performed: production inspection, a new production build, live database integration suite, authenticated browser walkthrough, mobile visual comparison or exploit testing. Those remain required before a full release sign-off.

## Highest-priority findings

### S1 — P1: Contractor analytics is missing tenant isolation

**Evidence:** `src/app/api/analytics/dashboard/route.ts:43`, `:152`; `src/lib/prisma.ts:34`.

The contractor branch of `baseWhere` filters archived clients and deleted work orders but never filters by the current contractor. Revenue, counts, chart data and named top clients are computed across qualifying records from other contractors. Prisma is instantiated without an implicit tenant-scoping extension. A user-specific cache key does not repair the database query.

**Trigger:** contractor A loads analytics when contractor B also has work orders. B's records can contribute to A's figures and top-client names.

**Repair:** resolve contractor ownership server-side and apply it to every analytics query; preserve assigned-branch constraints for staff. Add a two-contractor regression test that checks returned values and names, not merely HTTP status.

### S2 — P1: Staff search bypasses assigned-branch restrictions

**Evidence:** `src/app/api/search/route.ts:52`, `:115`, `:152`; intended policy in `src/lib/permissions.ts:27`.

Search resolves a team member to their employer's contractor ID, then runs employer-wide searches. It never applies their branch assignments. A team member assigned only to branch A can discover titles, IDs, status and identifying information from branch B under that employer. A later denial when opening a result does not undo the disclosure.

**Repair:** apply assigned-branch scope consistently to search categories and include effective access scope in cache invalidation. Test a staff account against both assigned and unassigned branches.

### S3 — P1: Locked Next.js version has critical published advisories

**Evidence:** `package-lock.json` resolves `next` to **16.3.1**, and `sharp` to **0.34.5**. `next.config.ts:7` enables AVIF output. The dependency audit flags both packages.

The Next.js maintainers identify 16.3.3 as a patched version for the Windows-hosted server issue and the AVIF image-optimization issue:

- [Windows-hosted server advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)
- [AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)

The Windows condition is relevant to this local development environment if the server is reachable; it is not evidence that a Linux production host has the same exposure. AVIF exploitability also depends on the actual image-input/deployment path. No exploit was attempted and no compromise is alleged.

**Repair:** update to a patched compatible release, review the complete dependency tree and rebuild/test. Do not blindly accept the audit's suggested Prisma major-version downgrade. Other flagged package entries are `@prisma/config`, `@xmldom/xmldom`, `brace-expansion`, `browserslist`, `deepmerge-ts`, `fast-uri`, `fflate`, `mysql2`, `prisma`, and `xlsx`; some are tooling/transitive paths rather than demonstrated runtime exposures.

### S4 — P2: Clients can discover and read draft invoices

**Evidence:** `src/app/api/search/route.ts:249`; `src/app/api/branches/[branchId]/invoices/[invoiceId]/route.ts:27`. Compare the intentional DRAFT exclusion in `src/app/api/branches/[branchId]/invoices/route.ts:28`.

The invoice list hides drafts from clients, but search does not. Once a client has the invoice ID, the detail endpoint returns it, including items, without enforcing the same publication rule.

**Repair:** centralize client-visible invoice status rules and apply them to list, search, detail and related export/print paths. Add a client-versus-draft test.

### S5 — P1: Email failures can be reported as success after credentials change

**Evidence:** `src/lib/email.ts:44`, `:77`, `:89`, `:128`, `:142`; `src/app/api/auth/verify-email/route.ts:45`, `:61`.

The email helpers await `resend.emails.send()` but do not inspect its returned `error`; they return success when the SDK resolves with a rejection response. Verification changes the password and clears the token before sending credentials, and ignores the helper's result. This can leave the user without the generated credentials while the UI reports success.

**Repair:** inspect provider results, provide a recoverable delivery state/retry path and avoid presenting credential delivery as successful until it is confirmed. Test provider rejection and network failure without sending real messages.

## Why English and Arabic still mix

The dictionaries themselves pass parity checks. The remaining failures are mainly strings that never reach those dictionaries, raw server/database text, and locale-dependent data that is fetched only once.

### L1 — P2: Notification content is persisted in fixed Arabic or English

**Evidence:** `src/lib/notification-service.ts:93`, `:110`, `:233` and the remaining helper messages; renderers at `src/components/notifications/notification-center.tsx:254`, `notification-popup.tsx:129`, and both notification-list pages.

Titles such as `طلب خدمة جديد` and `أمر عمل جاهز للمراجعة` are stored as final Arabic sentences and rendered unchanged. Conversely, scheduled work-order/expiry reminders in `src/app/api/cron/work-order-notifications/route.ts:131`, `:198`, `:262` are stored in English (for example, `Work Order Due Today`). Translating the bell menu and buttons does not translate either producer's content. Switching either way retains the original stored language, including old records.

**Repair:** persist a message key/type plus interpolation data and translate when displaying it. Preserve user-written names/notes. Provide a deliberate fallback or migration policy for existing raw-text records; do not use the triggering user's locale as the recipient's preference.

### L2 — P2: Exports have Arabic headings and dates in either locale

**Evidence:** `src/lib/export/export-utils.ts:43`, `:64`, `:98`, `:131`, `:214`.

Excel/CSV/PDF builders do not accept a locale. Headings, worksheet names and PDF footer are fixed Arabic. Status/type values are produced by replacing underscores in English enum names, so even the Arabic export is mixed-language. These functions are called by live contractor/client work-order and request screens.

**Repair:** pass locale into all builders, translate headings and enum values, use shared date/currency formatting and configure document direction deliberately. Verify actual Arabic PDF output and font support before declaring that export correct.

### L3 — P2: Live print pages retain fixed date/currency locales

**Evidence:** `src/components/print/work-order-print.tsx:224`, `:235`, `:343`; `src/components/print/request-quote-print.tsx:93`, `:104`, `:229`.

Labels use translations, but the local date helpers force `ar-SA-u-nu-latn`; currency forces `en-SA`; generated times use the browser default. English printouts therefore retain Arabic dates. Both components are imported by active `/print/...` pages.

**Repair:** use the selected locale consistently for all date/time/currency output, including generated-at footers. Keep document identifiers, email addresses and user data intact.

### L4 — P2: Errors and fallback states bypass translations

**Evidence:** `src/lib/api-client.ts:28`, `:72`; `src/lib/auth.ts:11`, `:73`, `:105`; `src/app/login/page.tsx:37`, `:52`; `src/components/ui/load-failure.tsx:18`, `:34`; `src/app/global-error.tsx:24`.

API errors, network failures, login rejection strings, the shared retry explanation and root error page remain English. The API helper prioritizes raw server error text, so a translated fallback in a component does not solve the general problem.

**Repair:** return stable error codes with safe details, localize them at the UI boundary and use translated fallback messages. The root error boundary needs a safe locale fallback independent of a working context provider.

### L5 — P2: Search exposes English enum labels in Arabic

**Evidence:** `src/app/api/search/route.ts:500`, `:513`, `:551`, `:565`, `:578`, `:620`.

Category headings are translated, but result subtitles and equipment/certificate type labels contain raw enum values or underscore-replaced English. The API does not resolve a locale.

**Repair:** return structured status/type fields and translate in the client. If translated text remains server-generated, vary caches and refresh requests by locale.

### L6 — P2: Analytics retains chart labels from the previous language

**Evidence:** `src/app/dashboard/analytics/page.tsx:40`; `src/app/api/analytics/dashboard/route.ts:199`.

The server generates localized chart labels, but the client fetch effect runs only on mount. A language switch updates translated page headings while existing chart labels in React state can remain in the previous language. The API's locale-aware cache key is already correct; the client refresh dependency is missing.

**Repair:** refetch on locale change with stale-request protection, or return language-neutral chart categories and format labels in the client.

### L7 — P3: Shared accessibility labels and installed-app text remain single-language

**Evidence:** `src/components/ui/dialog.tsx:75`, `src/components/ui/sheet.tsx:77` hardcode `Close`; `src/components/ui/password-input.tsx:32` lacks a localized accessible name; `public/manifest.json:2` has fixed Arabic names/descriptions/shortcuts.

**Repair:** localize shared accessible labels, expose a keyboard-operable password toggle, and decide a locale-aware manifest strategy. Technical labels such as PDF, CSV, email addresses and AppImage are not translation failures by themselves.

### L8 — P2: Remaining live screen text and raw status/type labels

These were identified from a scan of all 289 TS/TSX files under `src/app` and `src/components`, followed by targeted import/render tracing. This inventory complements the shared-service findings above; merely adding keys without replacing these render sites will not fix the visible text.

| Surface | Current evidence | Visible untranslated content |
|---|---|---|
| Contract create/edit/details | `src/components/modules/contracts-list.tsx:1337`, `:1345`, `:1416`, `:1426`, `:1533`, `:1623`, `:1702`, `:1925`, `:2038`, `:2159` | Add System, Add your first system, Manual, Auto-Calculate, Create Contract, Save Changes and attachment actions. Frequency labels at `:947` and raw work-order/payment statuses at `:1175`, `:1245`, `:2010` also bypass translations. |
| Staff profile | `src/components/team-members/team-member-profile-form.tsx:83` through `:193` | My Profile, Supervisor, Technician, personal-information instructions, field labels/placeholders and save controls. This is rendered at `/dashboard/profile`. |
| Client work-order list | `src/app/portal/work-orders/page.tsx:396`, `:401` | Raw status/type text such as IN PROGRESS and SERVICE, even though the filters are translated. |
| Admin charts | `src/app/admin/page.tsx:100`; `src/components/admin/admin-charts.tsx:81` | Requested, Quoted, Scheduled, In Progress and other English statuses feed chart labels/legends directly. |
| Branch dashboard | `src/components/modules/branch-dashboard.tsx:243`, `:247` | Raw English work-order type in Arabic mode; fixed Arabic `#أمر-` in English mode. |
| Calendar overflow | `src/components/modules/calendar-view.tsx:251` | The “more tasks” label uses Arabic `أخرى` even in English when a day has over three tasks. |
| Signature widget | `src/components/ui/signature-pad.tsx:126`, `:136`, `:142` | Instructions, Clear and Signature captured remain English. |
| PDF preview | `src/components/ui/pdf-viewer.tsx:44`, `:52` | English preview actions. |
| Action center / Kanban | `src/components/dashboard/action-center-table.tsx:327`; `src/components/modules/checklist-kanban.tsx:1858` | Raw equipment-type labels. |
| Request details/forms | `src/components/modules/requests-list.tsx:1342`, `:1354`, `:1565`, `:1651`, `:1984`, `:2040` | English “(optional)” suffixes and raw work-order/equipment types. |
| Equipment details | `src/components/modules/equipment-list.tsx:1116` | Linked request status uses the enum value. |
| Company information | `src/components/team-members/company-info-card.tsx:50` | Stored business-type enum bypasses translated display labels. |
| Activity / billing | `src/components/modules/activity-panel.tsx:142`, `:149`; `billing-work-orders-display.tsx:225` | English error/retry text and occurrence(s). |
| Branch navigation | `src/app/dashboard/clients/[clientSlug]/branches/[branchSlug]/page.tsx:125` | Back to. |
| Install/download marketing pages | `src/app/(marketing)/install/install-content.tsx:26`, `:82`; `download/download-content.tsx:42`, `:62`, `:90` | Desktop Apps, Mobile Apps and English version prose. Product/file-format names alone are not considered defects. |
| Admin maintenance tools (P3) | `src/app/admin/generate-slugs/page.tsx:41`; `src/app/admin/backfill-work-order-numbers/page.tsx:41` | The maintenance screens retain English or mixed-language copy. |

Component-owned error fallbacks also need a pass independently of the shared API helper: `equipment-list.tsx:175`, `contracts-list.tsx:423`, `quotations-list.tsx:162`, `payment-submit-dialog.tsx:130`, `request-comments.tsx:83`, and auth/client/request/attachment handlers. Translate error codes before displaying server text, with a localized fallback for unknown failures.

**Repair:** use centralized translated maps for all supported status/type enums and wire every visible literal into the dictionary. Use plural-aware messages instead of English suffixes. Avoid translating technical identifiers or user-written content.

### L9 — P2: A dictionary value itself is mixed-language

**Evidence:** `src/lib/i18n/translations.ts:6437`, used at `src/components/print/work-order-print.tsx:1067`.

`ar.dashboard.workOrderPrint.na` is literally `غير applicable`. Key parity and nonempty-value tests pass because the key exists, but the text is still incorrect. Replace it with appropriate Arabic such as `غير منطبق` and include content review, not just structural tests.

## Other confirmed functional/UI issues

| ID | Priority | Evidence | Problem and repair |
|---|---|---|---|
| F1 | P2 | `src/components/modules/calendar-view.tsx:117` | Month navigation retains day 29/30/31, so `setMonth()` can overflow and skip a month. Navigate from day 1 and test month-end/leap-year boundaries. |
| F2 | P2 | `src/app/api/analytics/dashboard/route.ts:28`, `:134`, `:140` | Month-end bounds are midnight at the start of the last day, excluding most of that day's work orders. Use exclusive next-month bounds. |
| F3 | P2 | `src/app/api/analytics/dashboard/route.ts:172` | Top-client revenue is computed from at most 500 work orders with no ordering, not complete client aggregates. Totals/ranking become inaccurate at scale. Aggregate by client in the database. |
| F4 | P2 | `src/components/modules/requests-list.tsx:999`; `src/app/portal/branches/[branchId]/client-branch-requests.tsx:712` | Selecting PDF executes the Excel exporter and downloads XLSX. Implement the offered format or remove the PDF option for requests. |
| F5 | P2 | `src/components/modules/appointments-list.tsx:223`, `:233`, `:237` | Contractor Calendar renders work-order CalendarView only. Fetched appointments are not listed; create/detail dialogs have no opening controls. Clients have an appointment list, but the contractor management path remains incomplete. |
| F6 | P2 | `src/lib/notification-service.ts:95`, `:163`, `:180`, `:218` | Several notification helpers link to nonexistent `/dashboard/branches/...` routes. Use the actual client/branch workspace route and correct tab. ID-based client/branch values are supported by the real page; the missing `/clients/...` route segment is the defect. |
| F7 | P2 | `src/app/api/notifications/route.ts:27`; `src/components/notifications/notification-center.tsx:151` | Unread totals omit older unread notifications unless all newest 50 are unread. The bell also computes its own count from the fetched slice. Query the full unread count and consume it in the UI. |
| F8 | P2 | `src/components/notifications/notification-center.tsx:76`, `:167`; `notification-popup.tsx:32` | Bell and popup fetch on mount; the bell does not refresh on open or poll. New notifications may remain unseen while the shared header stays mounted. Add an intentional refresh/subscription strategy and reconcile read state. |
| F9 | P2 | `src/app/portal/branches/[branchId]/client-branch-quotations.tsx:180`; `src/components/modules/requests-list.tsx:239`; `checklist-kanban.tsx:1328`; `src/components/ui/reschedule-notification-modal.tsx:112` | Live cards/drag preview still force white backgrounds without dark variants. Use theme surfaces. White signature canvases and printed paper are intentional exceptions, not blanket replace targets. |
| F10 | P2 | `src/components/layout/sidebar-shell.tsx:25`, `:34` | Closed mobile sidebar is only translated off-screen; its links remain focusable. Open drawer lacks modal focus management, Escape handling and focus restoration. Use an accessible drawer primitive or implement these behaviors explicitly. |
| F11 | P3 | `src/app/layout.tsx:73` | Toast position is fixed `top-left` and is not connected to selected direction/theme. Audit Sonner's actual rendering in both locales/themes and wire its direction/position deliberately. |
| F12 | P2 | `.github/workflows/ci.yml:8` | CI runs for `main` and `develop`, not direct pushes/PRs to `production`. Include the deployment branch and enforce required checks before shipping it. |
| F13 | P3 | `src/app/login/page.tsx:20`, `:31`, `:111` | Remember-me changes local checkbox state but is not passed to authentication or used to change session lifetime. Implement the behavior or remove the promise. |
| F14 | P3 | `src/components/print/work-order-print.tsx:234`; `request-quote-print.tsx:103`; `src/lib/export/export-utils.ts:175` | Zero-price values render as `-` because falsy checks conflate zero with missing data. Use explicit null/undefined checks. |

## Coverage gaps and non-findings

- Translation parity tests verify dictionary shape/empty values, not whether screens actually use translations. Add rendered-language coverage for shared UI, statuses, validation failures, notification bodies, print and export output.
- Access-matrix coverage classifies analytics/search as already scoped (`tests/integration/access-matrix.test.ts:219`) without exercising their tenant isolation. Classification is not an authorization assertion.
- Root HTML direction, Radix DirectionProvider, locale-aware Tabs and the filter drawer's explicit locale-based side are already present. Do not re-report the earlier missing-provider/filter-side findings as current defects.
- Email templates already use translations and set language/direction. Their delivery-error handling remains broken; calling them English-only would be stale.
- The four `src/lib/pdf/*-report.tsx` files contain Arabic-only text, but no current source imports were found. Treat as dormant-code cleanup/activation risk, separate from the confirmed live print/export issues above.
- Existing local edits already translate much of quotations-list, company/team/branch forms and notification chrome. They were included in this audit, not overwritten or counted as untouched older versions.
- User-entered descriptions, company names, uploaded documents and quoted comments should preserve their original language. They need bidirectional isolation where appropriate, not silent machine translation.

## Recommended repair order

1. Correct analytics/staff-search isolation and client draft visibility; add real regression tests for each boundary. Upgrade affected runtime dependencies with a fresh build and dependency review.
2. Make email delivery failures recoverable. Fix notification destination links, unread counts and refresh behavior.
3. Localize notification content, shared API/auth errors, search enums and remaining live UI literals. Keep technical identifiers and user-authored content separate.
4. Repair print/export language and format behavior; fix calendar navigation, analytics month bounds and appointment management controls.
5. Finish dark/mobile/accessibility corrections and verify contractor, client, admin and staff flows in EN/AR × light/dark × desktop/mobile. Add repeatable regression checks and enable them on the production branch.
