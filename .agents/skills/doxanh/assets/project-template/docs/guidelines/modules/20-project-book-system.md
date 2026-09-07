
## 4. Project book and document-generation system

### 4.1 Create one ordered project book before broad implementation

The project document family is one book, not a folder of unrelated Markdown
files. Generate the complete skeleton at project start, keep a stable reading
order, and review chapters in dependency order. Mark conditional documents as
`N/A` with a reason and activation trigger rather than silently omitting them.

The catalog below covers output families, not a fixed number of files. Create
one honest N/A stub for an inactive fixed-path chapter. For variable collections
such as domain specifications, page overrides, screens, flows, runbooks, and
ADRs, record the family decision in the book cover and create child entries only
for identified project subjects. Never invent a domain, screen, override,
runbook, or ADR merely to fill a path pattern. Register each real child by its
exact path; a glob is not a chapter. Existing collection indexes own an inactive
family's explanation when available.

Here, “serious UI” means a maintained product interface with important user
workflows or multiple screens. A disposable experiment may record why those
additional design artifacts are N/A; an implemented product screen cannot use
that label to avoid its interaction, copy, accessibility, and evidence contract.
Keep shared patterns once and document each screen's differences.

Choose `nuxt-web`, `nuxt-api`, and `flutter-native` independently from approved
repository ownership; `shared` applies to every project. A web or native client
may consume an external API without owning that service, its database, or its
deployment. Record that boundary and the consumed contract; do not generate a
Nuxt server, PostgreSQL schema, web interface, or signing pipeline merely because
another profile exists in the standard. An unknown profile or ownership choice
uses the clarification protocol before substantive generation.

| Document | Status | Canonical responsibility |
| --- | --- | --- |
| root `AGENTS.md` | Required repository control | Concise automatically discovered bootstrap, rule-selection, change-safety, verification, and honest-completion protocol materialized from the installed standards skill template; it links to canonical owners instead of duplicating their rules. |
| `.doxanh-project-standards.json` | Required standards reference | Reference-only lock naming the selected external guideline release and skill contract. It contains no copied guideline files. |
| `docs/book-manifest.yaml` | Required | Machine-readable chapter order, paths, profiles, activation rules, owners, dependencies, lifecycle, and implementation status. |
| `docs/book-manifest.schema.json` | Required | Machine-readable validation contract for the manifest structure and allowed values. |
| `docs/README.md` | Required | Human-readable book cover, reading paths, document map, owners, statuses, and canonical sources. |
| root `README.md` | Required | Project orientation, verified bootstrap path, runnable workspace, and links into the project book. |
| `docs/product-spec.md` | Required | Problem, audience, actors, workflows, rules, states, outcomes, exclusions, and success measures. |
| `docs/glossary.md` | Required | Stable product terms, meanings, and forbidden synonyms. |
| `docs/domain/<domain>-spec.md` | Conditional | Detailed business rules for a substantial domain using the project's exact domain vocabulary. |
| `docs/module-breakdown.md` | Required for multi-module products | Product capability modules, owners, inputs, outputs, dependencies, and delivery boundaries. |
| `docs/mvp-phases.md` | Required | Phase scope, outputs, dependencies, exit evidence, and deferred work. |
| `docs/requirements-traceability.md` | Required | Requirement-to-screen/API/DATA-QRY-TX/permission/activity/event/job/test/evidence coverage. |
| `docs/commercial-model.md` | Conditional when pricing, trials, plans, quotas, or contracted access exist | Reusable offering definitions, assignee-specific access periods/status/overrides, entitlement evaluation, lifecycle, billing meaning, and administration rules. |
| `docs/system-architecture.md` | Required | Runtime topology, module boundaries, data flow, integrations, and deployment model. |
| `docs/engineering-standards.md` | Required | Exact versions, chosen package manager, directories, commands, code rules, and approved exceptions. |
| `docs/local-development.md` | Required for each runnable profile | Actual Docker/Compose or native host topology, setup, documented commands, dependencies, seeds, reset safety, and troubleshooting. |
| `docs/api-contract.md` | Required when implementing or consuming an API | Owned or externally authoritative endpoints, auth, request/response schemas, errors, pagination, idempotency, and examples; explicitly distinguish implementation ownership from consumption. |
| `docs/database-schema.md` | Required when the repository owns a persisted database schema | Actual physical data model, fields, relationships, isolation, lifecycle, transaction/query paths, constraints, indexes, migrations, scale, and evidence. External databases are referenced, not invented as local schema. |
| `docs/activity-log.md` | Required for owned durable business/audit activity; otherwise N/A with external ownership | Durable activity/audit semantics, module and tag registry, actor/source/target context, access, retention, and verification. |
| `docs/security-model.md` | Required | Authentication, session, authorization, threats, secrets, abuse controls, and audit policy. |
| `docs/permissions-matrix.md` | Required | Actor × action × scope × state permissions. |
| `docs/ui-system.md` | Required for UI | Master layouts, page templates, component mappings, responsive rules, states, copy, and feedback surfaces. |
| `docs/design-tokens.md` | Required for UI | Approved project theme roles and active-platform mappings, type, spacing, widths, motion, and accessibility pairs; use baseline defaults only when the project has no approved design. |
| `design-system/MASTER.md` | Required for serious UI | Approved qualitative design direction and anti-patterns. |
| `design-system/pages/*.md` | Conditional | Page-specific overrides only; no repeated master rules. |
| `docs/mock-ui/README.md` | Required for serious UI | Human entry point, machine-reviewable screen registry, route/actor/template/state coverage, flow map, legends, owners, and evidence status. |
| `docs/mock-ui/shared-patterns.md` | Required for serious multi-screen UI | Reusable shell, page-family, feedback, navigation, table/list, form, and responsive behavior referenced by screens. |
| `docs/mock-ui/screens/<screen-code>-<slug>.md` | Required for important screens | One canonical mobile-first screen contract containing wireframes, exact content, controls, data, permissions, states, responsive adaptation, accessibility, tests, and evidence. |
| `docs/mock-ui/flows/<flow-code>-<slug>.md` | Conditional for important multi-screen workflows | Ordered screen/action transitions, success and handled-failure branches, back/cancel/recovery behavior, and end-to-end evidence. |
| `docs/checklist/UI-UX-CHECKLIST.md` | Required for serious UI | Release-severity UI/UX checklist and phone/tablet/desktop, theme, keyboard, touch, and motion evidence contract. |
| `docs/test-strategy.md` | Required | Test layers, fixtures, environments, risk coverage, evidence, and release gates. |
| `docs/observability.md` | Required | Log schema, event catalog, metrics, traces, health checks, alerts, dashboards, and retention. |
| `docs/jobs-and-schedulers.md` | Required when BullMQ is used | Queue catalog, payload schemas, idempotency, retries, scheduling, concurrency, and runbooks. |
| `docs/realtime-events.md` | Required decision record | Current realtime scope or explicit request-driven decision and future candidate events. |
| `docs/realtime-protocol.md` | Conditional when realtime is active | Wire protocol, connection lifecycle, gateway topology, authentication, subscription, command/result, client recovery, limits, and scaling contracts. |
| `docs/release-readiness.md` | Required | Go/no-go checklist, migration order, rollback, smoke tests, and evidence. |
| `docs/production-readiness.md` | Required before deployment | Runtime contract, secrets, infrastructure, scaling, backup, restore, monitoring, and incident readiness. |
| `docs/runbooks/` | Required before production | Deploy, rollback, restore, queue recovery, migration failure, and incident procedures. |
| `docs/adr/` | Required | Durable architecture and standards deviations. |
| `docs/source-file-guide.md` | Required once non-trivial | Where responsibilities live and where future contributors should start. |
| `docs/flutter-standards.md` | Required when Flutter is used | Exact Flutter versions, packages, architecture, code generation, commands, testing, and approved exceptions. |
| `docs/mobile-platform-contract.md` | Required when Flutter is used | API environment, auth/session, deep links, push, permissions, offline behavior, analytics, versioning, and store-release contracts. |

This standard does not generate `current-status.md`, next-session handoffs,
session diaries, dated progress reports, temporary remediation backlogs, or
similar continuation artifacts. They are not project-book chapters and must not
be added to the manifest. Move durable requirements and decisions into their
canonical development chapter, unresolved questions into
`requirements-traceability.md`, architecture exceptions into ADRs, and
release-specific proof into `release-readiness.md`.

Every generated project must also expose the documentation command
contract from Section 4.15. The implementation may live under `scripts/docs/`
or another documented tooling directory, but it is maintained source, not an
unreviewed one-off AI script.

Every generated project must materialize the installed standards skill asset
`assets/project-template/docs/guidelines/AGENTS.template.md` as root
`AGENTS.md` before broad design or implementation. Replace its placeholders
with exact repository paths and commands, keep it short enough to load for
every task, and register it as maintained policy input. Do not copy the
remaining reusable guideline files into the application repository. The executable
`contract:check` must reject a missing file, unresolved placeholder, missing
canonical link, missing preflight/final verification instruction, or an
unregistered nested `AGENTS.md`. Nested instruction files are allowed only when
a sub-tree needs narrower rules; they may add scope-specific constraints but
must not weaken or duplicate the root contract.

### 4.2 Standard chapter header

Every canonical Markdown chapter must begin with a real metadata block:

```md
# Document title

> Chapter: <ID>
> Lifecycle: Draft | In review | Approved | Superseded | Deprecated
> Implementation: Proposed | Not started | In progress | Implemented | Verified | N/A
> Owner: <role or person>
> Reviewers: <roles or people>
> Last reviewed: YYYY-MM-DD
> Canonical for: <one-sentence responsibility>
> Depends on: <relative links or None>
> Produces: <relative links or consumers>
> Evidence: <links, or Not tested — reason, owner, and target>

[Previous](./previous.md) · [Book](./README.md) · [Next](./next.md)
```

Use `Lifecycle` for document approval and `Implementation` for actual delivery.
An approved design may still be not started; implemented behavior may still be
unverified. `Verified` requires named evidence, environment, and date.
Use repository-relative links that resolve from the current file. First and
last chapters omit only the unavailable Previous or Next link. The governance
source itself may omit book navigation because it sits outside the generated
project-specific sequence.

Use this chapter anatomy when applicable:

1. goal and reader outcome
2. scope and non-goals
3. upstream inputs and approved decisions
4. contracts or detailed requirements
5. states, failures, edge cases, and recovery
6. security, permission, privacy, and audit impact
7. observability and operational impact
8. verification, acceptance, and evidence
9. open questions with owner and target date
10. change history

Do not force irrelevant prose into every heading. Mark an important but
inapplicable section `N/A` with a reason.

### 4.3 Canonical ownership and consistency

- `product-spec.md` owns business truth.
- `glossary.md` owns product vocabulary.
- Domain specs own detailed business behavior.
- `module-breakdown.md` owns capability decomposition.
- `mvp-phases.md` owns delivery sequencing.
- `requirements-traceability.md` owns coverage links and the centralized
  clarification register, not the underlying requirements.
- `commercial-model.md` owns detailed offering-versus-assignment semantics when
  commercial access exists; it consumes product truth and does not own payment
  processing or authorization implementation.
- `system-architecture.md` owns runtime and dependency boundaries.
- `engineering-standards.md` owns exact implementation choices.
- `local-development.md` owns the executable developer environment and command
  contract; it does not redefine production topology.
- `api-contract.md` owns external and client/server contracts.
- `database-schema.md` owns the physical data model, persisted field meaning,
  database-enforced invariants, tenant-safe relationships, transaction/query
  paths, migrations, and database verification. It consumes business meaning
  from product/domain chapters instead of inventing it.
- `activity-log.md` owns the durable activity taxonomy, module/tag registry,
  capture rules, readers, and business meaning; `database-schema.md` still owns
  the physical `activity_logs` table and indexes.
- `security-model.md` owns threats and security controls.
- `permissions-matrix.md` owns actor/action/scope/state decisions.
- `realtime-events.md` owns durable product/event semantics independent of
  transport.
- `realtime-protocol.md` owns the live wire protocol, connection lifecycle,
  gateway/fanout contract, and web/Flutter recovery behavior.
- `system-architecture.md` owns where realtime processes and dependencies are
  deployed and how they relate to the rest of the system.
- `jobs-and-schedulers.md` owns asynchronous execution contracts.
- `ui-system.md` owns structure and responsive composition.
- `design-tokens.md` owns exact visual values.
- `docs/mock-ui/README.md` owns the screen registry and flow map.
- `docs/mock-ui/shared-patterns.md` owns reusable mock-level composition and
  interaction patterns; a screen links to them instead of copying them.
- Individual mock-screen files own reviewed screen composition, exact visible
  content, control/data mapping, state variants, and interaction destinations.
- Mock flow files own transitions between screen contracts, not the behavior
  inside each screen.
- `flutter-standards.md` owns Flutter implementation and package decisions.
- `mobile-platform-contract.md` owns native integration and release behavior.
- `design-system/MASTER.md` owns qualitative visual direction.
- page design-system files own only explicit page deviations.
- `test-strategy.md` owns verification strategy and evidence levels.
- `observability.md` owns telemetry contracts and alert/runbook mapping.
- `release-readiness.md` owns release-specific go/no-go evidence.
- `production-readiness.md` owns the durable production contract.
- Runbooks own executable recovery procedures.
- ADRs own consequential decisions and exceptions.

Do not copy the same rule into several documents. State it once, link to it, and
keep dependent documents focused on how they consume it.

### 4.4 Requirements traceability

Maintain `docs/requirements-traceability.md` for important requirements:

| Requirement | Actor | Workflow/state | Screen/route | API/use case | DATA/QRY/TX | Permission | Activity tag/record | Event/job | Test | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

High-risk requirements must trace from product rule through every applicable
owned boundary: UI, server enforcement, database state, registered activity
tag/durable row, and automated proof. Mark absent boundaries N/A and reference
external contract ownership; never imply that a client test verified an external
service's internal database or authorization implementation.

### 4.5 Documentation quality rules

- Use real product language and examples.
- Name all important routes, states, events, fields, and owners.
- Record unsupported behavior and non-goals.
- Include failure examples, not only happy paths.
- Keep diagrams small and responsibility-focused.
- Distinguish proposed, not started, in progress, implemented, visually
  reviewed, interaction-tested, data-verified, and end-to-end claims.
- `N/A` means outside scope. `Not tested` means in scope but not verified and
  must include a reason and follow-up owner.
- Do not hide missing verification behind `Partial`.
- Do not mix current runtime truth and target architecture without labels.
- Do not claim implementation from a design document or verification from a
  generated/mock/seeded artifact without naming that boundary.
- Open questions name impact, options, owner, and target date.

Generation and approval are different gates:

- `Generated skeleton` means the manifest entry, metadata, navigation, required
  headings/matrices, and explicit `[OPEN: ...]` markers exist. It is not
  substantive documentation.
- `Reviewable` means the applicable minimum content contract in Sections
  4.7–4.11 is complete, canonical links resolve, examples use real product
  language, and remaining open questions are non-blocking and owned.
- `Approved` means reviewers accepted the substantive contract and no blocking
  placeholder, contradictory owner, or unresolved high-risk decision remains.
- `Verified` describes implementation proof only and still requires the
  environment, date, source/artifact identity, and evidence link.

The book checker must not let a generated skeleton satisfy an approval or
implementation-ready gate merely because every expected file exists.

### 4.6 Book manifest, parts, and reading order

`docs/book-manifest.yaml` is canonical for chapter order, path, profile,
activation condition, owner, dependency, lifecycle, implementation status,
evidence, review state, and navigation. `docs/book-manifest.schema.json`
validates the manifest. `docs/README.md` is its human-readable book cover.
Chapter headers repeat the applicable manifest fields and must stay
synchronized.

Minimum manifest shape:

```yaml
schema_version: 1
generated_from: doxanh-project-standards@<version>

book:
  title: "<Project name> Project Book"
  owner: product-owner
  profiles:
    - shared
    # Choose each owned profile explicitly; this example owns a web UI only.
    - nuxt-web
    # Add nuxt-api and/or flutter-native only when approved.
  default_locale: en

chapters:
  - id: "00"
    part: orientation
    path: docs/README.md
    title: Project book
    requirement: required
    profiles:
      - shared
    activation:
      state: active
      condition: always
      reason: Required human entry point.
      trigger: null
      next_review: "YYYY-MM-DD"
    owner: product-owner
    reviewers:
      - engineering-lead
    depends_on: []
    produces:
      - README.md
    lifecycle: draft
    implementation: proposed
    last_reviewed: "YYYY-MM-DD"
    evidence: []
    navigation:
      previous: null
      next: README.md
```

Allowed values:

- `profiles`: `shared`, `nuxt-web`, `nuxt-api`, or `flutter-native`
- `requirement`: `required` or `conditional`
- `activation.state`: `active` or `not-applicable`
- `lifecycle`: `draft`, `in-review`, `approved`, `superseded`, or `deprecated`
- `implementation`: `proposed`, `not-started`, `in-progress`, `implemented`,
  `verified`, or `not-applicable`

Manifest rules:

- `schema_version` changes only when the manifest contract changes.
- The JSON Schema requires every chapter field shown in the minimum shape.
  Use explicit `null` or an empty list only where the schema permits it; do not
  omit keys differently from project to project.
- Every canonical Markdown file has its own manifest entry and unique ID.
  Never place a glob or several chapter paths in one entry.
- Collection indexes use the assigned whole-number ID. Children use stable
  string IDs such as `22.01`, `23.01`, `52.01`, or `53.01` in explicit order.
- Required chapters use `activation.state: active`.
- Fixed-path conditional chapters still have a real file. Variable collections
  follow the family decision above and contain only identified children. When
  a fixed chapter or collection index is inactive, use
  `activation.state: not-applicable`, a reason, activation trigger, owner, and
  next review date; set `implementation: not-applicable`.

Header and manifest status values map exactly:

| Header value | Manifest value |
| --- | --- |
| `Draft` | `draft` |
| `In review` | `in-review` |
| `Approved` | `approved` |
| `Superseded` | `superseded` |
| `Deprecated` | `deprecated` |
| `Proposed` | `proposed` |
| `Not started` | `not-started` |
| `In progress` | `in-progress` |
| `Implemented` | `implemented` |
| `Verified` | `verified` |
| `N/A` | `not-applicable` |

Additional manifest rules:

- The chapter header's `Chapter` value must equal the manifest `id`. No other
  status or ID normalization is implicit.
- `evidence` contains repository-relative paths or durable external evidence
  identifiers. `verified` is invalid when `evidence` is empty.
- `navigation.previous` and `navigation.next` are derived from manifest order,
  including honest N/A stubs. Do not hand-maintain a competing order.
- Index pages, generated chapter tables, and navigation are derived artifacts.
  Mark generated regions so regeneration cannot overwrite authored prose.
- The schema and checker reject unknown manifest keys unless the schema version
  explicitly permits them.

Use these parts and chapter ranges. Filenames stay descriptive; chapter IDs
provide order without forcing numeric filename prefixes.

| Part | Chapters | Documents |
| --- | --- | --- |
| I. Orientation | `00–09` | `docs/README.md` and the root `README.md`. |
| II. Product and scope | `10–19` | Product spec, glossary, domain spec, module breakdown, MVP phases, traceability, and conditional commercial model. |
| III. Experience design | `20–29` | UI system, design tokens, design-system master/overrides, mock UI, and UI/UX checklist. |
| IV. Architecture and contracts | `30–39` | System, API, database, security, permissions, activity/audit, realtime, jobs/schedulers, and mobile-platform contracts. |
| V. Engineering and quality | `40–49` | Engineering, Flutter standards, source guide, test strategy, observability, and local development. |
| VI. Delivery and operations | `50–59` | Release readiness, production readiness, runbooks, and ADRs. |

Recommended chapter assignment:

| ID | Path |
| --- | --- |
| `00` | `docs/README.md` |
| `01` | root `README.md` |
| `10` | `docs/product-spec.md` |
| `11` | `docs/glossary.md` |
| `12` | `docs/domain/<domain>-spec.md` |
| `13` | `docs/module-breakdown.md` |
| `14` | `docs/mvp-phases.md` |
| `15` | `docs/requirements-traceability.md` |
| `16` | `docs/commercial-model.md` when its capability is active; otherwise an honest N/A stub. |
| `20` | `docs/ui-system.md` |
| `21` | `docs/design-tokens.md` |
| `22` | `design-system/MASTER.md`; page overrides use `22.xx` entries. |
| `23` | `docs/mock-ui/README.md`; shared patterns, individual screens, and important flow files use explicit `23.xx` entries. |
| `24` | `docs/checklist/UI-UX-CHECKLIST.md` |
| `30` | `docs/system-architecture.md` |
| `31` | `docs/api-contract.md` |
| `32` | `docs/database-schema.md` |
| `33` | `docs/security-model.md` |
| `34` | `docs/permissions-matrix.md` |
| `35` | `docs/realtime-events.md` |
| `36` | `docs/jobs-and-schedulers.md` |
| `37` | `docs/mobile-platform-contract.md` |
| `38` | `docs/realtime-protocol.md` |
| `39` | `docs/activity-log.md` |
| `40` | `docs/engineering-standards.md` |
| `41` | `docs/flutter-standards.md` |
| `42` | `docs/source-file-guide.md` |
| `43` | `docs/test-strategy.md` |
| `44` | `docs/observability.md` |
| `45` | `docs/local-development.md` |
| `50` | `docs/release-readiness.md` |
| `51` | `docs/production-readiness.md` |
| `52` | `docs/runbooks/README.md`; individual runbooks use `52.xx` entries. |
| `53` | `docs/adr/README.md`; individual ADRs use `53.xx` entries. |

Default reading paths:

- Product review: `00 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15`, then `16` when commercial access is active.
- UI/UX review: `00 -> 10 -> 11 -> 20 -> 21 -> 22 -> 23 -> 24`
- Web development: `00 -> 10 -> 13 -> 30 -> 31 -> 32 -> 34 -> 39 -> 38 -> 40 -> 45 -> 42 -> 43` when realtime is active; otherwise omit `38`.
- API development: `00 -> 10 -> 13 -> 30 -> 31 -> 32 -> 33 -> 34 -> 39 -> 40 -> 45 -> 42 -> 43`; omit N/A database/activity chapters and add active capability contracts.
- Flutter development: `00 -> 10 -> 11 -> 20 -> 21 -> 23 -> 30 -> 31 -> 33 -> 34 -> 37 -> 41 -> 42 -> 43 -> 45`, and `38` when realtime is active; web implementation chapters apply only when the project also owns web UI.
- Security review: `10 -> 31 -> 32 -> 33 -> 34 -> 39 -> 35 -> 36 -> 38 -> 44`
- Activity/audit review: `10 -> 13 -> 31 -> 32 -> 33 -> 34 -> 39 -> 43 -> 44 -> 51`
- Realtime review: `10 -> 30 -> 31 -> 33 -> 34 -> 35 -> 38 -> 43 -> 44 -> 51`
- Release review: `43 -> 44 -> 50 -> 51 -> 52`
- New contributor or AI: `00 -> 01 -> 10 -> 11 -> 13 -> 30 -> 40 -> 45 -> 42`

`docs/README.md` must render at least this chapter table from the manifest:

| ID | Part | Chapter | Path | Requirement/activation | Lifecycle | Implementation | Owner | Evidence/review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
