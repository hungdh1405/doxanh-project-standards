
### 4.10 Minimum content contracts: engineering and quality

Apply the engineering list to owned profiles only: browser UI choices belong to `nuxt-web`,
Nuxt/Nitro server and PostgreSQL choices to `nuxt-api`, and native package/source
choices to `flutter-standards.md`. Record external service contracts instead of
inventing local backend ownership. An inactive profile needs no packages,
directories, build, or verification tools merely to fill this chapter.

`engineering-standards.md` must pin or select:

- Nuxt, Vue, TypeScript, Node, and runtime version policy
- pnpm or Bun, exactly one JavaScript workspace lockfile, and the production
  runtime
- required and conditional Nuxt modules
- the Section 3.8 approved-dependency registry, forbidden/duplicate-package
  controls, compatibility evidence, upgrade/removal process, and the
  `deps:check`/`standards:check` implementation
- shadcn-vue preset, base, icon library, component directory, and update policy
- Tailwind v4 integration and layout-only application rule
- Vue component boundaries, Pinia decision, VueUse boundaries, routing, SSR,
  hydration, slot-based master layouts, and the Section 6.6 blocking-activity
  controller
- the Section 6.7 create/update/delete confirmation sequence and its
  shadcn-vue/Flutter component ownership
- forms/validation, dates, HTTP, localization, images, icons, and motion
- PostgreSQL driver/pool, Drizzle schema/migration/seed/test paths, database
  naming/transaction/query conventions, Redis, BullMQ, workers, schedulers, and
  migrations
- durable activity-log tag registry, typed writer/repository boundary,
  per-tag Zod schemas, transaction policy, actor/user ID plus display/role/
  assignment snapshot mapping from authenticated context, and maintenance
  access
- mandatory Awilix roots/scopes, canonical immutable execution and actor
  contexts, protected-handler fail-closed wrapper, safe enriched logger, DI
  import boundary, and context provenance/isolation tests
- conditional realtime transport, gateway/client libraries, protocol version,
  dated dependency acceptance review, and production-runtime decision
- Dockerfile/Compose baseline, code-comment policy, exception handling, logging,
  security, tests, seed profiles, commands, and CI
- project-book manifest/schema tooling, generated-region policy, and
  documentation command implementation, including `docs:data:check` when
  persisted data is active
- approved deviations linked to ADRs

Use the actual developer environment for each owned profile. The Docker/Compose
details below apply where those runtimes exist; a Flutter-only project documents
host SDK, emulator/device, signing prerequisites and native commands instead.

`local-development.md` must define:

- supported host operating systems/architectures and required Docker,
  Compose-plugin, and Make versions or capabilities
- generated Docker/Compose/Make files and the responsibility of each
- local service graph, optional profiles, health dependencies, URLs, ports, and
  service-name DNS
- conditional realtime gateway/realtime Redis profile, WSS/local TLS policy,
  connection ticket setup, health, logs, and cross-replica smoke workflow
- project-private and optional external shared networks, membership, ownership,
  and setup/removal behavior
- bind mounts, named volumes, persistence, backup/export when needed, and exact
  data-loss boundaries
- `.env.example`, local `.env`, safe development secrets, configuration
  precedence, and boot validation
- the complete Make target contract from Section 14.1, including examples,
  parameter rules, and destructive confirmations
- first setup, normal daily workflow, dependency/lockfile change, image rebuild,
  migration, seed, test, troubleshooting, reset, and teardown procedures
- host versus container responsibilities, including the Flutter exception
- proof that setup works from a clean clone and that stop/down/destroy preserve
  or remove exactly the documented resources

`flutter-standards.md` owns native source architecture and package choices. It
must define:

- Flutter/Dart version and channel
- layered views/view-models, repositories/services, and optional use cases
- dependency injection, navigation, state, models, networking, storage, and
  result/error contracts
- `AppMasterPage`/`AppMasterLayout`, Riverpod loading leases, the root blocking
  overlay, Dio/Retrofit integration, `noLoading` policy, and 500 ms release hold
- native create/update/delete confirmation-dialog composition, copy,
  accessibility, cancel/focus behavior, and mutation handoff
- code-generation policy and generated-file ownership
- adaptive behavior based on available constraints, not device-type checks
- localization, accessibility, motion, privacy, and offline rules
- source layout, formatting, analysis, tests, builds, and signing boundaries

`source-file-guide.md` describes observed paths, not aspirational folders. For
each important responsibility it names:

- entry file or directory
- owner and responsibility
- callers and dependencies
- generated or hand-authored status
- relevant tests
- first reading point

It must identify the actual Nuxt and Flutter master-layout components, global
loading controllers/overlays, request adapters/interceptors, and the approved
entry point through which feature code starts blocking heavy work.

For a new scaffold it may begin as proposed, but regenerate it from actual
source once files exist.

`test-strategy.md` must map active requirements and risks across the applicable
layers below. This is the project coverage inventory, not a command list for
every edit. GDL-080 owns task/release selection, evidence reuse, and the browser
matrix: affected functional flows run in Chrome/Chromium; secondary browsers
receive focused UI/UX checks unless a named browser-specific trigger applies.
Inactive services, transports, and clients do not create test obligations.

- formatting, lint, type, generated-code, dependency, and secret checks
- unit tests
- Vue component and Flutter widget tests
- blocking-activity controller, request-adapter/interceptor, overlay,
  accessibility, timeout/cancellation, ten-operation concurrency, retry, and
  `noLoading` tests on every active client platform
- `TIME-PRESENTATION-001` source checks and focused tests covering direct raw
  rendered temporal values, browser/component-local formatting, raw fallback
  after formatter failure, scope/system presentation precedence, and localized
  invalid output
- create/update/delete confirmation-dialog tests covering validation order,
  exact target/scope copy, cancel/dismiss with no request, one confirmed request,
  focus return, bulk scope, duplicate prevention, and loading handoff
- `UI-ACTION-001` actionable-feedback component and rendered tests covering
  icon/content/action anatomy, separate action-only placement, longest supported
  localized title/summary/metadata, phone and desktop reflow, 200% zoom,
  light/dark themes, keyboard/focus, and no overflow or material truncation
- Nitro/API, PostgreSQL, Redis, BullMQ, conditional realtime protocol/gateway,
  and migration integration
- durable activity-log tag/schema validation, same-transaction persistence,
  duplicate delivery, immutability, tenant isolation, authorized projection/
  export, retention, and legal-hold tests
- Playwright direct-HTTP API automation with isolated actor contexts, exact
  envelope/status/code assertions, permission/tenant cases, persistence, and
  downstream-effect proof
- Playwright real rendered browser workflows for the selected functional
  project, plus the required secondary-browser UI/UX coverage; distinguish
  fixture/API setup from each browser-driven action being claimed
- `@axe-core/playwright` automation plus manual accessibility and
  real-device/native-platform behavior
- security
- performance and load
- backup, restore, migration failure, retry, cache loss, conditional
  reconnect/refetch/gateway drain, and outage recovery

It must distinguish mocks, fakes, fixtures, route/network interception, real
services, staging, production-like, and real-production evidence. Mocked
application routes cannot satisfy a claimed real end-user workflow.
Deterministic fixture/API setup may establish preconditions, but it does not
prove the user-facing steps it bypasses. Name those boundaries and exercise the
actual rendered actions and resulting durable effects included in the claim.

`observability.md` must include:

- canonical structured log schema/version, level contract, and event naming
- required-field matrix by request, job, scheduler, realtime, integration,
  migration, script, process, and native event family
- when/where/who-source/what/outcome/correlation context from Section 12
- request/job logger enrichment from verified DI context, including ID/type/
  bounded registered roles while excluding display names, raw session IDs,
  credentials, full user entities, and complete serialized contexts by default
- trusted-proxy/client-IP resolution, representation, privacy, access, and
  retention decisions
- sanitized unexpected-error object, fingerprinting, stack policy, and
  duplicate-suppression boundary
- request, job, scheduler, realtime connection/message/event, integration,
  migration, script, and native correlation
- event catalog with level, required fields, sampling, and owner
- redaction, consent, privacy, access, and retention
- liveness, readiness, metrics, traces, dashboards, and service-level objectives
- alert thresholds, severity, owner, and runbook link
- link to the canonical activity tag registry, activity-write health signals,
  and their separation from application telemetry; do not maintain a competing
  tag catalog here
- proof that logs, metrics, traces, audit records, and alerts reach their
  selected backends as applicable

Audit events remain durable business/security records and are not replaced by
ordinary application logs.

### 4.11 Minimum content contracts: delivery and operations

`release-readiness.md` is the decision record for one release. It must name:

- release/version, source commit, and built artifacts
- target environment and approver
- migrations, scheduler changes, configuration, and feature flags
- dependency/security results
- test and evidence bundle
- known risks and accepted exceptions
- deploy order, rollback threshold, and rollback compatibility
- smoke results and final go/no-go decision

`production-readiness.md` is the durable operating contract. It must define:

- runtime processes and dependency topology
- production container targets, registry/tag/digest policy, non-root identity,
  health/signal behavior, artifact contents, image scanning/SBOM/provenance, and
  promotion between environments
- environment variables, secrets, DNS, TLS, and access
- PostgreSQL ownership/migration/runtime/reporting/backup roles, grants, RLS
  behavior, credential rotation, and privileged-access review
- PostgreSQL version/extensions, environment-specific connection-budget
  calculation, role timeouts, proxy/read-replica assumptions when used,
  migration single-runner/recovery, long transaction/lock/deadlock, table/index
  growth, vacuum/bloat, replication/PITR, and database saturation monitoring
- capacity, scaling, connection pools, queue throughput, conditional realtime
  connections/fanout/backpressure/drain, and limits
- storage, media, backups, restore proof, RPO, and RTO
- log/metric/trace/audit backends, privacy/retention, alert ownership, and
  on-call/escalation
- security, privacy, retention, and maintenance
- dependency outage, partial deployment, and disaster recovery
- production verification and unresolved blockers

Every runbook must contain:

- purpose, trigger, severity, and prerequisites
- safe diagnostic steps
- mitigation and recovery steps
- validation after recovery
- rollback or escalation threshold
- communication owner
- evidence to retain
- last rehearsal date

Required runbooks before production, only for active infrastructure and
integrations. Record the N/A family decision for an absent capability instead
of generating fictional recovery steps:

- deployment
- rollback
- PostgreSQL backup and restore
- failed or partially applied migration
- BullMQ stalled/failed/replay recovery, when queue work is active
- cache Redis loss, when cache Redis is used
- queue Redis outage, when BullMQ is used
- realtime gateway or Pub/Sub outage and reconnect storm, when active
- external dependency outage, for each consequential active dependency
- secret rotation
- security incident

Every ADR must contain context, decision, status, considered alternatives,
tradeoffs, security/operational consequences, migration or exit plan, owner, and
review date.

### 4.12 Project-book generation and review workflow

Generate and review the book in gates.

#### Gate 0: repository and evidence census

Before writing:

- inspect the actual repository, workspaces, runtime files, package manifests,
  schema/migrations, routes, tests, CI, deployment files, and current docs
- identify whether this is a new project, reusable template, migration, or
  existing-runtime documentation
- identify independently owned profiles: Nuxt web, Nuxt API, and/or Flutter
  native; record external API ownership and inactive profile decisions
- inventory evidence and verify that linked files exist
- record contradictions between requested target state and current runtime

Outputs:

- proposed `book-manifest.yaml`
- document and evidence inventory
- current-versus-target boundary
- preservation matrix from Section 4.13
- prioritized clarification register from Section 4.18
- blocking product questions and the chapters they block

#### Gate 1: product truth

Generate and review chapters `10–15`, plus chapter `16` when commercial access
is active. Otherwise retain its honest N/A decision.

Do not design tables or screens before actors, workflows, vocabulary, states,
permissions, invariants, exclusions, and success measures are coherent.

#### Gate 2: experience truth

For active UI profiles, generate and review chapters `20–24`. Otherwise review
their N/A decisions and continue to architecture without inventing screens.

Approve:

- screen registry, route/actor coverage, and important workflow map
- master layouts
- page templates
- mock type/component legend and genuinely shared patterns
- one representative vertical slice
- one complete representative screen contract with real copy, phone-first
  wireframe, content/control, data, state, responsive, permission,
  accessibility, test, and evidence matrices
- table-column and form-field contracts for the representative screen when
  applicable
- shadcn-vue component mapping for web or native widget mapping for Flutter
- approved project theme and navigation direction, including light/dark token
  mappings; use baseline defaults only when an approved design is missing
- real copy and important state variants
- mobile-first evidence plan

Do not generate every screen before the shared structure is approved.

#### Gate 3: architecture and contracts

Generate and review chapters `30–39`.

Every high-risk workflow must align across API, data, permission, security,
activity tag/record, event/job, idempotency, failure, audit, and recovery
contracts.

Before Gate 3 approval, `docs:data:check` must pass when an owned database schema
is active. At least one representative high-risk workflow traces through its
applicable owned DATA table/fields, TX write boundary, QRY read path, permission,
result, activity, migration, and verification plan. Owned Nuxt API persistence
uses real-PostgreSQL evidence; native local storage uses its actual platform
store. External API internals remain a named provider boundary.

#### Gate 4: engineering and quality

Generate and review chapters `40–45`.

Pin the selected stack, approved-dependency registry, paths, commands, seed
profiles, test environments, actual local development environment, observability contract,
and CI gate. Run `deps:check` and `standards:check`; no deprecated, unregistered,
duplicate-concern, or cross-profile dependency may remain. Regenerate
`source-file-guide.md` from observed source once code exists.

#### Gate 5: delivery and operations

Generate chapters `50–53` early as honest skeletons. Complete them before
deployment. Runbooks must be executable and rehearsed, not generic advice.

#### Gate 6: compile and audit

Before broad implementation or initial book approval, audit the complete
applicable book. During maintenance and release work, review changed canonical
chapters and their affected dependents; the structural book/link checks may
still scan the whole book. Documentation audit scope does not automatically
expand application, infrastructure, or cross-browser test scope.

- run the applicable documentation command contract from Section 4.15
- regenerate the chapter table and marked navigation regions from the manifest
- verify Previous/Book/Next navigation
- check local links and referenced evidence
- check manifest/schema/header agreement
- check duplicate headings and stable IDs
- check glossary terminology and forbidden synonyms
- check that one rule has one canonical owner
- check traceability gaps and unresolved high-risk requirements
- check proposed/implemented/verified claims against source and evidence
- reject ambiguous checklist statuses such as `Partial`
- update the owning development chapters and centralized clarification register

At each review, record one result:

- `Approved`
- `Changes requested`
- `Blocked by <decision>`
- `N/A — <reason and activation trigger>`

### 4.13 Existing-project preservation protocol

Never improve an existing document family through an unexplained wholesale
replacement.

Before editing, create a preservation matrix in the work plan. When the
preservation decision must remain durable, record it in the affected chapter or
an ADR rather than generating a progress-report chapter:

| Existing content | Source | Canonical destination | Action | Reason | Verification |
| --- | --- | --- | --- | --- | --- |
| Example: deterministic seed profiles | old guideline | engineering standards and test strategy | Adapt | Responsibility remains; stack syntax changes | Commands and fixtures documented |

Allowed actions:

- `Keep`: wording and owner remain correct
- `Adapt`: responsibility remains; implementation language changes
- `Split`: one source mixes several canonical owners
- `Move`: correct content belongs in another chapter
- `Replace`: responsibility remains but the old contract is obsolete
- `Archive`: historical evidence is useful but no longer canonical
- `Remove`: duplicated, contradicted, unsafe, or explicitly out of scope

Rules:

- Every removed substantial section needs a reason.
- Preserve business rules, state models, page-template logic, feedback rules,
  accessibility, deterministic data, test evidence, operations, and failure
  handling unless an approved decision changes them.
- Replacing a legacy framework, component system, or frontend runtime does not
  authorize removing framework-neutral product and delivery requirements.
- Do not rewrite runtime documents to a target stack before implementation
  changes; represent current and target states separately.
- Do not delete useful timestamped evidence merely because it is stale. Archive
  it or mark it superseded.
- After editing, report what was kept, adapted, split, moved, replaced,
  archived, and removed.

### 4.14 Stable IDs and traceability vocabulary

Use stable prefixes:

| Source | Prefix |
| --- | --- |
| Product requirement | `PRD-` |
| Domain rule or invariant | `DOM-` |
| Workflow or state | `FLOW-` / `STATE-` |
| UI or screen | `UX-` / `SCR-` |
| API contract | `API-` |
| Data rule | `DATA-` |
| Database query/access path | `QRY-` |
| Database transaction/write path | `TX-` |
| Migration or backfill | `MIG-` |
| Security control | `SEC-` |
| Permission | `PERM-` |
| Activity tag or durable record rule | `ACT-` |
| Realtime event | `EVT-` |
| Realtime frame/protocol rule | `RT-` |
| Queue job or scheduler | `JOB-` / `SCH-` |
| Observability event or alert | `OBS-` / `ALERT-` |
| Test or evidence | `TEST-` / `EVD-` |
| Operational procedure | `OPS-` |
| Architecture decision | `ADR-` |

IDs remain stable when wording changes. Do not reuse retired IDs for new
meanings. Mark replaced IDs as superseded and link to the replacement.

### 4.15 Navigation, links, book automation, and integrity

- Every chapter links to the book and adjacent chapters.
- Every chapter links to its direct prerequisites and consumers.
- Use relative links inside the repository.
- Link to stable IDs or headings; avoid fragile prose-generated anchors for
  high-value references.
- Do not link to planned but absent files. Generate the skeleton first.
- Timestamped evidence links must resolve or be explicitly archived.
- `docs/README.md` separates canonical, supporting, generated, evidence,
  archived, and external-reference material.
- `docs/README.md` identifies the selected external standards release and the
  repository command that resolves its installed entry. Reusable guideline
  modules and compatibility pages are not copied into the project book.
- Root and app-local docs identify which source is canonical when both exist.
- Generated regions are visibly marked and may be regenerated. Authored product
  prose must never be overwritten merely because a generator reruns.

Every generated project exposes the following documentation command contract.
JavaScript workspaces use their chosen package scripts. A Flutter-only repository
may expose equivalent maintained Dart/Make commands and records the exact
mapping in its engineering chapter; do not add a JavaScript runtime merely to
match command spelling.

| Command | Required behavior |
| --- | --- |
| `docs:book:generate` | Create missing chapter skeletons, validate conditional stubs, and regenerate only marked manifest-derived tables and navigation. |
| `docs:book:check` | Validate the manifest against its schema, paths, unique IDs, headers, statuses, evidence requirements, collection order, navigation, lifecycle-appropriate placeholders, and each active chapter's applicable minimum content contract from Sections 4.7–4.11. |
| `docs:links:check` | Validate repository-relative chapter, evidence, and source links without treating code-block examples as real links. |
| `docs:traceability:check` | Detect malformed or duplicate stable IDs and report uncovered high-risk requirements and unresolved references. |
| `docs:data:check` | When an owned database schema is active, validate table-catalog coverage, required per-table sections/matrices, DATA/QRY/TX/MIG references, applicable scope/activity rows, source/migration paths by status, and evidence requirements. External database internals do not create local schema checks. |
| `docs:ui:check` | When UI is active, validate the screen registry, screen/flow paths and IDs, route ownership, required Section 8.9 headings/matrices or their GDL-053 native adaptation, registry-contract agreement, approved-file placeholders, and evidence requirements. |

Rules:

- The chosen workspace runner executes these commands; do not document a second
  JavaScript package manager or add an unrelated runtime just for documentation tooling.
- Implement the commands under a maintained tooling boundary such as
  `scripts/docs/`, with tests or deterministic fixtures for manifest and link
  failures.
- `docs:book:generate` is idempotent. It must not rewrite approved narrative,
  invent answers, or silently remove a chapter that disappears from a glob.
- A new chapter is added to the manifest first, then generated and reviewed.
- A removed chapter is superseded, deprecated, archived, or removed through the
  preservation protocol; generation never deletes it automatically.
- All commands must run without production credentials or network-only evidence.
- The project-level `verify` command and CI run every applicable documentation
  check.
- `docs:data:check` must reconcile the canonical schema artifact with the book:
  every maintained application table and physical column must map to exactly
  one documented DATA contract, and every documented current table/column must
  exist in the named schema source. It must reject a table represented only by
  a catalog row, summary paragraph, ERD node, migration name, or field-name
  list. Parser limitations and provider-owned objects must be explicit and
  covered by deterministic fixtures or a reviewed exception; silently skipping
  an unsupported schema construct is forbidden.
- CI fails on broken local links, duplicate stable IDs, malformed metadata,
  schema-invalid manifests, missing manifest paths, header/manifest drift,
  invalid navigation, an approved chapter that is only a skeleton or contains a
  blocking/template placeholder, empty evidence for `verified`, or unresolved
  blocking traceability gaps. Draft chapters may retain explicit owned
  `[OPEN: ...]` markers, but their status must keep dependent gates honest.
  When persisted data is active CI also fails on duplicate
  data/query/transaction/migration IDs, a catalog table without its required
  contract, an implemented path that does not exist, unresolved tenant-scope or
  activity-table coverage, or `Verified` database claims without evidence.
  When UI is active it also fails on missing registry screen
  files, reused screen/flow IDs, contradictory route ownership, missing required
  screen sections, approved placeholder text, or `Verified` screen contracts
  without named evidence.

### 4.16 Conditional chapters and status honesty

Conditional does not mean forgotten.

Every conditional chapter must state:

- current decision: active or `N/A`
- reason
- activation trigger
- owner
- next review point

Examples:

- Web UI, API implementation, and Flutter: each is active only when approved;
  an externally consumed API does not activate local API implementation.
- Realtime events: the decision record remains active even when implementation
  is request-driven.
- Realtime protocol: `N/A` until a live transport is approved; activate it when
  a workflow requires live server/client messages.
- BullMQ: active when asynchronous or scheduled work exists.
- Production and runbooks: generated early, incomplete until a real target
  exists.

### 4.17 AI project-book generation contract

When asked to create a new project book, AI must:

1. read every module in the approved project-mode plan completely
2. inspect the actual repository and existing document family
3. identify profile and current-versus-target boundaries
4. produce the preservation matrix
5. create the clarification register and ask blocking questions using Section
   4.18
6. materialize root `AGENTS.md` from the installed standards skill asset
   `assets/project-template/docs/guidelines/AGENTS.template.md`, replace every
   placeholder with exact project paths and commands, and register it in the
   executable project contract without copying the remaining reusable package
7. create the manifest, manifest schema, documentation command skeleton, and
   every required or fixed-path conditional chapter skeleton; create collection
   children only for identified subjects under Section 4.1
8. generate chapters in the gate order from Section 4.12
9. use `[OPEN: question — owner — target]` instead of inventing product truth
10. use `N/A` only with reason, activation trigger, owner, and next review point
11. use real product terms and examples; never ship template filler
12. maintain stable IDs, metadata, navigation, and relative links
13. run the Gate 6 book audit through the stable commands
14. report clarification, preservation, generation, and verification results

Required final report:

```md
## Project-book generation report

- Profile:
- Current runtime:
- Target runtime:
- Chapters created:
- Chapters adapted:
- Chapters marked N/A:
- Existing content kept/adapted/split/moved/replaced/archived/removed:
- Clarifications requested:
- Decisions received:
- Recorded assumptions:
- Open product decisions:
- Broken links:
- Dependency/stack-integrity gaps:
- Traceability gaps:
- Screen/flow contract gaps:
- Unverified claims:
- Next chapter to review:
```

The default outcome is a reviewable book, not a pile of apparently approved
documents. Pause the dependent chapters at the first gate where an unresolved
decision would materially change their contracts and request product-owner
direction. Continue independent inventory and already-safe work while waiting.

### 4.18 Requirements clarification protocol

AI and human authors must ask for clarification when available evidence is not
enough to make a material product or architecture decision safely.

Before asking:

1. inspect the repository, supplied references, current documents, source,
   configuration, schemas, tests, and named runtime evidence
2. separate facts, approved decisions, current behavior, target intent,
   assumptions, and unknowns
3. determine which unknowns are blocking now and which can wait for a later gate

Ask when an answer can materially change:

- product audience; exact actor ID/display/authentication sources; actor types,
  role assignments, roles, permissions, ownership; or authorization-scope
  names, IDs, hierarchy, resolution, and isolation boundaries
- workflow states, business invariants, irreversible behavior, money, inventory,
  approvals, or retention
- target platforms, offline/realtime behavior, integrations, compliance, or
  privacy
- owned web/API/native profiles, supported native targets, and whether each API,
  database, deployment, and generated contract is owned here or consumed externally
- API result meaning, database design, migration safety, authorization, audit,
  recovery, or release scope
- a choice that would cause substantial rework or make later documents
  contradictory

Before finalizing `database-schema.md`, treat these as blocking when the
repository and approved product/domain chapters do not answer them:

- which module owns each entity and whether a row is tenant, platform, user, or
  shared scope
- business identity versus internal/public identifiers and whether an
  identifier crosses a trust boundary
- cardinality, optionality, null meaning, uniqueness, delete behavior, and
  historical snapshot requirements for each relationship
- state transitions, money/precision, inventory/capacity, ordering, effective
  time, and other database-enforced invariants
- concurrency, stale revision, idempotency, transaction boundaries, and
  reliable outbox/job/activity effects for important writes
- expected volume/growth, common filters/order/pagination, reporting, retention,
  archive, legal hold, and purge requirements
- personal/sensitive data classification, encryption, tenant/RLS enforcement,
  support/export access, and anonymization/deletion obligations
- current data/migration/backfill compatibility when an implementation already
  exists

Question rules:

- Ask a small prioritized batch of related questions instead of one vague
  request for “more requirements.”
- Clarification is iterative. Ask again at a later gate when new evidence exposes
  a material ambiguity; an earlier answer does not authorize guessing unrelated
  decisions.
- Explain why each answer matters and name the chapters or decisions it affects.
- Offer concrete mutually exclusive options and tradeoffs when the evidence
  supports them. Mark a recommendation as a recommendation, not an established
  fact.
- Do not force a default for a material unknown merely to continue generation.
- Do not ask the user for information that can be discovered safely from the
  repository or approved references.
- Do not fabricate a decision owner, approval, review date, evidence, or deadline.
  An unknown owner is explicitly unassigned; identify the gate that needs the
  answer and ask for an owner when accountability is material.
- If the user explicitly delegates a choice, record the chosen assumption,
  rationale, owner, review trigger, and affected IDs before continuing.
- For a non-blocking unknown, generate only reversible structure and record
  `[OPEN: question — impact — owner — target]` in the owning chapter and
  `requirements-traceability.md`.
- For a blocking unknown, finish the already-safe inventory and skeleton work,
  mark dependent chapters blocked, and ask before generating their substantive
  contracts.

Maintain this clarification register in `docs/requirements-traceability.md`
until each item is resolved:

| Question ID | Question | Known evidence | Options/tradeoffs | Impacted chapters/IDs | Decision owner | Needed by | Status/decision |
| --- | --- | --- | --- | --- | --- | --- | --- |

When an answer arrives, update the canonical owning chapter, glossary,
traceability, manifest status, dependent chapters, and change history. Remove
stale placeholders; do not leave a resolved answer only in chat history.

### 4.19 Complete requirement and generated-document review

When the user requests a complete review, inventory the whole declared scope
before selecting findings. Review every module in its project-mode plan and
every applicable output family in Section 4.1. A reusable-package review covers
all registered profiles and capabilities, including currently inactive ones; a
consuming-project review uses its approved applicability decisions. Reading and
review coverage is separate from runtime test selection under GDL-080.

Maintain a review matrix in the work plan, with one row for every cataloged
family and each existing canonical chapter or generated artifact:

| Requirement/output | Canonical owner | Applicability and evidence | Actual file or generator | Source/consumer reconciliation | Result and gap | Decision needed |
| --- | --- | --- | --- | --- | --- | --- |

Cover product, glossary, domains, phases and commercial decisions; web UI,
copy, tokens, screens, flows and accessibility; API schemas and result codes;
data, permissions, security and activity; Flutter/native contracts; conditional
jobs, realtime, files, payments and printing; testing, operations and release;
and the book manifest/schema, indexes, navigation, root instructions and
documented commands. Inventory generated API/model/schema/code outputs where
the project uses them, even if they are not Markdown chapters.

For each existing output, read its complete applicable contract, compare it
with approved requirements and actual owning source, and follow its links to
dependent outputs. Check applicability, canonical ownership, precise product
content, states/failures/recovery, compatibility, missing or contradictory
requirements, stale claims, and whether its checker tests the intended
contract. Mark each row reviewed, missing, not applicable with reason, or blocked
by a named question. A sampled screen or one passing package check cannot prove
all requirements and all generated documents were reviewed.

For derived outputs, identify the maintained generator, inputs, generated
regions, preservation boundary, and reproducible command. Where generation is
available and safe, generate in an isolated fixture or disposable output and
prove a second run is unchanged. Validate malformed, missing, stale, and
conflicting inputs with the existing relevant fixtures. Never regenerate
authored product truth or create filler merely to satisfy a file count.

The reusable package's module planner and integrity checker do not generate or
validate a consumer's project book, API implementation, or native app. If the
consumer book, generator, source, or required checker is absent, report that
boundary explicitly. When the user requests review of an existing generated
book whose project path is unknown, ask for the project location after checking
the available workspace. Finish the reusable-contract review independently.

Ask focused questions under Section 4.18 when missing product or platform
information blocks a row. The final review names the inventory covered,
corrections made, remaining decisions, verification evidence, and exact
unreviewed boundaries. Do not describe an item as approved, implemented, or
verified merely because its template or filename exists.
