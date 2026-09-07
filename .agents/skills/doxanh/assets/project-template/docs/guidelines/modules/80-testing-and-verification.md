
## 13. Testing and verification

The sections below define the available coverage, not a command list to run
after every edit. `VERIFY-SCOPE-001` selects the smallest complete affected
scope. A small copy/layout fix needs the affected rendered state and relevant
static checks; do not write tests that merely mirror wording or implementation.
A logic fix needs meaningful regression proof of its changed behavior. Run
required repository gates, inspect broad wrappers before using them, reuse
current evidence, and stop once the selected scope passes.

Select runners by active implementation: browser/UI suites for `nuxt-web`,
direct HTTP and owned server/data suites for `nuxt-api`, and Flutter/Dart plus
native integration/device proof for `flutter-native`. Native-only work does
not require Playwright browsers, Nuxt builds, or Docker proof of native UI.
Client-only projects test the documented API boundary without fabricating a
backend or claiming to verify an external service's internal persistence.

### 13.1 Test layers

| Layer | Standard coverage |
| --- | --- |
| Static | ESLint, TypeScript, Nuxt typecheck, dependency and secret scanning. |
| Unit | Pure domain rules; Zod valid/invalid, unknown-key, coercion, transform, and issue-mapping cases; utilities; composables; Pinia stores; services with narrow fakes. |
| Component | Vue components, form behavior, states, keyboard interaction, and shadcn-vue composition. |
| Integration | Vitest/Nuxt tests for Nitro routes, auth, PostgreSQL/Drizzle, Redis adapters, BullMQ producers/processors, conditional realtime gateway/protocol, and migrations. |
| API automation | Playwright `APIRequestContext` sends direct HTTP requests to a running application and verifies transport, envelope, result codes, authorization, tenant isolation, persistence, and side effects. |
| End-to-end | Playwright drives real rendered UI through complete end-user workflows across actors, permissions, states, desktop browsers, and mobile projects. |
| Native mobile | Dart unit tests, Flutter widget/integration tests, and native platform-flow tests from Section 9. |
| Accessibility | `@axe-core/playwright` automation plus keyboard, screen-reader-oriented semantics, zoom, contrast, and reduced-motion manual review. |
| Security | Default-deny, wrong-role/scope/owner/state/capability, revocation, impersonation, IDOR, CSRF, rate-limit, session, upload, and direct-request regression tests. |
| Performance | Core flows, query plans, load, queue throughput, conditional realtime connection/fanout/reconnect load, image behavior, bundle analysis, and Web Vitals. |
| Recovery | Backup restore, failed migration, worker/gateway restart, retry/idempotency, cache loss, reconnect/refetch, and dependency outage drills. |

### 13.2 Vitest rules

- Use Vitest with native ESM and TypeScript.
- Keep Node and browser/component projects separate when their environments
  differ.
- Keep tests deterministic: inject or freeze clock, random, UUID, locale, and
  timezone inputs when behavior depends on them. Do not use arbitrary real-time
  sleeps to wait for a condition.
- Date/time tests must include UTC-to-effective-zone conversion across a date
  boundary, 24-hour and 12-hour presets, month/minute token regression,
  invalid IANA zone and format denial, date-only non-conversion, system/scope
  precedence, SSR hydration equality, authorized setting changes with activity
  evidence, DST gap/overlap cases for any supported DST zone, and localized
  formatter-failure behavior that never reveals a raw temporal value.
- Mock at external boundaries, not the unit under test.
- Prefer factories and fixtures over large snapshots.
- Use fake timers only when time behavior is the subject of the test; advance
  them explicitly and restore real timers in cleanup.
- Restore mocks, timers, globals, and environment changes after every test.
- Block unapproved real network calls in unit/component projects. Real
  PostgreSQL, Redis, browser, and provider-stub tests belong to their named
  integration environments.
- A snapshot or visual diff may support an assertion but must not be the sole
  proof of permissions, actions, form validation, accessibility semantics, or
  durable behavior.
- Committed `.only` is prohibited. A skip must have the owner, tracking
  reference, reason, and expiry/platform condition required by Section 14.2.
- Test types for important public contracts where useful.
- Run coverage as a risk signal; do not optimize for a percentage while critical
  paths remain untested.

### 13.3 Playwright browser and API automation

Playwright Test is mandatory for the Nuxt web and API profiles. It is the
browser-automation runner for web and black-box HTTP API test client. An API-only
service uses its request fixture without installing browser binaries or axe;
only an active web profile needs browser and accessibility projects. Do not add
Cypress, Selenium, Puppeteer, or another overlapping end-to-end runner without
an ADR that replaces this contract. Use the latest mutually compatible stable
`@playwright/test` and `@axe-core/playwright` versions selected under Section
3.8, commit `playwright.config.ts`, and install the pinned Playwright browser
binaries in CI.

Before authoring or restructuring automation, follow Section 17.1's Playwright
skill discovery and installation guidance. Read the official best-practices
and fixtures references in Section 18 for test organization and reusable
setup/teardown, applying the workflow and scope rules below.

Required suites:

| Suite | Boundary | Required proof |
| --- | --- | --- |
| `api` | Playwright `APIRequestContext` → deployed/running HTTP boundary → real application dependencies | Exact API contract, authorization, persistence, idempotency, concurrency, activity, queue/event effects, and safe failures. |
| `e2e-smoke` | Browser → rendered UI → API → durable/downstream state | Small critical vertical workflows in desktop Chromium plus at least one representative mobile UI/UX compatibility check. |
| `e2e` | Same continuous boundary as smoke, with full released behavior | Complete important actor workflows in desktop Chromium; focused UI/UX compatibility in Firefox, WebKit, Mobile Chrome, and Mobile Safari. |
| `a11y` | Rendered routes and revealed interactive states | Automated WCAG A/AA-detectable violations plus named manual checks that automation cannot prove. |

#### Browser workflow rules

Use this division even during full regression:

| Profile | Default responsibility |
| --- | --- |
| One desktop Chrome/Chromium project | Functional workflows for the selected scope, including changed actions, validation, permissions and durable effects. Full regression covers all in-scope functions here. |
| Supported Firefox and Safari/WebKit projects | Focused UI/UX compatibility on affected representative screens: layout, overflow, themes, text, keyboard/focus, navigation and opening/closing relevant controls. |
| Supported mobile profiles | Representative responsive/touch/keyboard/overlay checks for affected UI; do not replay the desktop business suite per device. |

Keep functional and UI/UX tests separately selectable with explicit project
names and test paths/tags. Each project has `testMatch`/`testIgnore` or equivalent
selection so `playwright test` cannot silently run all business cases in all
engines. Direct HTTP API tests run once outside browser project multiplication.
The exact configured engine/channel is part of evidence: Playwright WebKit and
device emulation are not proof of shipping Safari or a physical iPhone.

Expand functional coverage to another browser only for an explicit request
naming that coverage, an affected browser-specific API/behavior (such as
cookies/auth redirects, downloads, printing, camera or clipboard), or an
observed browser failure. Name the project, risk and smallest relevant cases.
An ordinary “full test” request expands workflow coverage in the primary
project; it does not request every workflow in every engine. UI/UX checks may
use interactions to reveal the tested state, but must not hide a duplicated
business mutation suite behind a compatibility label. Do not multiply every
viewport, theme, locale, actor and engine when representative coverage proves
the affected boundary.

- Desktop Chromium owns functional browser automation: mutations, permission
  presentation, confirmation, realtime/reconnect, printing, and durable effects.
  Other released browser/device projects own focused UI/UX compatibility for
  representative public and role surfaces, navigation, responsive layout,
  overflow, themes, and touch targets. Do not duplicate every business mutation
  in every engine. Exhaustive authorization remains in direct-API, policy, and
  integration suites.
- Test user-visible behavior. Use `getByRole`, `getByLabel`, visible text, and
  other accessible locators first. Use a stable `data-testid` only when no
  user-facing contract can identify the element. CSS/XPath selectors and DOM
  implementation details are prohibited in workflow tests.
- Use Playwright locators, auto-waiting, and web-first assertions. Arbitrary
  `waitForTimeout`, sleep, polling loops without a bounded domain condition,
  and force-clicking around product defects are prohibited.
- A release-gate workflow must use the real application API, PostgreSQL, and
  required Redis roles. Network interception or route mocking is allowed only
  in a separately named client-fallback/provider-edge suite; it cannot satisfy
  end-to-end, persistence, permission, tenant, queue, or realtime proof.
- Third-party systems not owned by the project may use a contract-faithful
  local stub at the approved adapter boundary. The evidence must name the stub
  and must not call that provider interaction production-proven.
- Fixture/API setup may create preconditions, but every action claimed as an
  end-user action must be performed in the browser. Reports must identify
  `fixture/API-seeded setup` separately from `browser-driven action`.
- Verify durable mutations beyond a toast. Assert the rendered outcome and,
  through an approved test helper or public/read API, the resulting database
  fact, activity record, job/outbox/event, or downstream state required by the
  workflow.
- Every create, update, and delete workflow proves both branches: cancel sends
  no mutation request; confirm sends exactly one request while disabled/loading
  state prevents double submission.
- Every important rendered action is exercised at least once in its allowed
  state and, where applicable, its disabled/denied state. Assert the exact
  destination, request count, visible state, focus behavior, and durable effect;
  opening a menu/dialog or observing a button is not proof that it works.
- Important long collections use enough deliberately uneven records to prove
  search, category/group discovery, deterministic sorting, pagination,
  back/forward restoration, responsive item alignment, and empty/error states.
- Use independent browser contexts and unique scope/actor/data identities
  per test or parallel worker. Tests must run alone, in any order, and in
  parallel without shared mutable seed state.
- Generate authentication state per actor/role in test setup. Never reuse an
  administrator session for a lower-privilege proof. Authentication-state files
  and credentials are ignored by Git, created per environment, access-limited,
  and excluded/redacted from artifacts.
- Page/feature objects may centralize stable user operations and assertions;
  they must not hide business expectations, add sleeps, or become a second
  application abstraction.
- The release plan selects browser profiles from the affected screen and flow
  contracts. It always includes the project's small critical release smoke and
  adds desktop/mobile compatibility only for affected surfaces or shared UI
  foundations. Device emulation proves the configured browser/viewport
  contract, not physical-device behavior.
- The full released workflow matrix runs only for an objective full-regression
  trigger and at the project's separately approved periodic baseline. A scoped
  release must still prove every affected workflow and the critical smoke, but
  it records unrelated actors, screens, and browser profiles as excluded rather
  than running them for ceremony.
- With framework retries disabled, capture original-attempt failure traces
  using `retain-on-failure` or equivalent bounded runner retention; do not use
  `on-first-retry`, which would produce no trace. Keep screenshots/video on
  failure as bounded CI artifacts. Redact tokens, cookies, authorization headers,
  personal data, payment data, and secrets before retention or sharing.
- Playwright framework retries are zero. The containerized matrix orchestrator
  may perform at most one infrastructure-only retry for diagnostic capture
  under the next rule. A pass only after that retry is `flaky`, not passing
  release evidence; automation must surface it and the skip/exception rule
  from Section 14.2 applies.
- A test assertion, expectation failure, timeout, product crash, or unknown
  failure must fail immediately and must never be reclassified as
  infrastructure merely to obtain a retry. Only an exact allowlisted
  browser-process termination may receive one diagnostic retry in a fresh
  browser process/container. That attempt does not replace the failed attempt.
- Persist clean evidence per released browser profile so a long matrix can
  resume after infrastructure interruption without discarding unrelated clean
  work. Each profile record must be bound to the exact maintained-content
  fingerprint and Git revision when available; name the exact configured
  project, cases/chunks, attempts, outcomes, timestamps, and redacted output
  digests. Reuse is allowed only for complete, single-attempt, clean profile
  evidence with exact current planned coverage. A partial chunk or smoke run
  cannot replace a broader selected scope; a complete focused profile can
  satisfy its declared scope. Stale records, missing selected cases, duplicate
  profiles, failures, and retry-only results cannot satisfy release evidence.
- The aggregate browser gate passes only when every browser profile selected by
  the release plan has exact current clean evidence. A later complete clean
  rerun of one selected profile may replace its failed/flaky record; the
  aggregate must be rebuilt and revalidated before the verification report can
  pass.
- Release proof runs against a production build or the same immutable
  container image intended for release, not only a Nuxt hot-reload server.
  Local interactive development may reuse an explicitly configured local
  server. Local-only evidence cannot satisfy a production claim; the named
  target still requires deployed-version and focused live proof.

#### Direct API automation rules

The five-field envelope/status assertions below apply to owned first-party
JSON application APIs. External providers and registered protocol-specific
endpoints are tested against their documented contracts and approved adapter
mapping; never rewrite or mock a provider into the internal convention. Keep
signature/raw-body, bodyless response, and delivery/acknowledgement proof where
those registered boundaries require it.

- Use isolated Playwright `APIRequestContext` instances for public,
  unauthenticated, and each authenticated actor/scope. Share browser cookies
  only in a test whose purpose explicitly verifies a browser-session boundary.
- Call the running `/api/...` endpoint over HTTP. Do not import a route handler,
  use case, repository, or Zod schema into a black-box API assertion to compute
  the expected result.
- Assert the exact five-field response envelope: `success`, `code`, `message`,
  `data`, and `request_id`; reject missing and unexpected top-level fields.
- Prove `HTTP 200 + success: true + code: 0` for real success and
  `HTTP 200 + success: false + registered non-zero code` for every expected
  validation, domain, permission, rate, and conflict result. Separately prove
  unexpected failures use HTTP 500 with the safe internal envelope and ERROR
  telemetry.
- Cover valid, missing, null, unknown, boundary, malformed, malicious,
  oversized, and duplicate input; tenant/host/actor mismatch; expired and
  revoked session; CSRF/origin; pagination limits/cursors; idempotency replay;
  stale version; and relevant concurrent requests.
- For each protected optimistic update, send two independently authenticated
  requests from the same starting revision and synchronize them at the actual
  write boundary where the harness permits. Assert one winner, handled stale
  loser, final revision/state, no duplicate activity/outbox/job effects, and no
  cross-scope existence leak. Sequential requests are only stale-version proof,
  not race proof.
- Assert `request_id` propagation/correlation, non-zero WARN observability, and
  safe redaction without coupling the test to volatile log wording.
- Verify the database/activity/outbox/job/realtime consequences and absence of
  partial writes for handled results and unexpected rollbacks. HTTP response
  assertions alone are insufficient proof of a durable command.
- Keep API test data isolated and deterministic. Cleanup must be scoped to
  test-owned identifiers; never run broad deletion against a shared or
  production database.

#### Accessibility automation

- Use one shared `@axe-core/playwright` fixture with the approved WCAG A/AA tag
  set and attach a redacted violation report on failure.
- Scan every important routed page plus material states revealed by dialogs,
  drawers, validation, menus, loading completion, permission results, and
  dynamic updates.
- Do not suppress a violation globally. A temporary exclusion names the exact
  rule/target, reason, owner, tracking reference, and expiry.
- Automated scans cannot satisfy keyboard, focus order/restore, screen-reader
  meaning, zoom/reflow, contrast-in-all-states, touch, or reduced-motion
  acceptance by themselves. Keep those manual evidence rows in the screen
  contract and release review.

### 13.4 Database and queue tests

- Run integration tests against real PostgreSQL and Redis services.
- Apply migrations from empty and production-like states.
- Run `docs:data:check`, then prove implemented DATA/QRY/TX/MIG paths resolve to
  the actual Drizzle schema, committed migrations, repositories, and tests.
- Verify named constraints, FK update/delete behavior, transaction rollback,
  optimistic conflicts, and important concurrency invariants.
- Attempt direct cross-tenant inserts/updates/joins against every tenant-aware
  relationship and prove composite FK/unique rules, RLS, and server enforcement
  produce the documented result without a partial side effect.
- Execute important TX rows through commit, handled rejection, unexpected
  rollback, retryable serialization/deadlock, idempotent replay, and duplicate
  delivery cases; verify domain rows, `activity_logs`, outbox/job handoff, and
  cache invalidation stay consistent.
- Test each JSON contract with its Zod schema and PostgreSQL shape checks,
  including unknown keys, version compatibility, nulls, size/depth/count
  limits, redaction, and promoted-query fields.
- Connect as every production runtime PostgreSQL role and prove allowed and
  prohibited operations, schema ownership, default privileges, and safe
  `search_path`.
- Verify tenant-safe queries and every documented RLS policy or compensating
  application enforcement with wrong-tenant direct requests.
- Exercise expand/backfill/contract compatibility, migration drift, resumable
  backfills, partial non-transactional failure recovery, old/new app and worker
  compatibility, and production-like query plans.
- Exercise each important QRY row with representative tenant skew and row
  volume; verify deterministic pagination, maximum limits, serving index/plan,
  latency budget, and a safe plan-regression review boundary.
- Test connection-budget and timeout assumptions under the intended replica
  counts, including pool saturation, statement cancellation, lock waits, long/
  abandoned transactions, and graceful process shutdown.
- Verify cache loss does not corrupt durable behavior.
- Verify producer, worker, events, flow, and scheduler constructors resolve the
  same canonical environment prefix and registered queue name. Prove separate
  environment prefixes cannot see or operate each other's jobs.
- Verify an environment mismatch, unknown envelope version, missing tenant ID,
  or cross-tenant record fails before a side effect and emits the registered
  terminal event.
- Unit-test every job, deduplication, durable-idempotency, and scheduler ID
  builder for stable output, allowed characters, colon rejection, bounded
  length, hash behavior, tenant separation, job-name separation, and collision
  fixtures.
- Verify a duplicate custom `jobId` is suppressed while the original job
  exists, then prove removal/retention permits reuse and durable PostgreSQL
  idempotency still prevents a duplicate business effect.
- Verify each selected deduplication mode, TTL, replacement rule, tenant scope,
  telemetry event, and restricted manual-removal path.
- Verify job retry, stalled recovery, replay, duplicate delivery, scheduler
  overlap, durable idempotency, failure retention, and graceful worker shutdown.
- Load-test multi-tenant fairness, backpressure, priority starvation, tenant-
  local ordering controls, queue depth, oldest-job age, and recovery thresholds
  where those risks apply.
- Verify scheduler deployment is repeatable, does not duplicate schedules,
  reports drift, and removes only explicitly owned obsolete scheduler IDs.
- Do not call an in-memory mock proof of Drizzle, PostgreSQL, Redis, or BullMQ
  integration.

### 13.5 Realtime tests

When realtime is active, select only the approved transport, owned process
roles, and released clients. The WebSocket frame/ticket/gateway/Redis cases
below apply to WebSocket deployments; SSE uses its documented HTTP auth,
event framing, disconnect/resume/refetch, limits, and cancellation cases.
Flutter-specific cases apply only when that client consumes the transport.

- run shared valid/invalid JSON fixtures through the gateway Zod schemas, Nuxt
  client types, and generated/reviewed Dart model tests
- verify every frame kind/version, maximum size, unknown field/version,
  malformed JSON, unsupported binary frame, rate limit, and close-code contract
- test ticket expiry, single use/replay, logout/revocation, wrong actor/tenant,
  unauthorized subscription/command, origin policy, and direct protocol bypass
- prove durable commands call the same use case as HTTP and preserve
  authorization, idempotency, transaction, audit, request ID, result code, and
  warning/error semantics
- use real dedicated Redis in integration tests to prove delivery between at
  least two gateway replicas, while separately proving Pub/Sub interruption is
  recovered through reconnect/resubscribe/refetch
- test duplicate, stale, out-of-order, missing-revision, offline, background,
  server-draining, expired-session, app-version, and protocol-version behavior
  in each active supported client
- load-test connection churn, steady connections, burst fanout, hot tenants,
  slow consumers, bounded buffers, heartbeats, Redis latency/outage, rolling
  deploy, gateway crash, and reconnect storms
- prove independent API and gateway scaling signals, health, drain, and shutdown
  in the target load balancer/runtime
- keep compression off in the baseline load test; if enabled, compare CPU,
  memory, latency, bandwidth, and decompression-abuse limits

An echo-server test alone is not realtime integration proof. A screenshot of a
live-looking UI does not prove cross-replica delivery, authorization, recovery,
or durable state.

### 13.6 UI evidence and workflow proof

Use one current evidence bundle with stable filenames and an index:

```md
## Screen review matrix

| Screen | Route | Actor | Viewports | Themes | States | Interactions | Review level | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Workflow proof matrix

| Workflow | Trigger | Server state change | Confirmation | Downstream proof | Environment | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

Review levels:

- `Visual`: appearance only
- `Interaction`: behavior verified on the target platform
- `Data`: saved state verified
- `End-to-end`: continuous UI → server → DB/queue → downstream proof
- `Not tested`: in scope, reason and follow-up required

Do not combine screenshots from unrelated scenarios and describe them as one
continuous flow.

### 13.7 Nuxt/server command surface

Every Nuxt project exposes the applicable scripts below. A platform-specific
wrapper such as Make may call them, but preserves applicable canonical names.
Record inactive profile/capability commands as N/A in the command registry;
do not create fake success scripts, workers, databases, or browser projects to
satisfy this catalog. Flutter-only projects use native equivalents for the
shared documentation, planning, freshness, and release obligations.

| Script | Responsibility |
| --- | --- |
| `dev` | Start Nuxt development. |
| `typecheck` | Nuxt/Vue TypeScript validation. |
| `lint` / `lint:fix` | Check/fix source rules. |
| `test:unit` | Fast Vitest unit suite. |
| `test:integration` | PostgreSQL, Redis, route, and queue integration suite. |
| `test:component` | Browser/component tests. |
| `test:api` | Playwright direct-HTTP API contract and black-box integration suite. |
| `test:e2e:smoke` | Small Playwright desktop-Chromium functional suite plus a representative mobile UI/UX compatibility check for fast feedback. |
| `test:e2e` | Complete desktop-Chromium functional profile plus focused Firefox, WebKit, Mobile Chrome, and Mobile Safari UI/UX profiles. |
| `test:a11y` | Playwright plus `@axe-core/playwright` automated accessibility suite. |
| `deps:check` | Validate the Section 3.8 approved-dependency registry, selected lockfile, deprecated/forbidden/duplicate-concern packages, license/security policy, and unused direct dependencies. |
| `i18n:check` | Validate locale catalogs, supported/default locale policy, missing/extra keys, placeholder parity, and project-specific locale-source contracts. |
| `standards:check` | Enforce stack exclusivity, layer/import boundaries, forbidden client/server crossings, temporal-presentation boundary/raw-fallback rules, Tailwind application allowlist, generated-code drift, focused-test/TODO exception format, and other machine-checkable project rules. |
| `docs:book:generate` | Idempotently create missing skeletons and update marked manifest-derived regions. |
| `docs:book:check` | Enforce the complete lifecycle, minimum-content, manifest, schema, header, evidence, ordering, placeholder, and navigation contract from Section 4.15. |
| `docs:links:check` | Validate repository-relative documentation and evidence links. |
| `docs:traceability:check` | Validate stable IDs and high-risk requirement coverage. |
| `docs:data:check` | Validate the database chapter catalogs, per-table contracts, stable references, tenant/activity coverage, implementation paths, and evidence status. |
| `docs:ui:check` | Validate the active screen registry and strict screen/flow contracts from Sections 4.8 and 8.9. |
| `db:generate` | Generate reviewed Drizzle migration SQL. |
| `db:migrate` | Apply committed migrations. |
| `db:check` | Verify applied migration history, schema drift, required objects/constraints/policies, and runtime-role access against the selected environment. |
| `worker` | Run BullMQ workers. |
| `realtime` | Run the dedicated WebSocket gateway when realtime is active. |
| `scheduler:sync` | Idempotently upsert approved job schedulers. |
| `build` | Production Nuxt build. |
| `preview` | Run the production build locally. |
| `release:plan` | Compare the exact accepted/deployed base revision with the candidate and produce the risk-scoped release commands, universal release baseline, target environment, live checks, exclusions, and full-regression decision. |
| `verify` | Aggregate the current candidate release evidence selected by `release:plan`; it does not rerun unrelated suites. |

Every release runs one phase-aware universal baseline. Before deployment it
checks the contract, candidate and lockfile integrity, secret/configuration
shape without revealing values, production build or immutable-image creation,
image/runtime smoke, dependency-readiness preflight, and recovery/rollback
preconditions. After deployment it confirms the exact deployed revision/image,
live dependency health, and the target's small critical smoke. Add lint,
typecheck, documentation, dependency, migration, database, security, API,
browser, accessibility, queue, realtime, files, payment, printing, performance,
recovery, and manual proof only when the candidate diff, a demonstrated
dependency, a focused failure, or an objective full-regression trigger selects
that boundary. Full-regression mode runs the complete active command set that
is eligible under Section 13.3's browser policy; it does not enable unapproved
secondary-browser functional commands.

#### 13.7.1 Executable rule and completion contract

Normative prose is not an enforcement mechanism by itself. Every generated
project must materialize applicable **must** and **must not** rules as
policy-as-code so that forgetting a rule causes a failed command instead of a
late review discovery.

The project must maintain a versioned machine-readable gate manifest in
`quality/project-gates.json`, or an equivalently validated format. It must:

- give each material rule a stable ID such as `GOV-EXEC-001`,
  `UI-RESP-001`, `API-CONTRACT-001`, or `DATA-MIG-001`
- link the rule to its canonical guideline or project-book source
- state severity, active profile, applicability, and changed-path selectors
- classify evidence as `automated`, `manual`, or `not_applicable`
- for `automated`, name canonical package scripts and maintained evidence files
- for `manual`, keep only the stable owner, review criteria, canonical evidence
  source, and release impact in the tracked manifest; store candidate status,
  reviewer, date, immutable revision/fingerprint/image digest, and hashed
  evidence references in an ignored or external release-evidence record
- for `not_applicable`, record the exact reason and activation trigger
- map every screen registry entry marked `Implemented` to maintained browser,
  native integration/device, API, component/widget, accessibility, or approved
  manual evidence for that screen's platform
- define deterministic command order for changed-scope, risk-scoped release,
  and full-regression verification

Reserve these baseline rule IDs in every newly generated project. An applicable
row maps to automated/manual evidence; a conditional row may be
`not_applicable` only with the Section 1.1 reason and activation trigger:

UI IDs express shared user outcomes with platform-specific realizations. The
web details in the table use Sections 8 and 7.9; native rows use GDL-053's
widgets, logical-pixel targets, focus/semantics, temporal adapter and Flutter
evidence. Do not apply CSS pixels, shadcn-vue components, browser runners or
Day.js format strings as native implementation requirements. API-only services
mark UI rules N/A rather than generating a screen to satisfy them.

| Rule ID | Required contract |
| --- | --- |
| `DOC-BOOK-001` | Manifest-driven complete project book, canonical ownership and vocabulary, chapter metadata/navigation, minimum-content contracts, cross-document links, stable traceability, and executable integrity checks. Stateful workflows document every state and transition rather than expanding only one exceptional state. |
| `DATA-DOC-001` | Human-readable database contract reconciled with the canonical schema: complete table catalog; DATA/scope/lifecycle/TX/QRY/MIG coverage; per-table what/why/when/how, full field dictionaries, relationships, constraints, indexes, lifecycle, examples, and evidence; every current table and column checked against source. |
| `UI-VISUAL-001` | Default approved component system, semantic tokens, light/dark/system themes, layout-only utility CSS, icon/image rules, and no page-local visual system. |
| `UI-DENSITY-001` | Compact readable visual density, natural-width desktop actions, deliberate mobile width, at least 44×44 CSS-pixel phone targets, and at least 8 CSS pixels between adjacent targets where accidental activation is possible. |
| `UI-AUDIENCE-001` | Correct audience/surface and server-authorized actor/scope/capability/state projection for records, fields, actions, options, facets, suggestions, counts, summaries, existence signals, links, exports, and drill-downs; bounded cross-boundary accountability with identity redaction; shared components never become authorization boundaries. |
| `UI-ACTION-001` | Every important rendered action and overlay close path has a real outcome and interaction proof; form/overlay footers use the shared action-only composition and deterministic safe-to-commit order from Section 8.11.2; actionable feedback uses the content-led icon/body plus separate responsive action-only composition from Section 8.11.3. |
| `UI-COPY-001` | User-task copy, glossary-owned canonical actor/scope/entity/state/action vocabulary across every surface and locale, registered presentation of technical keys, effective-value wording, and no competing synonyms, raw/humanized keys, implementation details, policy narration, internal rationale, developer instructions, or dummy content on any released surface. |
| `UI-CONTROL-001` | Choice controls follow Section 8.12: `Select` is limited to at most nine short, bounded, easily scanned choices; ten or more choices, remote catalogs, or name/code lookup use the searchable default `Combobox` with loading, empty, disabled, clear, keyboard, touch, component, and rendered workflow proof. |
| `UI-COLLECTION-001` | Search/group/filter/sort/pagination, stable item anatomy, restoration, and uneven-data proof for growing collections. |
| `UI-RESP-001` | Phone-first continuous reflow, bounded scroll ownership, theme, zoom, keyboard, touch, and required viewport evidence. |
| `UI-STATE-001` | Loading, empty, populated, denied, expired, conflict, unexpected-failure, destructive, pending, and recovery states are designed and exercised where applicable. |
| `UI-ACCESS-001` | WCAG 2.2 AA semantics, names, focus, keyboard, reflow, contrast, live regions, touch, reduced motion, component evidence, and rendered accessibility evidence. |
| `TIME-PRESENTATION-001` | UTC instant storage/transport, canonical local mutation values, server-authoritative scope/system IANA resolution, one shared client presentation context and formatter, no browser-local formatting or raw display fallback, localized invalid state, and executable source/component/API evidence. |
| `DATA-CONCURRENCY-001` | Scoped revision predicate, handled stale result, winning-only effects, UI recovery, and independent-client race proof. |
| `DATA-REFERENCE-001` | Referenced-record lifecycle analysis, explicit move/preserve/block/cascade classification, authoritative preflight, valid replacement resolution, concise no-suitable-target recovery guidance without an invented fallback, atomic revalidation and mutation, preserved history, winning-only effects, and rendered recovery proof. |
| `AUTH-SESSION-001` | Exact per-actor credential, session/device counting, replacement, recovery, revocation, isolation, and race behavior. |
| `ENTRY-SHARE-001` | Conditional canonical entry registry, locator/proof separation, host trust, revocation, and share/open/QR proof. |
| `COMMERCIAL-001` | Conditional offering-versus-assignment model, effective period/status/limits, versioning, authorization, and audit. |
| `VERIFY-SCOPE-001` | Risk-scoped verification records change impact, selected and excluded evidence with reasons, safe-fallback review, stepwise expansion, release base/candidate/target context, universal release baseline, and objective full-regression triggers. Release status alone never selects every suite. |
| `VERIFY-CLAIM-001` | Completion and readiness answers lead with an unambiguous scope-bound yes/no; scope-complete requires current candidate and environment evidence with no failed, skipped, stale, pending, not-tested, or open boundary and never implies zero defects. |

`contract:check` must reject a missing applicable baseline row, a duplicate ID,
an active capability marked N/A, an applicable `UI-*` baseline rule below blocking
severity, or a rule that names no executable/manual evidence path.

The repository must expose and enforce:

| Script | Contract |
| --- | --- |
| `contract:check` | Validate the gate-manifest schema, unique rule IDs, canonical sources, root `AGENTS.md`, applicable profiles, required package/Make/CI surface, command references, screen-evidence coverage, and manual/N/A evidence structure. |
| `rules:plan` | Before editing, accept explicit anticipated project-relative paths and merge them with current maintained changes; after editing, inspect the actual worktree. In both modes print the exact applicable rule IDs, automated commands, and unresolved manual evidence. Unknown or uncovered maintained paths select the safe full-rule fallback. |
| `release:plan` | Require an exact accepted/deployed base revision, candidate revision, and target environment; inspect their complete diff, merge all affected verification slices with the universal release baseline, record exclusions, and fail closed when impact or baseline identity cannot be resolved. Release status alone must not select full regression. |
| `check:fast` | Run the deterministic fast feedback subset. It must include `contract:check`; it is not release evidence. |
| `verify:changed` | Run the union of automated gates selected by `rules:plan`, fail on missing evidence mappings, and write a changed-scope verification report. |
| `verify:automated` | Refuse a dirty maintained checkout, require `release:plan`, reuse current content-identical changed evidence, run the pre-deployment universal baseline and only missing selected automated release gates, and write revision/fingerprint/image/environment-bound candidate evidence before dependent human approval. In full-regression mode, run the complete active command set eligible under Section 13.3's browser policy. |
| `evidence:init` | After the candidate image exists, initialize an ignored/external evidence bundle bound to the exact revision, maintained fingerprint, and immutable image digest; refuse overwrite. |
| `evidence:check` | Fail when an applicable release-blocking gate is missing, pending, stale, malformed, unowned, targets another candidate, or lacks a regular non-symlink evidence file with a matching SHA-256 digest. |
| `verification:check` | Confirm the latest successful report matches the current maintained-project content fingerprint. For `changed` evidence, a commit-only transition with identical content remains valid; candidate `release` and `full` evidence also require the exact revision. |
| `verify` | Perform the fast final aggregation without rerunning suites: require the current candidate `release` report, or a `full` report when full regression was selected, complete applicable candidate-bound manual evidence, and deployed-target evidence for the post-deployment universal baseline plus affected live workflows. |

`check`, if retained for compatibility, must alias `check:fast`; it must never
be described as the release gate. `make release-plan`, `make verify-changed`,
`make verify-automated`, and `make verify` must invoke the canonical scripts in
the documented environment. Automated runners may produce changed/release/full
artifacts, but a release system must supply the applicable external manual
evidence before the aggregate gate. The required automated status must contain
the universal baseline and every selected affected boundary; a smoke-only job
is insufficient.

The pre-edit rule plan and post-edit worktree plan are separate gates. Planned
paths prevent an agent from beginning without the applicable acceptance rules;
the final worktree plan catches scope growth and generated or supporting files
that were not anticipated. A planned-path argument must never hide existing
maintained changes, and the final verification selection must use the actual
maintained worktree rather than the earlier estimate.

Each verification report must record at least:

- schema version, mode (`changed`, `release`, or `full`), project and environment
- exact maintained-content fingerprint and Git revision when available
- selected rule IDs and ordered commands
- start/end time, command exit status, and report outcome
- unresolved manual or not-tested boundaries
- for release mode, the exact accepted/deployed base revision, candidate
  revision, target environment, complete-diff digest, universal baseline,
  affected slices, excluded suites with reasons, and deployed revision/image
- for a browser-matrix command, the aggregate profile evidence or an immutable
  reference to it, including content/revision binding, exact profile/case
  coverage, attempt count, failure classification, and clean/flaky/failed
  outcome; a command exit code alone is insufficient

Generated reports are build evidence, not canonical documentation. Keep them
under an ignored artifact directory unless the approved evidence system
publishes immutable redacted artifacts. A report is stale immediately after
maintained project content changes. A previous report, screenshots from another
revision, a partial command, smoke tests, or an agent's recollection must not
satisfy the current completion gate.

The maintained-content fingerprint covers the complete maintained project,
including tracked files and non-ignored untracked files, rather than only the
current Git diff. A `changed` report records the Git revision as provenance but
freshness is decided by that complete content fingerprint. Committing exactly
the verified content therefore preserves the report and must not cause a test
rerun. Editing, adding, deleting, regenerating, or replacing any maintained file
changes the fingerprint and invalidates the report. Candidate `release` and
`full` reports, candidate-bound browser evidence, and image evidence remain
strict: both the content fingerprint and the exact candidate Git revision must match.

Never commit candidate approval fields into the manifest they approve: that
commit changes the candidate revision and makes the evidence stale. Keep the
manual bundle outside maintained fingerprints, bind every attachment by hash,
preserve it from generic cleanup commands, and archive the completed record plus
its own reported digest with the go/no-go decision. Full automation must finish
before an operations reviewer can approve that automation; therefore projects
must use the two-stage `verify:automated` then `verify` workflow rather than a
single circular command that requires its own result in advance.

The changed-path planner is a planning aid, not permission to omit fixed
cross-cutting invariants. Any UI change must select shared rendered invariants
for supported viewports, scroll ownership, overflow, themes, interaction
targets, accessibility, and relevant states. Any protected API/data change
must select envelope, validation, authorization, persistence, activity, and
isolation gates. A scoped release always runs its universal release baseline
plus the union of affected slices. Only a recorded full-regression trigger runs
the complete active command set.

#### 13.7.2 Risk-scoped verification selection

`VERIFY-SCOPE-001` makes **risk-scoped** verification the default for ordinary
work. Before a test command starts, the rule plan and changed-scope report must
record:

- the change classification and exact changed behavior or contract
- affected actors, surfaces, capabilities, trust boundaries, and downstream
  consumers
- realistic regression risks, selected commands and evidence with a reason for
  each, and materially related suites deliberately excluded with a reason
- whether full regression is required and the exact trigger when it is

Begin with the smallest complete evidence set that crosses every affected
boundary. Expand only when shared ownership, dependency analysis, a focused
failure, or new evidence demonstrates a wider blast radius. Running every test
must never substitute for impact analysis, and passing unrelated suites must
never compensate for missing focused proof.

For a release, `release:plan` compares the exact accepted/deployed base revision
with the candidate, adds the universal release baseline and named target proof,
and then applies this same affected-boundary selection to their complete diff.

For application source-code changes, construct a dependency-closed verification
slice instead of treating `source changed` as a full-regression trigger:

1. identify the owning module and the exact behavior changed
2. run static checks and the nearest deterministic unit or component tests for
   that behavior
3. add integration, database, API, queue, realtime, file, payment, printing, or
   browser proof only for boundaries the change crosses
4. add direct consumers only when imports, calls, schemas, shared contracts,
   persistence, events, permissions, or rendered workflows demonstrate impact
5. for several changed modules, run the union of their focused slices once
6. record materially related commands that remain excluded and why

A source edit does not by itself justify every actor flow, every browser, every
module, infrastructure recovery, production testing, or full regression. A
shared helper or contract also does not automatically justify the whole suite:
inspect its actual consumers, test the affected ones, and escalate only when
the dependency impact is demonstrably cross-cutting or cannot be bounded.

Build a mixed-worktree plan as the union of the per-path, per-boundary evidence
plans. A documentation path contributes its documentation, link, generation,
schema-reconciliation, and contract checks even when runtime source changes are
present in the same worktree; it must not contribute a rule's UI, API,
database-runtime, actor-flow, or production commands merely because that rule
also owns related prose. Runtime commands are selected only by a changed
runtime path, a demonstrated dependency from such a path, a focused failure,
or an objective full-regression trigger. The planner fixtures must prove both a
documentation-only case and a mixed documentation-plus-runtime case.
Planner and freshness fixtures must also prove that committing unchanged
verified content preserves `changed` evidence, while a real content change
invalidates it and exact revision matching remains mandatory for `full`
release evidence.

Use these minimum classifications:

| Change classification | Required verification scope |
| --- | --- |
| Reusable standard, skill, or documentation only, with no application-runtime contract change | Package syntax/schema, frozen baseline or digest, links, generation idempotence, and focused documentation/contract fixtures. Do not select consumer UI, API, database, actor, or production suites. |
| Module-local application source | Static checks, nearest changed-behavior tests, every boundary actually crossed, and demonstrably affected direct consumers. Do not select unrelated modules, actors, browsers, infrastructure, or production flows. |
| Localized UI or copy | Static/component checks plus the affected rendered workflow, responsive/theme/accessibility states, and durable result when the action mutates state. Do not select unrelated actors or modules. |
| API or domain route | Focused unit/integration/direct-request contract proof plus the affected rendered workflow when user-visible. |
| Database, migration, authorization, or concurrency | Affected schema, constraints, isolation, race, integration, activity, and consuming API/workflow proof. |
| Queue, scheduler, cache, realtime, files, payment, or printing | The owning capability's affected happy path and failure/recovery contract, plus affected consumers. |
| Shared runtime, security, data foundation, toolchain, or dependency | Every demonstrably affected consumer; escalate to full regression only when an objective trigger below applies. |
| Release candidate | Compare the accepted/deployed base to the exact candidate, run the universal release baseline plus the union of affected slices, add applicable candidate-bound manual and live target evidence, and record unrelated suites as excluded. Release status alone does not require full regression. |

Full regression is required only when at least one of these objective triggers
is recorded:

1. the user or accountable owner explicitly requests it
2. this is the initial release or there is no trusted accepted/deployed baseline
3. a shared runtime, security, data-foundation, toolchain, dependency, profile,
   or capability change has a demonstrated cross-module blast radius
4. focused evidence reveals systemic impact beyond the original scope
5. impact remains unbounded after inspecting ownership, dependencies, changed
   paths, and focused failures

“Continue,” “test carefully,” “commit,” “push,” “deploy,” “release,” a protected
branch name, elapsed time, habit, or subjective confidence is not a
full-regression trigger. The report must name the concrete trigger; when none
applies, `full_regression_required` is `false`. A release with `false` still
runs the universal release baseline and every affected slice on the exact
candidate and named target environment.

Unknown or uncovered maintained paths may still select the **safe full-rule
fallback**, but that result is an unresolved review state, not permission to
run every command. The plan must list every unmatched path and why mapping
failed. `verify:changed` must refuse to execute the broad fallback command set
until one of these resolutions is recorded:

- the path-to-rule mapping is corrected and the focused plan is regenerated
- analysis confirms a cross-cutting change and records an objective
  full-regression trigger
- the user or accountable owner explicitly directs full regression

Planner and report output must expose the change classification, affected
boundaries, selected commands with reasons, excluded related commands with
reasons, `full_regression_required`, its trigger or reason, unmatched paths,
and safe-fallback state. `contract:check` must reject a planner or report schema
that omits this decision record, and it must reject a missing applicable
`VERIFY-SCOPE-001` gate row.

Manual checklists must not contain pre-checked claims without evidence.
Automatable status is generated from commands; manual status is approved by the
named reviewer. Unchecked release-blocking work remains visibly pending and
prevents `verify` from succeeding.

##### Test-dispatch checkpoint and stopping condition

Before the first test command, give the user one short scope statement: changed
behavior, affected boundaries, selected checks, excluded unrelated checks and
any missing live target. Do not ask for routine approval of an already-scoped
check. Before adding a command, name the new dependency or failure that requires
it. If nothing changed and current evidence still matches, check freshness and
continue to the requested commit, push or other authorized outcome. Do not
reopen passed acceptance criteria merely because a new message arrived.

After all selected evidence passes, stop test execution. Move to documentation,
handoff or the next explicitly authorized action. If a required check is
blocked, report the exact blocker and smallest closure step; do not substitute
unrelated successful suites or silently wait for another prompt. Do not create
a new tracked task/status document for this checkpoint: use the existing
planner/evidence record and concise commentary.

##### Executable selection guard and adoption proof

The external skill's `scripts/verification-policy.mjs` validates a project-owned
planner export before test dispatch. It is a read-only selection guard, not a
test runner, source analyzer, secret scanner or release approver. Its output
separates selected `run`/`reuse` checks from excluded commands. A project may
use an equivalent guard only with the same behavioral fixtures below.

Run it with `node <locked-skill>/scripts/verification-policy.mjs <plan.json>`.
The project adapter owns real Git change discovery, full maintained-content
hashing, command registration, dependency analysis and trustworthy evidence.
Do not hand-pick changed paths or invent a passing evidence record. Export:

| Field | Required meaning |
| --- | --- |
| `schema_version`, `mode` | Version `2`; `changed`, `release`, or explicitly justified `full`. Version-1 exports need a reviewed browser catalog migration; they fail with an adoption message. |
| `changed_paths`, `unmatched_paths` | Complete maintained task diff or release base-to-candidate diff; unresolved paths block dispatch. |
| `impacts` | Rows with `path`, `kind`, `reason`, and `checks` IDs. Kinds: `documentation`, `static`, `tooling`, `runtime`. Every changed path needs an explained mapping. |
| `checks` | Complete active command catalog, not only wanted tests: unique `id`, argument-array `command`, `kind`, `phase` (`verify`, `predeploy`, `postdeploy`), `binding` (`content`, `candidate`, `deployment`), and optional `depends_on`, `full_only`, `baseline_purpose`. Dependencies are ordered, cycle-checked and phase-local. Classify aggregate commands by their expanded commands: a script wrapping all browser/API tests is not a documentation/static check. |
| `checks[].browser_runs` | Required array for every command, including aggregates; `[]` when no browser runs. Each row names `project`, `engine` (`chromium`, `firefox`, `webkit`) and `coverage` (`functional`, `ui-ux`). Expand real wrapper/config behavior; do not infer coverage from a suite name or omit hidden child runs. Browser checks use `kind: runtime`. |
| `browser_policy` | Required when the catalog has browser runs: `functional_project` names the one Chrome/Chromium functional project. Optional `additional_functional` rows name `project`, `trigger` (`explicit-request`, `browser-specific-risk`, `observed-browser-failure`), concrete `reason`, and exact `checks` IDs. A full-regression trigger alone cannot duplicate functional tests across browsers. |
| `bindings` | Complete maintained `content` fingerprint and relevant toolchain/configuration/fixture `context` fingerprint. Candidate evidence also binds `revision`, immutable `image`, `environment`; deployment evidence also binds the deployment identity in `deployment`. The legacy `image` field is the deployable artifact digest: container image for a container service, signed package for native distribution. It never requires a native app to build Docker. Never store secret values. |
| `evidence` | Trusted runner records with `check`, `check_digest` from the plan, `status`, and `bindings`. Only `passed` evidence with every required matching binding is reusable; failures, retries-only, missing or stale proof run again only if selected. |
| `requested_checks`, `dispatch_phase` | Optional exact proposed dispatch IDs; the guard rejects unrelated commands, omitted missing evidence, or rerunning reusable proof. If supplied, `dispatch_phase` restricts dispatch to `verify`, `predeploy` (including `verify`), or `postdeploy`; otherwise it checks the complete planned command list. The runner records real results and enforces release phase preconditions. |
| `full_regression` | Only in `full` mode: one of the registered objective `trigger` codes and a concrete `reason` linking the request/impact evidence. |
| `release` | Required for release: `base`, `candidate`, `environment`, `diff_digest`, and `baseline` entries by phase. |

The universal baseline maps each entry's `purpose` to a registered `check`:
`predeploy` includes `candidate-integrity`, `target-readiness`,
`recovery-readiness`; `postdeploy` includes `deployed-identity`, `live-smoke`.
These groups own the universal obligations in Section 13.7, not every actor
workflow. A blanket full suite cannot be relabelled as a baseline check.
Planning may precede image/deployment creation, but reuse requires their exact
identities; the runner must enforce missing execution preconditions per phase.
For native distribution, baseline purposes bind the exact signed artifact,
platform/environment, signing/configuration readiness, recovery/compatibility
plan, installed/distributed build identity, and focused device smoke under
Sections 9 and 14.4. A container smoke or browser screenshot cannot satisfy
those native purposes.

For example, one documentation edit maps only its documentation check:

```json
{
  "schema_version": 2,
  "mode": "changed",
  "changed_paths": ["docs/product-spec.md"],
  "unmatched_paths": [],
  "impacts": [{"path": "docs/product-spec.md", "kind": "documentation", "reason": "Clarify existing wording; no runtime contract change", "checks": ["book"]}],
  "checks": [{"id": "book", "command": ["pnpm", "docs:check"], "kind": "documentation", "phase": "verify", "binding": "content", "browser_runs": []}],
  "bindings": {"content": "computed-complete-content-digest", "context": "computed-documentation-toolchain-digest"},
  "evidence": []
}
```

Fixture requirements for package releases and each consuming adapter:

- documentation-only selects no runtime command, including through prerequisites
- mixed documentation/runtime selects their union once; a module-local edit
  does not select unrelated roles or capability suites
- unknown paths, missing commands and dependency cycles fail before execution
- identical content/context after commit reuses passing content-bound evidence;
  changed source, commands or relevant environment invalidate affected proof
- release adds the pre/post baseline and affected slices, not full regression;
  another target or deployment cannot reuse live evidence
- explicit justified full regression works; a release label without a trigger
  cannot dispatch a full-only command
- the exact proposed command list rejects unrelated tests and redundant reruns
- Chrome functional plus selected secondary UI/UX checks passes; secondary
  functional commands, including hidden aggregate runs, fail without their own
  browser-specific trigger; full mode preserves that division
- a named browser risk selects only its relevant additional cases; API checks
  are not duplicated per engine; version-1 exports fail with an adoption message

Package integrity, adapter adoption and application verification are distinct
results. During upgrades, inspect the consumer's real `rules:plan`,
`release:plan`, `verify:changed`, `verify:automated`, `verification:check` and
aggregate `verify`. Run its planner/runner fixtures with fake recording commands
in isolation to prove dispatch decisions without starting application flows.
An old unconditional `full` runner is an adoption gap even when the lock and
installed skill hashes pass. Do not rewrite another project's gates without
approval or claim prose/regex checks prove behavioral adoption.

#### 13.7.3 Evidence-scoped completion and readiness claims

`VERIFY-CLAIM-001` governs answers to questions such as whether work is
complete, fully tested, production-ready, safe to release, covers all cases, or
is `100%`. The first sentence must give one unambiguous answer:

- `No — this is not 100% verified.` when any required boundary is missing,
  failed, skipped, stale, pending, not tested, unresolved, or bound to another
  candidate or environment.
- `Yes — 100% of the declared acceptance scope passed for <candidate> in
  <environment>.` only when the finite declared scope satisfies every condition
  below. Follow it immediately with the explicit boundary that this is not a
  guarantee of zero defects or unknown future cases.

A scope-complete answer is permitted only when:

1. the finite acceptance scope is explicitly identified and enumerates the
   applicable behaviors, actors, permissions, scope-isolation boundaries,
   states and transitions, material failure/recovery cases, and external
   dependencies
2. the exact revision, build, or immutable image and the tested environment are
   identified
3. every command and manual/live gate required by that scope has current
   candidate-bound evidence
4. the durable result and applicable authorization, isolation, validation,
   concurrency, activity, downstream, cleanup, and recovery effects are proven
5. failed, skipped, stale, pending, flaky-only, not-tested, and open-boundary
   collections are all empty
6. no unresolved product decision, external dependency, or manual action can
   change the answer for the declared scope

The answer after the first sentence must state the declared scope and candidate,
then compactly distinguish passed, failed, skipped/not-tested, stale, and open
boundaries. When the answer is `No`, end with the smallest evidence or work set
needed to close the claim. A source review may say `implemented`; local evidence
may say `locally verified`; neither is production-readiness evidence. Do not use
`all possible cases`, confidence, test counts alone, screenshots alone, a clean
build, or a lower-level pass as a substitute for the finite acceptance matrix.

The verification report must expose a machine-readable `completion_claim` with
`status` (`scope_complete` or `not_verified`), `scope_id`, `scope_total`,
`scope_passed`, and arrays for `failed`, `skipped`, `stale`, `pending`, and
`open_boundaries`. `verification:check` or its equivalent must derive and reject
`scope_complete` unless the candidate, environment, fingerprint, required
evidence, counts, and empty-boundary conditions above all match. Human wording
must not override a rejected machine claim.

### 13.8 Docker and Make verification

- Run `docker compose config --quiet` and reject obsolete, unknown, or
  unresolved required configuration.
- Test `make help`, `doctor`, `config`, and `setup` from a clean clone in a
  disposable environment representative of supported development hosts.
- Prove the application can hot reload, migrate, seed, process a job when
  active, exchange a cross-replica realtime event when active, and reach healthy
  state using service-name DNS.
- Prove `stop`, `start`, `rebuild`, and `down` preserve PostgreSQL, queue, and
  local upload volumes.
- Prove `destroy` and `reset-db` fail without exact confirmation, affect only
  project-scoped resources, and leave external networks and unrelated Docker
  resources intact.
- Inspect the production image as a non-root runtime, verify expected artifacts
  and absence of `.env`, Git history, caches, test evidence, and development
  dependencies, then test startup, readiness, signal handling, and graceful
  shutdown.
- Scan images and build context for known vulnerabilities and secrets according
  to the release policy. Verify private build inputs use secret/SSH mounts
  rather than build arguments.
- Secret scanning must fail closed if candidate Git metadata is inaccessible or
  no commit was scanned. Support linked worktrees explicitly, and scan committed
  history, the working diff, and non-ignored untracked files as separate scopes;
  a scanner process returning zero after logging a repository error is not
  successful evidence.
- Do not call a development target, running container, rendered Compose model,
  or successful image build production-runtime proof without its smoke and
  security checks.
