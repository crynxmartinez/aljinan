# Deeper audit follow-up — 27 September 2026

This supplements [the first audit](2026-09-27-system-localization-audit.md); it does not replace its S1–S5, L1–L9 and F1–F14 findings. Application fixes were not made. The 11 existing modified source files belong to prior work and were preserved. No push, live customer-data access, real upload or email delivery was performed.

## What changed in the audit method

The second pass traced where displayed text originates and how it survives a language switch, rather than searching only for Arabic characters or components without `useTranslation`.

- Parsed 320 TypeScript/TSX files, including 44 page entrypoints and 79 API route files; identified 139 page/layout/error/loading/route entry files.
- Collected 987 targeted AST candidates: 339 JSX text nodes, 50 text attributes, 33 message calls, 76 formatting calls, 4 translated state initializers and 485 dynamic-display expressions requiring review. Of these, 690 are statically import-reachable. **These are review candidates, not 987 defects.** Dynamic imports, conditional rendering and external libraries require additional inspection.
- Traced API-generated display values, saved system-generated records, all nine notification-writer files, email callers, export/print paths and locale-dependent state/cache behavior.
- Inventoried 577 literal API `error` properties across 77 files. This is not a count of unique or user-visible messages; it establishes why a shared error contract is needed.
- Compared client-request URL shapes against the actual API route tree, then reviewed unmatched paths.
- Exercised current upload/file handlers with mocked session, permission, database and storage dependencies. No real files or storage calls were involved.

The machine-readable [candidate inventory](2026-09-27-localization-candidates.json) includes source locations and source fingerprints. It is an input to a reviewed coverage ledger, not a completed ledger.

## Additional findings

### D01 — Language-dependent labels are frozen in component state

`src/app/dashboard/work-orders/page.tsx:45,67` and `src/app/portal/work-orders/page.tsx:45,67` initialize filter/quick-filter state with translated labels. Changing locale does not rerun the initializers. `src/components/filters/filter-panel.tsx:69` also copies filter props into local state without routine synchronization.

This can retain English labels in Arabic even though every label uses the dictionary. Recomputing parent labels alone will not repair the copied child state. Store selected IDs independently and derive labels during rendering. Include language switching with an open drawer and selected filters in the regression test. Persistent translated error strings need the same treatment: store an error code and parameters, not the already-rendered sentence.

### D02 — Documents receive English display defaults from the API

`src/app/api/branches/[branchId]/documents/route.ts` generates defaults including `Unknown` (35), `Quotation` (78), `Request Photo` (118), `Contractor` (170), `Contract Document` (184), `Contract Certificate` (202), `System` (226), `Report - ...` (284), `Payment Proof` (321), `Payment ...` (351) and `Client` (357). It also incorporates raw equipment types.

`src/components/modules/documents-list.tsx:300–310` displays returned filenames, related-record labels and uploader names. Translating its section headings does not translate these defaults. Return stable document/actor kinds and parameters for generated labels; preserve actual filenames and person names. The `d` expiry suffix at line 323 also needs localization. An API field named `sourceLabel` is not, by itself, evidence that the UI renders it.

### D03 — Platform-generated English is saved as record content

Examples: `checklist-items/route.ts:141–174` generates inspection-certificate titles, descriptions and `System (Auto-generated)`; `contracts/[contractId]/route.ts:168–223` generates maintenance schedules and visit descriptions using English frequency labels. Immediate/start-now/request handlers also generate default work-order descriptions.

Distinguish user-authored content from generated content. New defaults should have a template identifier and parameters or equivalent safe derivation. Historical content needs provenance-aware handling. Do not rewrite arbitrary descriptions, signed records or issued documents with a blanket text replacement. Migration must report uncertain records and retain originals.

### D04 — Live financial views still force English/default formatting

Fixed locale/default formatting remains in `billing-view.tsx:122`, `billing-work-orders-display.tsx:88`, `contract-work-orders-display.tsx:61`, `branch-dashboard.tsx:156`, `column-detail-modal.tsx:232`, `payment-submit-dialog.tsx:54`, `payment-verify-dialog.tsx:60,152`, `requests-list.tsx:1695,1716,2021,2029` and `branch-profile-card.tsx:172`.

Use the selected locale through shared currency/number/date/time formatters. Define timezone and date-only semantics separately. Western digits in Arabic are an existing product convention; do not treat every Latin digit as a translation failure. This audit does **not** establish a Hijri-calendar defect.

### D05 — Print values bypass otherwise-translated labels

`src/components/print/work-order-print.tsx:708` renders a raw maintenance status; lines 1034 and 1043 render raw overall status/risk level; line 816 has `/hr`. Exhaustive translated enum maps and localized units are needed in addition to translated headings. Verify actual printed output, not just the source template.

### D06 — Additional labels and accessibility text

Examples include `Contractor` in `admin/contractors/page.tsx:431`, `Admin` in `admin-sidebar.tsx:128`, `Admin name` in `admin/settings/admins/page.tsx:306`, the contact map iframe title at `contact/page.tsx:218`, and `Logo` alt text at `contractor-profile-card.tsx:107`.

Select placeholders in `column-detail-modal.tsx:365,376` and `equipment-list.tsx:504,516` are literal English, but default selections normally hide them: classify these as conditional gaps, not proven always-visible defects. Proper names and examples such as John Doe are not automatically translation bugs.

### D07 — Company subscription panel displays unsupported account facts

`src/components/contractors/contractor-profile-card.tsx:174–199`, rendered by `dashboard/company/page.tsx:38`, always shows an active professional plan and the fixed date `Jul 15, 2026`. View History and Pay Subscription buttons have no handlers.

Bind this surface to real account data and working actions, or remove unsupported claims/actions. Translating the date would leave the underlying misinformation intact.

### D08 — Notification localization and reliability span nine writers

Writers exist in `notification-service.ts`, checklist-item, invoice, request-comment, start-now and immediate-work-order routes, both notification/archive cron routes and equipment expiry. Repairing only the helper service leaves other fixed-language records.

`notification-service.ts:77` catches a persistence failure and returns null. Domain changes can already have succeeded before a notification is attempted. Define an event/recipient policy and persist the required event atomically with the successful change; use retryable delivery where needed. Deduplicate retries and expiry windows. No-op changes and failed changes should not create success notifications. This is not a recommendation to notify everyone about every edit.

### D09 — Email language follows the actor, not necessarily the recipient

Email templates already support both languages. Callers such as `clients/route.ts:134` and `admin/contractors/create/route.ts:64` pass the acting user's `getLocale()` cookie. There is no persisted recipient locale preference in the current user schema. Verification links also do not consistently carry the intended locale into a new browser session.

Resolve language from recipient preference, or an explicit invitation-language default for a new recipient, and propagate a validated locale through account links. Do not infer a client's language from an administrator's current screen language.

### D10 — Live activity panel calls a missing route

`src/components/modules/activity-panel.tsx:63,87` calls GET/POST `/api/branches/${branchId}/activities`. No matching API route or rewrite exists. Both branch workspaces render and expose this panel. This is a live workflow failure, beyond its English fallback errors.

Implement the scoped activity contract against the intended data model, or deliberately retire the feature. Its permission and pagination behavior need tests; merely hiding an error is not a repair.

### D11 — Client request page retains requests to removed project APIs

`client-branch-requests.tsx:398,414` fetches `/api/branches/${branchId}/projects` on mount. Lines 421, 447 and 466 refer to `/api/projects/.../approve` and `/api/projects/.../work-orders`; these routes do not exist. The initial fetch is live; subsequent approval dialogs are not demonstrated reachable because the list stays empty.

Trace this legacy flow against current requests/contracts/work orders and remove obsolete code or migrate the intended action. Do not recreate an entire legacy project subsystem merely to make a URL resolve.

### D12 — Upload callers violate the API/access contract

Payment proof: `payment-submit-dialog.tsx:100–101` sends `file` and `folder`, but omits `type`; `api/upload/route.ts:63` rejects that shape.

Branch documents: upload callers in `contracts-list.tsx:413–437`, `requests-list.tsx:476–478,574–576`, `checklist-kanban.tsx:800–802` and `client-branch-requests.tsx:492–494` omit `branchId`. The upload route accepts a null branch association. `api/files/[uploadId]/route.ts:41–43` then uses uploader-only access instead of shared-branch access. No subsequent upload reassociation was found in the traced save paths.

Mocked executions of the actual handlers returned:

```text
Payment form shape: 400 — Upload type and folder are required
Contract form shape: 200 — stored branchId: null
Same-branch other-party read: 403 — Access denied
```

These tests establish the request/access mismatch, not a real storage integration result. Repair with a typed shared upload client and validated association/publication rules. Do not make files public or automatically expose draft attachments to every branch user. Existing unscoped files need a reviewed ownership repair using record associations.

### D13 — Draft publication rules also diverge for contracts and quotations

List routes exclude drafts for clients (`quotations/route.ts:27`, `contracts/route.ts:29`), but their detail routes query ID/branch without that lifecycle restriction (`quotations/[quotationId]/route.ts:28`, `contracts/[contractId]/route.ts:51–70`). The documents API at line 164 also loads contracts by branch without excluding drafts and can expose draft attachment metadata. Search requires the same publication-policy review.

This is a client-with-branch-access disclosure, not a claim of unauthenticated internet access. Apply one policy consistently to list, detail, search, document metadata, downloads and print. Include file association repair from D12 in the same security design.

### D14 — Work-order end-date filters exclude later times on the chosen day

Both work-order pages at lines 109–111 compare against `new Date(dateRange.to)`. For a date-only selection that bound is midnight, excluding appointments/work orders later that day. Define inclusive calendar-day UX with an exclusive next-day boundary in the intended business timezone. Test DST-independent/date-only handling as well as timestamp behavior.

### D15 — Successful malformed JSON is accepted as undefined

`src/lib/api-client.ts:96–101` catches JSON parsing failure on a successful response and returns `undefined as T`. A caller can therefore enter its success path without the promised data. Accept explicitly empty responses where documented (such as 204); surface a localized contract error for malformed required JSON. Test this at the helper boundary rather than assuming every endpoint currently triggers it.

### D16 — External map wording requires runtime verification

The address picker does not pass a selected language into its map provider/autocomplete/geocoding setup (`address-picker.tsx:347` and related requests). Provider defaults may follow browser or script configuration. Actual output after a language switch was **not** verified; this is an open verification item, not a claim that Google always returns English.

## Why previous sweeps were insufficient

1. Dictionary parity proves keys exist, not that screens use them or translations are correct.
2. A component importing `useTranslation` can still render raw enums, API errors, defaults and persisted records.
3. Screens translated on initial load can retain the old language in state or cached payloads after switching.
4. Notification, upload and document flows cross multiple writers/endpoints; reviewing only a shared component misses bypasses.
5. Default unit tests do not render authenticated pages, dialogs, downloads or historical records. The current unit pattern also does not automatically establish TSX/browser coverage.
6. Some previous findings were stale or dormant; live-path verification and explicit exclusions are necessary to avoid spending time fixing the wrong surface.

## Verification boundary

The first audit's typecheck, 45 unit tests and lint pass remain baseline evidence; they were not evidence that these new behaviors worked. Source fingerprints showed no application-source changes during the second pass. No new authenticated browser walkthrough, production build, live database/storage integration, migration trial or full visual comparison was completed in this pass. Those are explicit implementation/release gates in [the plan](../../tasks/plan.md).

The correct target is **zero unresolved platform-owned language defects in the recorded coverage**, not zero English characters in Arabic. Names, user-written content, file formats, email addresses, technical identifiers, intentionally white printed paper and signature canvases require appropriate handling rather than blind replacement.
