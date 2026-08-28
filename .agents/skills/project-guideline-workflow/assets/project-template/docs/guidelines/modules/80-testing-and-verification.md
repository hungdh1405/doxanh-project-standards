
## 13. Testing and verification

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
  evidence, and DST gap/overlap cases for any supported DST zone.
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

Playwright Test is mandatory for the Nuxt web profile. It is the single
browser-automation runner and the black-box HTTP API test client. Do not add
Cypress, Selenium, Puppeteer, or another overlapping end-to-end runner without
an ADR that replaces this contract. Use the latest mutually compatible stable
`@playwright/test` and `@axe-core/playwright` versions selected under Section
3.8, commit `playwright.config.ts`, and install the pinned Playwright browser
binaries in CI.

Required suites:

| Suite | Boundary | Required proof |
| --- | --- | --- |
| `api` | Playwright `APIRequestContext` → deployed/running HTTP boundary → real application dependencies | Exact API contract, authorization, persistence, idempotency, concurrency, activity, queue/event effects, and safe failures. |
| `e2e-smoke` | Browser → rendered UI → API → durable/downstream state | Small critical vertical workflows in desktop Chromium plus at least one representative mobile UI/UX compatibility check. |
| `e2e` | Same continuous boundary as smoke, with full released behavior | Complete important actor workflows in desktop Chromium; focused UI/UX compatibility in Firefox, WebKit, Mobile Chrome, and Mobile Safari. |
| `a11y` | Rendered routes and revealed interactive states | Automated WCAG A/AA-detectable violations plus named manual checks that automation cannot prove. |

#### Browser workflow rules

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
- Release coverage includes the supported desktop browser engines and
  representative mobile Chrome/Safari projects. Device emulation proves the
  configured browser/viewport contract, not physical-device behavior.
- The full released workflow matrix runs before merge to a protected release
  branch and for every release. A smaller smoke matrix may provide pull-request
  feedback but never replaces the full merge/release gate.
- Configure traces on the first retry and screenshots/video on failure as
  bounded CI artifacts. Redact tokens, cookies, authorization headers,
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
  evidence with exact current coverage. A selected chunk, smoke run, stale
  record, missing case, duplicate profile, failure, or retry-only result cannot
  satisfy or replace release evidence.
- The aggregate browser gate passes only when every required released profile
  has exact current clean evidence. A later complete clean rerun of one profile
  may replace its failed/flaky record; the aggregate must be rebuilt and
  revalidated before the verification report can pass.
- Release proof runs against a production build or the same immutable
  container image intended for release, not only a Nuxt hot-reload server.
  Local interactive development may reuse an explicitly configured local
  server.

#### Direct API automation rules

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

When realtime is active:

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
  in both web and Flutter clients
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

Every Nuxt project must expose these stable package scripts. A platform-specific
wrapper such as Make may call them, but it must not rename or omit the canonical
script surface:

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
| `standards:check` | Enforce stack exclusivity, layer/import boundaries, forbidden client/server crossings, Tailwind application allowlist, generated-code drift, focused-test/TODO exception format, and other machine-checkable project rules. |
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
| `verify` | Full local/CI release gate. |

`verify` must run `deps:check`, `i18n:check`, `standards:check`,
documentation checks, formatting/diff checks, lint, typecheck, tests,
migration checks, production build, and any project-specific security or
evidence gate.

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
  API, component, accessibility, or approved manual evidence
- define the deterministic command order for changed-scope and full-release
  verification

Reserve these baseline rule IDs in every newly generated project. An applicable
row maps to automated/manual evidence; a conditional row may be
`not_applicable` only with the Section 1.1 reason and activation trigger:

| Rule ID | Required contract |
| --- | --- |
| `UI-VISUAL-001` | Default approved component system, semantic tokens, light/dark/system themes, layout-only utility CSS, icon/image rules, and no page-local visual system. |
| `UI-DENSITY-001` | Compact readable visual density, natural-width desktop actions, deliberate mobile width, at least 44×44 CSS-pixel phone targets, and at least 8 CSS pixels between adjacent targets where accidental activation is possible. |
| `UI-AUDIENCE-001` | Correct audience/surface, route/layout, permission projection, and no cross-audience controls. |
| `UI-ACTION-001` | Every important rendered action and overlay close path has a real outcome and interaction proof; form/overlay footers use the shared action-only composition, deterministic safe-to-commit DOM/tab/visual order, and responsive touch-safe geometry from Section 8.11.2. |
| `UI-COPY-001` | User-task copy, localized product nouns, effective-value wording, and no implementation details, policy narration, internal rationale, developer instructions, or dummy content on any released surface. |
| `UI-CONTROL-001` | Choice controls follow Section 8.12: `Select` is limited to at most nine short, bounded, easily scanned choices; ten or more choices, remote catalogs, or name/code lookup use the searchable default `Combobox` with loading, empty, disabled, clear, keyboard, touch, component, and rendered workflow proof. |
| `UI-COLLECTION-001` | Search/group/filter/sort/pagination, stable item anatomy, restoration, and uneven-data proof for growing collections. |
| `UI-RESP-001` | Phone-first continuous reflow, bounded scroll ownership, theme, zoom, keyboard, touch, and required viewport evidence. |
| `UI-STATE-001` | Loading, empty, populated, denied, expired, conflict, unexpected-failure, destructive, pending, and recovery states are designed and exercised where applicable. |
| `UI-ACCESS-001` | WCAG 2.2 AA semantics, names, focus, keyboard, reflow, contrast, live regions, touch, reduced motion, component evidence, and rendered accessibility evidence. |
| `DATA-CONCURRENCY-001` | Scoped revision predicate, handled stale result, winning-only effects, UI recovery, and independent-client race proof. |
| `AUTH-SESSION-001` | Exact per-actor credential, session/device counting, replacement, recovery, revocation, isolation, and race behavior. |
| `ENTRY-SHARE-001` | Conditional canonical entry registry, locator/proof separation, host trust, revocation, and share/open/QR proof. |
| `COMMERCIAL-001` | Conditional offering-versus-assignment model, effective period/status/limits, versioning, authorization, and audit. |
| `VERIFY-SCOPE-001` | Risk-scoped verification records change impact, selected and excluded evidence with reasons, safe-fallback review, stepwise expansion, and objective full-regression triggers. |

`contract:check` must reject a missing applicable baseline row, a duplicate ID,
an active capability marked N/A, a web `UI-*` baseline rule below blocking
severity, or a rule that names no executable/manual evidence path.

The repository must expose and enforce:

| Script | Contract |
| --- | --- |
| `contract:check` | Validate the gate-manifest schema, unique rule IDs, canonical sources, root `AGENTS.md`, applicable profiles, required package/Make/CI surface, command references, screen-evidence coverage, and manual/N/A evidence structure. |
| `rules:plan` | Before editing, accept explicit anticipated project-relative paths and merge them with current maintained changes; after editing, inspect the actual worktree. In both modes print the exact applicable rule IDs, automated commands, and unresolved manual evidence. Unknown or uncovered maintained paths select the safe full-rule fallback. |
| `check:fast` | Run the deterministic fast feedback subset. It must include `contract:check`; it is not release evidence. |
| `verify:changed` | Run the union of automated gates selected by `rules:plan`, fail on missing evidence mappings, and write a changed-scope verification report. |
| `verify:automated` | Refuse a dirty maintained checkout, run the complete automated release command set, and write revision/fingerprint-bound candidate evidence before any dependent human approval. |
| `evidence:init` | After the candidate image exists, initialize an ignored/external evidence bundle bound to the exact revision, maintained fingerprint, and immutable image digest; refuse overwrite. |
| `evidence:check` | Fail when an applicable release-blocking gate is missing, pending, stale, malformed, unowned, targets another candidate, or lacks a regular non-symlink evidence file with a matching SHA-256 digest. |
| `verification:check` | Confirm the latest successful report matches the current maintained-project content fingerprint. |
| `verify` | Perform the fast final aggregation: require a current `full` automated report plus complete candidate-bound manual evidence without rerunning or pretending to automate human review. |

`check`, if retained for compatibility, must alias `check:fast`; it must never
be described as the release gate. `make verify-changed`,
`make verify-automated`, and `make verify` must invoke the canonical scripts in
the documented environment. Automated runners may produce changed/full
automated artifacts, but a release system must supply the external manual
evidence bundle before the aggregate gate. The required automated status must
not be a smoke-only job.

The pre-edit rule plan and post-edit worktree plan are separate gates. Planned
paths prevent an agent from beginning without the applicable acceptance rules;
the final worktree plan catches scope growth and generated or supporting files
that were not anticipated. A planned-path argument must never hide existing
maintained changes, and the final verification selection must use the actual
maintained worktree rather than the earlier estimate.

Each verification report must record at least:

- schema version, mode (`changed` or `full`), project and environment
- exact maintained-content fingerprint and Git revision when available
- selected rule IDs and ordered commands
- start/end time, command exit status, and report outcome
- unresolved manual or not-tested boundaries
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
isolation gates. The full release gate always runs the complete active command
set.

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

Use these minimum classifications:

| Change classification | Required verification scope |
| --- | --- |
| Reusable standard, skill, or documentation only, with no application-runtime contract change | Package syntax/schema, frozen baseline or digest, links, generation idempotence, and focused documentation/contract fixtures. Do not select consumer UI, API, database, actor, or production suites. |
| Localized UI or copy | Static/component checks plus the affected rendered workflow, responsive/theme/accessibility states, and durable result when the action mutates state. Do not select unrelated actors or modules. |
| API or domain route | Focused unit/integration/direct-request contract proof plus the affected rendered workflow when user-visible. |
| Database, migration, authorization, or concurrency | Affected schema, constraints, isolation, race, integration, activity, and consuming API/workflow proof. |
| Queue, scheduler, cache, realtime, files, payment, or printing | The owning capability's affected happy path and failure/recovery contract, plus affected consumers. |
| Shared runtime, security, data foundation, toolchain, or dependency | Every demonstrably affected consumer; escalate to full regression only when an objective trigger below applies. |
| Release candidate | Complete active automated verification followed by candidate-bound manual evidence. |

Full regression is required only when at least one of these objective triggers
is recorded:

1. the user or accountable owner explicitly requests it
2. the work is a release candidate or protected release merge
3. a shared runtime, security, data-foundation, toolchain, dependency, profile,
   or capability change has a demonstrated cross-module blast radius
4. focused evidence reveals systemic impact beyond the original scope
5. impact remains unbounded after inspecting ownership, dependencies, changed
   paths, and focused failures

“Continue,” “test carefully,” elapsed time, habit, or subjective confidence is
not a full-regression trigger. The report must name the concrete trigger; when
none applies, `full_regression_required` is `false`.

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
