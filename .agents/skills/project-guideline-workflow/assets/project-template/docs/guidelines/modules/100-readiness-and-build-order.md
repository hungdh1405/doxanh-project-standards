
## 15. Ready and done checklists

### 15.1 Project ready for implementation

- [ ] Repository census, current-versus-target boundary, and preservation map are complete.
- [ ] Root `AGENTS.md` is materialized from the approved template, contains no
  unresolved placeholders, links to canonical owners, names exact preflight
  and verification commands, is included in maintained-content checks, and
  passes `contract:check`.
- [ ] Manifest, manifest schema, `docs/README.md`, chapter skeletons, metadata, navigation, and documentation commands exist and pass.
- [ ] Product problem, audience, actors, vocabulary, workflows, states, and exclusions are approved.
- [ ] The capability-decision table is complete; every active capability has a
  canonical chapter and every N/A capability has a reason and activation
  trigger. No material capability remains `undecided` for the first slice.
- [ ] Module boundaries, MVP phases, and high-risk requirement traceability are approved.
- [ ] Application role/capability, permission, ownership, revocation, impersonation, and direct-denial rules are approved.
- [ ] Per-actor authentication, recovery, session/device limit, replacement,
  revocation, realtime effect, and race-test rules are approved.
- [ ] When commercial access exists, offering definitions and assignee-specific
  dates/status/overrides/counting semantics are separated and approved.
- [ ] Screen registry, flow map, master layouts, page templates, component legend, and shared mock patterns are approved.
- [ ] The application master page defines top bar, default shadcn-vue sidebar,
  one bounded main `ScrollArea`, scroll reset/restoration, and intentional
  phone/tablet/desktop behavior.
- [ ] Nuxt slot-based master-layout components, Pinia loading leases,
  `AppLoadingOverlay`, tracked request adapters, `noLoading` policy, centralized
  500 ms hold, timeout/watchdog behavior, and concurrency tests are approved.
- [ ] The cross-platform create/update/delete confirmation contract, shared web
  and Flutter dialog compositions, copy rules, bulk scope, cancel/focus
  behavior, and loading handoff are approved.
- [ ] The shared web action footer has one action-only content boundary, one
  safe-to-commit DOM/tab/visual order, phone touch-safe stacking, compact
  tablet/desktop grouping, and executable drift checks.
- [ ] Important screen files use the strict Section 8.9 contract; phone-first wireframes, visible shell/scroll ownership, copy, controls, data, states, permissions, responsive behavior, and evidence expectations are complete.
- [ ] Audience/surface separation, entity-detail action ownership, long-
  collection discovery, stable item anatomy, overlay behavior, and every
  rendered action outcome are explicit.
- [ ] When shareable or multi-audience entries exist, the entry registry defines
  canonical environment hosts/paths, discovery placement, locator/proof
  separation, revocation, and tests.
- [ ] Every applicable data table/list has a reviewed column contract, mobile
  behavior, and default shadcn-vue pagination contract; every applicable form
  has a reviewed field/validation/result contract.
- [ ] Green light/dark shadcn-vue theme and design system are approved.
- [ ] `docs:data:check` passes; every persisted table has a complete field/FK/
  constraint/index contract, and tenant, lifecycle, TX, QRY, role/RLS,
  migration, capacity, and evidence catalogs resolve without blocking gaps.
- [ ] Architecture, API, field-level schema, PostgreSQL role/RLS, migration,
  cache, queue, full-context logging, durable `activity_logs` table,
  module/tag registry, activity access/retention, and security contracts exist.
- [ ] Realtime events contain the current request-driven/live decision; when live transport is active, the protocol, gateway, ticket auth, Redis fanout, reconnect/refetch, capacity, and web/Flutter contracts are approved.
- [ ] Package manager, runtime, module set, Docker/Compose topology, Make command surface, networks, volumes, and reset boundaries are selected.
- [ ] The approved-dependency registry is complete; `deps:check` and
  `standards:check` pass with no deprecated, forbidden, duplicate-concern,
  cross-profile, or unowned package.
- [ ] `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `Makefile`, and `docs/local-development.md` exist and their clean-clone setup is verified.
- [ ] If Flutter is in scope, its standards, platform contract,
  `AppMasterPage`/`AppMasterLayout`, Riverpod loading leases, Dio interceptor,
  root blocking overlay, adaptive layouts, target platforms, and release
  pipeline are approved.
- [ ] MVP phases and first vertical slice have exit evidence.
- [ ] Book audit has no broken local links, duplicate stable IDs, contradictory canonical rules, or unowned blocking questions.

### 15.2 Screen/feature ready

- [ ] The pre-edit `rules:plan` includes every anticipated project-relative
  path and has identified the applicable stable rule IDs, automated commands,
  manual evidence, and not-applicable decisions for the intended change.
- [ ] `VERIFY-SCOPE-001` records the change classification, affected boundaries
  and risks, selected and excluded evidence with reasons, and the objective
  full-regression decision; no unresolved safe fallback is being executed.
- [ ] Actor, route, purpose, upstream state, and downstream effect are known.
- [ ] The screen has a unique registry entry and canonical screen file; important transitions are linked from the flow map.
- [ ] Primary action by state is known.
- [ ] Master layout, top-bar/sidebar behavior, page template, primary scroll
  owner, reset/restoration behavior, and required web or native adaptive
  compositions are defined.
- [ ] Every data/heavy-work dependency declares global blocking, local content,
  background/`noLoading`, or none; its loading owner and escape rationale are
  explicit.
- [ ] Every user-initiated create/update/delete command defines its confirmation
  trigger, exact action/target/effect copy, cancel behavior, one confirmed
  request, result feedback, and tests.
- [ ] Every form or overlay with actions references the Section 8.11.2 shared
  footer; no screen-local action order, text/action split, reverse utility, or
  undersized phone control remains.
- [ ] The platform component mapping is defined: shadcn-vue for web or default Material/platform widgets for Flutter.
- [ ] DATA tables/fields, TX write boundary, QRY read path, validation,
  permissions, activity `module_key`/`tag_type`, audit, and error rules are
  defined.
- [ ] Every concurrently mutable aggregate defines revision ownership, atomic
  scoped predicate, handled stale result, winning-only effects, UI
  refresh/reapply, and independent-client proof.
- [ ] Content/control and data-dependency rows are complete; conditional table/list and form contracts are complete or explicitly `N/A` with reason.
- [ ] A growing result list uses the canonical shadcn-vue pagination, route
  query, page-size, result-count, loading, failure, and selection-scope rules.
- [ ] Loading, empty, failure, conflict, success, and destructive states are defined where relevant.
- [ ] Every visible control has a real authorized handler/destination, result
  feedback, and test; no placeholder or close-without-action control remains.
- [ ] Required test and evidence levels are known.

### 15.3 Feature done

- [ ] `verify:changed` passes for the current maintained-content fingerprint;
  `verification:check` confirms the report is not stale, and unresolved manual
  evidence is stated explicitly.
- [ ] A final `rules:plan` against the actual worktree includes every maintained
  file changed or generated by the task; scope growth is reconciled before
  verification.
- [ ] The final verification report preserves the `VERIFY-SCOPE-001` impact
  decision and records any evidence-driven expansion from the pre-edit plan.
- [ ] Business behavior matches the product spec.
- [ ] Server validation and authorization are covered by direct-request tests.
- [ ] Database DATA/QRY/TX contracts, constraints, tenant relationships,
  indexes/plans, roles/RLS, migrations/backfills, and connection assumptions are
  reviewed and agree with implementation.
- [ ] Concurrent same-revision tests prove one winner, handled losers, correct
  final revision, no duplicate effects, winner-only activity/outbox, UI
  recovery, and wrong-scope isolation for affected aggregates.
- [ ] Required activity rows persist atomically with business changes and the
  tag schema, tenant isolation, immutability, projection, and retry behavior are
  verified.
- [ ] Cache and queue behavior are safe under loss, retry, and duplicate delivery.
- [ ] When realtime is active, authorization, cross-replica delivery, stale/missed-event recovery, backpressure, and client lifecycle behavior are verified.
- [ ] Logs, audit events, metrics, and error behavior exist.
- [ ] Global loading leases release correctly for success, handled non-zero
  business results, errors, cancellation, timeout, retries, and concurrent work;
  accessibility and the 500 ms hold are verified on active client platforms.
- [ ] Every shipped create/update/delete path proves that invalid or cancelled
  confirmation makes no request and explicit confirmation executes exactly one
  authorized mutation with the documented loading and result behavior.
- [ ] Component and Playwright evidence proves the shared web footer's action-
  only boundary, safe-to-commit DOM/tab/visual order, responsive geometry,
  phone target size/separation, pending stability, and long localized labels.
- [ ] UI passes Section 8.16 for web and Section 9.9 for Flutter, as applicable.
- [ ] The screen registry, screen/flow contracts, implementation status, and current evidence agree with the shipped routes and behavior.
- [ ] Every important visible action and overlay close path was exercised as the
  real actor; no inert control, false success, accidental dismissal, or
  audience-mismatched control remains.
- [ ] Unit, integration, component, end-to-end, accessibility, and security tests pass as applicable.
- [ ] Every affected user-visible workflow passes a current focused Playwright
  run against the live Docker application as its real actor, with isolated
  actor contexts and rendered plus durable/downstream outcome assertions; no
  lower-level or screenshot-only result is substituted for this proof.
- [ ] Affected canonical development chapters, traceability, and evidence links are updated.
- [ ] Unverified work is explicitly marked `Not tested`.

### 15.4 Release ready

- [ ] `release:plan` names the exact accepted/deployed base, candidate, target
  environment, complete diff, universal release baseline, affected slices,
  justified exclusions, and full-regression decision.
- [ ] `verify:automated` passes from a clean install for that release plan and
  applicable candidate-dependent human review is complete before deployment.
- [ ] The exact candidate image is deployed, deployed-version and live-target
  evidence is collected, and final aggregate `verify` passes without rerunning
  already-current suites.
- [ ] Candidate automated, external manual, and deployed-target records match
  the release content fingerprint, immutable revision, image digest, and target
  environment; no applicable release-blocking gate is pending, stale, unowned,
  or unsupported by hashed evidence.
- [ ] Dependency/standards checks pass against the immutable release lockfiles;
  every active exception is approved, unexpired, compensated, and linked to its
  removal plan.
- [ ] Production build and runtime smoke pass.
- [ ] Production container targets run as non-root, contain only approved artifacts, pass scan/health/signal checks, and are identified by immutable release reference.
- [ ] Migrations pass against a production-like snapshot.
- [ ] Database chapter/source/migration/applied-schema drift checks pass; pool/
  timeout/lock/growth monitoring and migration single-runner controls are ready.
- [ ] Backup, isolated restore proof, forward migration recovery, and compatible
  application rollback are ready.
- [ ] Web, worker, scheduler, PostgreSQL, every active Redis role, conditional realtime gateway, and integrations are healthy.
- [ ] The universal critical smoke and every affected critical workflow have
  continuous end-to-end proof. Unaffected workflows are excluded with a
  dependency-based reason unless a full-regression trigger applies.
- [ ] No critical/serious accessibility defects remain.
- [ ] No high-risk security findings remain.
- [ ] Phone/tablet/desktop and light/dark evidence required by affected screen
  contracts is current; full profile coverage is required only in
  full-regression mode or the separately approved periodic baseline.
- [ ] If Flutter ships, signed release builds, supported-device smoke tests, privacy/permission declarations, and staged distribution are ready.
- [ ] Dashboards, alerts, on-call ownership, and runbooks are ready.

### 15.5 Severity and release-block mapping

Use the same severity language in tests, UI review, security review,
observability, requirements traceability, and release readiness.

| Severity | Meaning | Default release rule |
| --- | --- | --- |
| Critical | Core workflow blocked; unauthorized access; cross-tenant leak; corruption/data loss; unsafe financial/destructive behavior; unrecoverable production failure. | Blocks release. No informal exception. |
| High | Major workflow, accessibility, security, responsive, recovery, or operational failure with substantial user/business impact. | Blocks affected scope unless an approved ADR/risk acceptance names owner, mitigation, expiry, and rollback. |
| Medium | Noticeable defect with a safe workaround and no high-risk integrity/security impact. | May ship only with owner and target date. |
| Low | Minor polish, clarity, or maintainability issue. | Track in backlog; does not normally block. |

UI outcomes that are Critical or High for an important flow include:

- primary action unreachable or ambiguous
- phone/tablet layout clips, wraps critical navigation, or requires accidental
  horizontal page scrolling
- form loses attempted values, double-submits, or hides validation/recovery
- a stale concurrent update is silently overwritten, automatically retried
  against newer state, or produces duplicate durable effects
- create, update, or delete executes without the required explicit
  action-and-target confirmation or still executes after cancellation
- destructive or financial action lacks clear confirmation and result
- keyboard, focus, screen-reader semantics, zoom, or touch target defects block
  the task
- light/dark contrast makes content or controls unreadable
- loading, error, permission, stale, or empty state leaves the user without a
  recovery path
- a visible primary/important action is inert, closes without doing its labelled
  work, reports false success, or appears on the wrong audience surface
- dummy copy, internal IDs, or explanation-heavy filler obscures the real task

`N/A` means outside approved scope and needs a reason. `Not tested` means in
scope but unverified and must name reason, owner, target, and release impact.
Neither value is a passing test result.

## 16. Recommended build order

1. repository census, preservation map, clarification register, manifest/schema,
   documentation commands, chapter skeletons, and current-versus-target boundary
2. product spec, capability decisions, glossary, domain/module rules,
   actor/role/capability and permission contracts, per-actor session/device
   policy, conditional commercial model, target platforms, MVP phases, and
   traceability
3. screen registry, audience/surface and conditional shareable-entry maps,
   workflow map, master layouts, page templates, shared patterns, strict
   per-screen contracts, and mobile-first wireframes
4. shared design direction, green theme, light/dark behavior, and platform
   component mappings
5. architecture, API, field-level database and PostgreSQL-role contracts,
   security, durable activity table/tag/access contracts, realtime
   event/protocol, job, observability, and native-platform contracts
6. Nuxt scaffold, slot-based application master layout with top bar/default
   sidebar/main `ScrollArea`, Pinia blocking-activity controller and root
   overlay, strict Awilix process composition roots and execution scopes,
   tracked request adapters, shared mutation-confirmation
   `AlertDialog`, package manager, Dockerfile/Compose environment, Makefile
   help/setup lifecycle, approved-dependency registry, environment validation,
   `deps:check`, `standards:check`, lint, types, and CI
7. PostgreSQL, Drizzle schema/migrations, strict aggregate revision/concurrency
   paths, durable activity writer and `activity_logs` table, active Redis-role
   separation, and logging context
8. authentication, sessions, and server authorization
9. first Nuxt end-to-end vertical slice
10. if approved, Flutter scaffold with `AppMasterPage`/`AppMasterLayout`,
   Riverpod blocking-activity controller, Dio interceptor, root overlay, shared
   adaptive mutation-confirmation dialog, and the same product slice through
   the documented API
11. BullMQ side effects and schedulers only when a slice needs them
12. realtime gateway/fanout only when a slice needs live behavior
13. integration, end-to-end, accessibility, security, and performance hardening
14. deployment/distribution, backup/restore, runbooks, and
    release proof

Do not start by generating many pages or installing every optional module.
