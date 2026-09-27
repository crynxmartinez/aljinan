# Implementation checklist — system reliability and EN/AR completion

Status: implementation in progress; push to production authorized by the user. Existing source edits were preserved. See [release evidence and remaining work](../docs/audits/2026-09-27-remediation-status.md). Unchecked tasks include work implemented but not yet verified against their full acceptance criteria.

## How to execute

- Work in dependency order. Mark a task done only with its verification result and evidence path recorded.
- Rows marked “individual slices,” “per flow,” or “one ... per slice” are rollout groups: expand them into one child checkbox per named file/flow before editing. Keep each child to roughly 1–5 production files plus focused tests; do not treat a broad sweep as one completed task.
- Add a failing behavioral regression before repairing logic. Use render checks for wording/layout; do not add tests that only mirror a string replacement.
- After every 2–3 child tasks, run relevant focused tests and typecheck. At each phase boundary, run a build and review unresolved findings. Do not repeatedly run the full suite after documentation-only changes.
- Use an isolated test database and mocked email/storage. Never alter production records to prove a fix.
- Record failed/unrun checks honestly. The final approval point is local review before release, not repeated permission requests for each routine fix.

## Phase 0 — Baseline and coverage

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T01: Preserve baseline and classify candidates | None | docs/audits/*; new coverage ledger | Record all 11 existing modified files and hashes. Classify the 987 candidates with reasons and keep unverified items open. | Compare fingerprints and manually sample every candidate class. | All |
| [ ] | T02: Map routes and test fixtures | 01 | new route/state coverage manifest; tests fixtures | Map all 44 pages, nested actions, roles and 79 API routes. Prepare isolated two-tenant, restricted-staff, draft/published and legacy-message fixtures. | Manifest completeness against route tree; fixture isolation check. | All |
| [ ] | T03: Add localization guard | 01 | new audit script; tests/unit localization guard tests; package.json | Detect literal UI text/attributes/messages, fixed formatting, raw enum display and translated state. Exceptions are narrow and documented. | Throwaway fixture violations must fail; proper names and user-content negative controls must pass. | L1–L9,D01–D06 |
| [ ] | T04: Enable real render-test discovery | 02 | vitest configuration; component/browser test configuration; smoke tests | TSX/component and browser tests are discovered separately from existing node unit tests; one locale-switch smoke runs. | List discovered tests and execute a deliberate fixture failure before restoring it. | L6,D01 |
| [ ] | T05: Cover production in CI | 03,04 | .github/workflows/ci.yml; package.json if needed | Deployment-branch pushes/PRs run the checks; existing warning ceiling is not raised. Review action runtime deprecations against supported releases. | Validate workflow and test commands; verify branch filter includes production. | F12 |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 1 — Access and failed operations

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T06: Scope contractor analytics | 02 | api/analytics/dashboard/route.ts; focused integration test | Every analytics query is tenant-scoped; staff restrictions remain intact. | Two tenants with distinct totals/names; forbidden data never contributes. | S1 |
| [ ] | T07: Restrict staff search | 02 | api/search/route.ts; permissions helper if needed; focused test | Every applicable category respects branch assignments and admin permissions. | Assigned/unassigned branch fixtures across result categories and cache behavior. | S2 |
| [ ] | T08: Unify invoice publication policy | 02 | invoice list/detail routes; search route; shared visibility helper; focused test | Client cannot discover/read draft invoices through list, detail or search; contractor retains intended access. | Assert payload content for draft/published and tenant fixtures. | S4 |
| [ ] | T09: Unify contract/quotation publication policy | 08 | contract/quotation routes and shared visibility helper (split by resource) | Apply draft visibility to each resource's list and detail endpoints without weakening ownership. | One focused test per resource for all role/lifecycle combinations. | D13 |
| [ ] | T10: Protect document metadata and file reads | 09 | documents route; files/[uploadId]/route.ts; search route; focused test | Contract draft metadata/attachments obey publication policy; IDs do not bypass it. | List/search/detail/download tests with client, owner and unrelated tenant. | D13,S4 |
| [ ] | T11: Repair payment upload request | 02 | payment-submit-dialog.tsx; shared upload client; upload route; focused test | Payment proof sends required fields and valid branch association; invalid requests show localized errors after task 17. | Submit proof through the real handler contract using mocked storage. | D12 |
| [ ] | T12: Repair branch upload associations | 10,11 | contracts-list, requests-list, checklist-kanban, client-branch-requests (one caller per slice) | Each upload carries validated ownership/publication context. Published intended recipients can read it; draft outsiders cannot. | Per-caller upload→save→other-party read; failed save/orphan cleanup behavior checked. | D12 |
| [ ] | T13: Inventory and repair legacy unscoped files | 12 | new migration/dry-run script; upload association tests | Dry-run joins uploads to owning records; ambiguous rows untouched and reported; originals/audit trail retained. | Trial on isolated old-data fixtures; no public-file workaround. | D12 |
| [ ] | T14: Handle provider email rejection | 02 | src/lib/email.ts; focused tests | SDK returned errors and thrown failures produce truthful failure results. | Mock rejection, network failure and success; no real mail sent. | S5 |
| [ ] | T15: Make account verification recoverable | 14 | auth/verify-email route; associated account setup handlers; focused tests | A delivery failure cannot silently strand users after credential/token changes. Retry/setup state is safe and truthful. | Provider failure before/after persisted state, retries and duplicate requests. | S5 |
| [ ] | T16: Patch vulnerable dependencies compatibly | 02 | package.json; package-lock.json; dependency review note | Refresh official advisories; upgrade affected paths without blind major downgrade; record residual exposure. | Clean install, dependency audit, typecheck, relevant tests and production build. | S3 |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 2 — Shared localization contracts

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T17: Localize API error contracts | 03 | api-client.ts; new public error-code map; translations.ts; tests | Stable codes/parameters yield selected-language text; unknown failures are safe. Malformed required JSON is an error; documented 204 stays valid. | Network, validation, forbidden, unknown-code, malformed JSON and empty-success fixtures. | L4,D15 |
| [x] | T18: Centralize enum display | 03 | new enum-label helper; translations.ts; tests | Supported statuses/types/roles/risk levels are exhaustive; unknown future values use a translated fallback, not underscore replacement. | Compare supported enums with schema/domain sets in both locales. | L5,L8,D05 |
| [ ] | T19: Centralize locale formatting | 03 | lib/i18n format helpers; tests | Locale is explicit; zero/null differ; date-only, timestamps, currency, counts and units have defined semantics. | EN/AR, zero/missing, large values, Gregorian/date-only/timezone fixtures. | L3,F14,D04,D14 |
| [ ] | T20: Repair filter state switching | 04,18 | dashboard/work-orders/page.tsx; portal/work-orders/page.tsx; filter-panel.tsx; tests | Filter labels update in both directions; selected IDs and open drawer state survive. | EN→AR→EN with selections and an open filter panel. | D01 |
| [ ] | T21: Repair analytics label/cache switching | 06,18,19 | analytics API and consuming charts; admin/page.tsx; tests | Data stays correctly scoped; displayed labels follow locale; translated caches vary by locale or use semantic values. | Switch without navigation; cold/reloaded locale and distinct cache payload tests. | L6 |
| [x] | T22: Correct dictionary quality and shared labels | 03,04 | translations.ts; dialog/password/load-failure/global-error components (individual slices) | Mixed 'غير applicable' removed; close/toggle/error names localized; password control keyboard-accessible. | Glossary/content review and rendered accessible-name tests. | L4,L7,L9,D06 |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 3 — Complete live domain slices

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T23: Finish requests and Kanban wording | 17,18,19 | requests-list.tsx; checklist-kanban.tsx; action-center-table.tsx; translations.ts | All platform labels, optional suffixes, enum values and failures localized; selected inputs persist on switch. | Both roles; create/review/sign/reschedule/error dialogs in EN/AR. | L8,D04 |
| [ ] | T24: Finish contracts and billing wording | 17,18,19 | contracts-list, billing-view, billing-work-orders-display, contract-work-orders-display (individual slices) | Labels, occurrences, statuses and money formatting use shared contracts. | Empty/populated/validation/payment states in both languages. | L8,D04 |
| [ ] | T25: Finish payment and detail dialogs | 17,18,19,11 | payment-submit-dialog; payment-verify-dialog; column-detail-modal; tests | Money/timestamps/placeholders/errors follow locale; upload completion works. | Submit/verify failure and success; switch while dialog remains open. | L8,D04,D06 |
| [ ] | T26: Localize documents and equipment | 17,18,19,10 | documents route; documents-list; equipment-list; branch-profile-card (split by surface) | Generated API defaults become semantic labels; user filenames/person names preserved; expiry units and raw types localized. | Seed generated defaults plus Arabic/English customer filenames; switch language. | L8,D02,D04 |
| [ ] | T27: Finish profile, team and branch surfaces | 17,18,19 | company-info-card; company/team/branch forms; client detail (one surface per slice) | Business-type/status labels and errors translate without overwriting existing local edits. | Applicable contractor/staff/client views and invalid submissions. | L8,D06 |
| [ ] | T28: Finish admin and marketing/auth surfaces | 17,18,19,22 | admin screens/tools; marketing install/download/contact; auth screens (one route per slice) | Inventory all secondary labels, placeholders, map title and failure states; every route gets evidence. | Cold and switched EN/AR, accessible names, error/empty states. | L4,L7,L8,D06 |
| [ ] | T29: Remove unsupported subscription promises | 02 | contractor-profile-card.tsx; company page tests | Use verified account data/actions or remove unsupported plan/date/payment controls; no fixed expiry claim. | Account fixture with missing/actual plan data; no inert buttons. | D07 |
| [x] | T30: Resolve remember-me behavior | 02 | login/page.tsx; auth session configuration if retained; tests | Remove unused checkbox unless session-duration behavior is intentionally implemented and secured. | Session persistence/expiry test if retained; form/accessibility test if removed. | F13 |
| [ ] | T31: Restore contractor appointment management | 17,18,19 | appointments-list.tsx; branch calendar integration; tests | Fetched appointments are visible; authorized create/detail/change controls open and work alongside work-order calendar. | Create→view→reschedule; client confirmation path remains usable. | F5 |
| [ ] | T32: Restore scoped activity panel | 17,18,19 | activity-panel.tsx; new activities route; permission/data helper; tests | Visible panel GET/POST resolves with scoped/paginated data and localized errors. | Contractor/client/staff access, post validation and forbidden branch tests. | D10 |
| [x] | T33: Retire or migrate legacy project calls | 02 | client-branch-requests.tsx; focused tests | No mount request targets nonexistent project routes. Any retained intended action uses current supported models. | Network/contract assertion and client request approval regression. | D11 |
| [x] | T34: Fix calendar and day boundaries | 19,20 | calendar-view.tsx; two work-order pages; tests | Month navigation cannot skip February; selected end day includes its entire intended day. | Jan31/leap-year/year transition and end-day time fixtures. | F1,D14 |
| [ ] | T35: Correct analytics aggregation and bounds | 06,19 | analytics/dashboard route; focused integration tests | Whole final day included; top-client ranking aggregates complete data rather than arbitrary first 500. | More than 500 records, month-boundary timestamps and tenant-isolated expected totals. | F2,F3 |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 4 — Saved messages and outputs

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T36: Define notification event and recipient contract | 02,17,18 | notification-service.ts; event registry; schema/migration if required; tests | All nine writers mapped to event/template/params/recipient/destination/dedupe policy. No-op/failed changes excluded. | Event inventory coverage and type-safe descriptor tests. | L1,D08 |
| [ ] | T37: Migrate notification writers safely | 36 | nine writer files (one writer per slice); persistence/outbox helper; tests | Required events persist with successful domain changes; retry does not duplicate messages; failures are observable. | Per-writer success/failure/retry fixture; transaction and delivery-failure tests. | L1,D08 |
| [ ] | T38: Repair notification links and inbox state | 36 | notification-service; notifications API; notification-center; notification-popup; tests | Links resolve to intended record/tab; total unread includes older records; refresh/read state consistent. | Over-50 mixed read/unread fixture; new event while header mounted; deep-link walkthrough. | F6,F7,F8 |
| [ ] | T39: Handle legacy notification rendering | 36,37 | legacy message adapter/migration; notification renderers; tests | Deterministically identified old messages render by locale; unknowns reported, originals preserved. | Dry-run old/new message fixtures and EN→AR→EN; no broad text guessing. | L1,D08 |
| [ ] | T40: Use recipient locale for emails | 15,17 | recipient preference schema/migration; email callers/links (per flow); tests | Recipient preference or explicit invitation locale controls subject/body/link, not acting admin locale. | EN admin→AR recipient and AR admin→EN recipient; fresh-browser link locale. | D09 |
| [ ] | T41: Localize generated record defaults | 18,19,26 | certificate/work-order/contract generators (one generator per slice); schema if needed; tests | New generated defaults have provenance/semantic template; existing user-authored values untouched. | Generate→save→view in both languages; historical dry-run with uncertain rows reported. | D03 |
| [ ] | T42: Repair live print output | 18,19,22 | work-order-print.tsx; request-quote-print.tsx; print routes; tests | Statuses/risk/units/dates/currency and zero values localize; Arabic shapes and direction render correctly. | Rendered page and print/PDF inspection in both languages with long content and zero price. | L3,F14,D05 |
| [ ] | T43: Repair exports and format choice | 18,19 | export-utils.ts; request export callers; tests | Headers, statuses, dates and money follow locale; PDF produces PDF or unavailable option is removed. | Inspect actual XLSX/PDF contents and file signatures; both roles/locales. | L2,F4,F14 |
| [x] | T44: Decide dormant PDF renderer fate | 02,42,43 | lib/pdf report files and any future callers; report tests | Remove confirmed obsolete files or require full locale-aware coverage before activating them. | Import/reachability recheck; render tests for any retained active renderer. | L2,L3 (dormant distinction) |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 5 — Direction, theme and external surfaces

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T45: Verify RTL interaction across shells/workspaces | 04,20,23,31 | layout/workspace/tab/Kanban components (one surface per slice); browser tests | Arabic navigation/tab/board order and keyboard movement agree; English reverses correctly; no double reversal. | EN/AR desktop/mobile keyboard and drag walkthrough, mixed-script fields. | L7,L8; RTL verification |
| [x] | T46: Repair mobile drawer accessibility | 04 | sidebar-shell.tsx; drawer primitive; tests | Closed links cannot receive focus; open menu traps/restores focus and closes with Escape. | Keyboard tab sequence, Escape and focus restoration in EN/AR. | F10 |
| [ ] | T47: Complete theme and toast behavior | 04,45 | known white app cards/drag preview; root toaster wiring; tests | Dark surfaces remain dark; paper/signature exceptions remain intentional; toasts use chosen theme/direction. | EN/AR × light/dark screenshots including dialogs and drag overlay. | F9,F11 |
| [ ] | T48: Verify map and installed-app locale | 04,28 | address-picker/provider setup; manifest route/assets if needed; tests | Provider language follows supported locale behavior; manifest/install wording strategy is explicit and tested. | Actual provider language switch, fresh load and install/reinstall behavior; external limits recorded. | L7,D16 |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Phase 6 — Closure and local review

| Done | Task | Depends on | Likely files / scope | Acceptance | Verification | Audit IDs |
|---|---|---|---|---|---|---|
| [ ] | T49: Close the evidence ledger | All applicable implementation tasks | coverage ledger; browser/output evidence; audit disposition table | Every S/L/F/D item has fixed evidence or explicit open status; no candidate silently disappears. Arabic glossary/content reviewed. | Independent diff-to-ledger review; guard negative controls and complete route/state matrix. | All |
| [ ] | T50: Run release checks and prepare local review | 05,13,16,39–49 | verification report; isolated migration fixtures; local review instructions | Typecheck/lint/unit/component/integration/browser/build pass; legacy migration trial recorded; safe role accounts ready locally. No push. | Fresh install/build, all configured checks, migrations from old fixture state; user local review before any release. | All |

- [ ] Phase checkpoint: focused tests/typecheck/build results recorded; completed behaviors reviewed against the audit; failures and remaining work remain explicit.

## Finding-to-task index

| Findings | Tasks |
|---|---|
| S1 / S2 / S3 / S4 / S5 | 06 / 07 / 16 / 08–10 / 14–15 |
| L1 / L2 / L3 / L4 | 36–39 / 43–44 / 19,42,44 / 17,22,28 |
| L5 / L6 / L7 / L8 / L9 | 18 / 21 / 22,28,45,48 / 18,23–28,45 / 22 |
| F1 / F2 / F3 / F4 / F5 | 34 / 35 / 35 / 43 / 31 |
| F6 / F7 / F8 / F9 / F10 / F11 | 38 / 38 / 38 / 47 / 46 / 47 |
| F12 / F13 / F14 | 05 / 30 / 19,42–43 |
| D01 / D02 / D03 / D04 / D05 / D06 | 20 / 26 / 41 / 19,23–26 / 18,42 / 22,25,27–28 |
| D07 / D08 / D09 / D10 / D11 / D12 | 29 / 36–39 / 40 / 32 / 33 / 11–13 |
| D13 / D14 / D15 / D16 | 09–10 / 19,34 / 17 / 48 |

## Final sign-off

- [ ] All findings reconciled against both audit documents, not just this task index.
- [ ] All reviewed exceptions have a narrow rationale; user content preserved.
- [ ] No known platform-owned wrong-language text in required verified states; old-data uncertainty reported separately.
- [ ] Arabic wording reviewed for meaning and terminology, beyond key parity.
- [ ] Actual browser, export, access, upload and notification evidence attached.
- [ ] Migrations trialed with existing data; rollback/recovery procedure recorded.
- [ ] Production-branch checks and dependency results verified.
- [ ] Local review instructions and safe account roles provided to the user.
- [x] User explicitly authorized fixing and pushing on 27 September 2026. Target: production.


## Execution evidence for checked tasks

T18: export-locale tests check all schema display enums. T22: i18n and localization-components tests cover shared labels, accessible names and switching. T30: unused checkbox removed from login. T33: removed project mount fetch/obsolete dialogs; no project API calls remain. T34: format-boundaries tests exercise end-of-day and month-end arithmetic. T44: no-import source/scripts/tests search before removing five dormant renderers. T46: mobile-sidebar tests verify closed links, Escape and focus restoration in EN/AR; real-browser appearance remains T45/T49. Other partially implemented tasks stay unchecked; see the release report.
