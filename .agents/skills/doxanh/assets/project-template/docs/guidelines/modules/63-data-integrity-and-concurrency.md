
Tenancy, authorization, and roles:

The database implementation rules in this module apply to owned persistence.
External-service consumers document and test the provider's exposed scope,
revision, idempotency, and lifecycle contract through the approved adapter;
they must not claim database locks, RLS, audit atomicity, or migration evidence
they cannot inspect or control.

- Every tenant-sensitive table names its tenant/owner key and proves that unique
  constraints, foreign keys, joins, and lookups cannot cross scope.
- Use tenant-aware composite referential integrity where an ID-only foreign key
  could legally point at another tenant's row. A server predicate or RLS policy
  complements that invariant; it does not repair a cross-tenant relationship
  that the database permits accidentally.
- Decide RLS per tenant-sensitive table. When enabled, document policies,
  bypass behavior, connection context, migrations, and direct tests. When not
  enabled, document why and name the compensating server enforcement.
- Keep application roles from `docs/permissions-matrix.md` separate from
  PostgreSQL roles.
- Use a non-login owner role where the deployment model supports it.
- Use a dedicated reviewed migration role. Web/API and worker runtime
  credentials must not perform DDL or own the schema.
- Split web, worker, read-only/reporting, backup/restore, or operational roles
  when their privileges materially differ; do not create unused ceremonial
  roles.
- Set explicit schema, table, sequence, view, and function grants and default
  privileges. Revoke unsafe public privileges and use a controlled
  `search_path`.
- Do not grant superuser, role creation, database creation, broad bypass-RLS, or
  unrestricted cross-schema access to application runtime roles.
- Encrypt connections outside explicitly isolated local development. Rotate
  credentials, isolate environments, audit privileged access, and test
  revocation.
- Treat RLS as defense in depth. Server authorization still evaluates actor,
  role, scope, ownership, state, and capability for every protected operation.

Transactions and concurrency:

- Use transactions for multi-record invariants and select an isolation/locking
  strategy from the actual race condition.
- Pass one explicit transaction-scoped Drizzle handle through repositories
  participating in the use case. A repository must not silently escape to the
  global pool inside an active transaction.
- Keep transactions short. Never hold a database transaction open across an
  external HTTP call, user interaction, or long-running job.
- Use optimistic revision/version checks for stale high-value updates and
  document the conflict result and recovery behavior.
- Use row locks, advisory locks, exclusion constraints, idempotency keys, or
  serializable transactions only where their concurrency semantics are
  understood and tested.
- Define bounded retry only for registered retryable transaction failures such
  as serialization/deadlock outcomes, with a maximum attempt count and no
  duplicate external side effect.
- Use immutable snapshots or history rows where reports, payments, approvals,
  or audits must not change when current master data changes.
- Use a transactional outbox or equivalent durable handoff when a committed
  database result must reliably cause queued or external work.

Strict optimistic-concurrency contract for mutable aggregates:

- Name the aggregate, authoritative revision/version column, commands that
  require it, and any commands that deliberately use a stronger lock or are
  revision-independent. Do not apply version checks inconsistently across two
  writers of the same state.
- The client sends the exact `expected_revision` it rendered. The server does
  not accept a missing revision for a protected update and does not replace it
  with the latest value on the client's behalf.
- Perform the write atomically with a predicate covering the resource ID,
  tenant/owner scope, allowed current state, and expected revision. Increment
  the revision in that winning write. A prior unscoped read is not sufficient.
- When zero rows are changed, re-resolve through a scope-safe path and map
  not-found, wrong-scope, disallowed-state, and stale-revision outcomes without
  leaking whether another scope owns the identifier.
- A stale revision is a handled business result: HTTP `200`, `success: false`,
  a registered non-zero code, safe message, current revision or refresh hint in
  an allowlisted `data` shape, and `warn` telemetry. It is not an unexpected
  exception and must not become HTTP `500`.
- Never automatically retry a user mutation against a newer revision. Preserve
  the safe draft locally, mark it stale, disable another submit with the old
  revision, and provide an explicit `Refresh`/reload-authoritative-state action.
  The user consciously reviews and reapplies any still-valid intent.
- Only the winning committed transaction writes the business change, revision,
  required activity row, outbox event, job intent, financial effect, or cache
  invalidation marker. A losing stale attempt writes none of them.
- If the approved audit/security policy requires a durable failed-attempt
  record, write a separately classified bounded outcome after the conflict is
  known. It must carry the non-zero result, must not imitate the successful
  mutation's before/after activity, and must not create domain/outbox/job/cache
  effects. Apply abuse-volume and privacy controls to such attempt records.
- Idempotency and optimistic concurrency solve different problems. Repeating the
  same idempotency key and identical command replays its recorded result; a new
  key or different intent still must satisfy the current revision. Define the
  result for reusing one key with a different payload.
- If a write spans several tables, use one transaction-scoped handle and make
  the aggregate revision represent the complete invariant. Do not increment the
  version before a later table write can fail.
- Realtime or background refresh may announce that newer state exists but must
  not silently overwrite a dirty form. Display the conflict and let the user
  choose refresh/review/reapply according to the screen contract.

Concurrency proof must use two independent authenticated clients or database
transactions that start from the same revision. Assert one winner, one handled
loser, final persisted state/revision, no duplicate child/effect rows, activity
and outbox only for the winner, safe client recovery, and wrong-scope denial.
Sequential calls from one client are not concurrency evidence.

Referenced-record lifecycle contract:

- Apply `DATA-REFERENCE-001` to every retire, archive, disable, restore, or
  permanent-delete command whose target can be referenced by another durable
  record. A foreign-key error after confirmation is not the designed workflow.
- In `docs/database-schema.md`, register every inbound relationship and classify
  its lifecycle behavior as `move-current`, `preserve-history`, `block`, or an
  explicitly approved `cascade`. Name the current-versus-historical predicate,
  allowed replacement type/state/scope, database constraint or transaction
  enforcement, activity evidence, and restore/permanent-delete behavior. Never
  infer this policy from `ON DELETE` alone.
- Keep retirement and permanent deletion separate. Retirement removes a record
  from new selection while preserving approved historical references. Permanent
  deletion is available only when the documented retention and reference policy
  permits it. Do not silently cascade business, financial, security, or audit
  history to make a delete succeed.
- Before a user can confirm a lifecycle command, resolve an authorization-
  protected server impact/preflight contract or a documented equivalent
  authoritative relationship projection. It may load before the confirmation
  opens or as that surface's initial pending state, but commit stays disabled
  until the impact is current. Return only scope-safe counts, bounded safe
  labels, movable dependency groups, blocking reasons, eligible replacement
  choices or choice-query metadata, and the revisions required by the command.
  The client must not discover policy by attempting the destructive write or
  infer complete impact from a visible, paginated, or locally filtered subset.
- The UI names the target and consequence, shows every affected dependency
  group, distinguishes movable current records from preserved history and hard
  blockers, and requires a valid replacement for each `move-current` group
  before enabling the final commit in the shared confirmation dialog. Use the
  approved searchable choice control when a replacement catalog meets
  `UI-CONTROL-001`; never render an unbounded option list. A blocker provides a
  direct recovery action when one exists and never offers a misleading confirm
  button.
- When no suitable replacement exists, the same confirmation surface gives one
  concise, localized recovery step: cancel, create or reactivate an approved
  holding/default/uncategorized record when the product domain permits one,
  then reopen the lifecycle action and select it. The project book must name
  the exact safe record type and later review/reassignment behavior; financial,
  security, identity, or other sensitive references must direct the actor to
  create the correct real target instead of a placeholder. Never auto-create,
  auto-select, or silently treat an arbitrary existing record as the fallback,
  and do not open a second confirmation dialog for this guidance.
- Treat preflight data as advisory evidence, not authorization. On confirmation,
  the server revalidates actor, scope, capability, target state and revision,
  every current inbound reference, and every replacement. A replacement must
  exist in the same authorized scope, have the required active state and type,
  differ from the source, and satisfy any ownership or hierarchy invariant.
- Execute all dependency moves and the target lifecycle transition in one short
  transaction. Lock or atomically predicate the target, applicable current
  dependents, and replacements in a deterministic order. Move only records
  classified `move-current`; preserve immutable/history references exactly as
  documented. Any changed dependency, stale revision, new blocker, invalid
  replacement, or concurrent winner rolls back the complete command and returns
  a registered handled non-zero result with refresh/review recovery.
- Only the winning commit emits lifecycle and dependency activity, outbox/job/
  notification intent, cache invalidation, and realtime publication. Activity
  must identify the trusted actor, scope, target, command, before/after state,
  dependency group counts, replacement identifiers, request/origin context, and
  one correlation or batch identifier without copying sensitive child payloads.
- Restore behavior must be explicit: restoring a parent never silently restores
  moved, deleted, or independently retired dependents. The project book states
  whether the restored record becomes eligible for new references and which
  follow-up action, if any, can move dependents back.

Proof for `DATA-REFERENCE-001` covers: no-reference success; each dependency
classification; mixed movable/history/blocking groups; missing, inactive,
self, wrong-type, and wrong-scope replacement denial; stale preflight and stale
revision; a new dependent created between preflight and confirmation; two
independent concurrent commands with one winner; complete rollback; preserved
history; winning-only activity and downstream effects; scope-safe errors; and
the rendered preflight, no-suitable-target guidance, blocked recovery, cancel,
confirm-once, refresh, and durable-result workflows when a user interface
exposes the command. API-only and autonomous paths prove their documented
caller contract without inventing a confirmation screen.

Migrations and data changes:

- Generate SQL migrations with Drizzle Kit and review the SQL, lock behavior,
  data-loss risk, compatibility, and recovery before commit.
- Apply only committed migrations in shared, staging, and production
  environments.
- Run migrations once through the release/migration role, record the exact
  source revision and migration set, and use an advisory/deployment lock or
  equivalent single-runner guarantee appropriate to the platform.
- Schema `push` may be used only for an explicitly disposable local prototype.
  It is not a shared, CI, staging, or production migration strategy.
- Test migrations from empty state and a production-like snapshot.
- Prefer expand/backfill/contract changes that keep the deployed application,
  workers, and rollback version compatible.
- Make large backfills bounded, observable, resumable, and safe to retry. Do not
  hide a large unbounded data rewrite inside application startup.
- Plan high-lock DDL, uniqueness validation, table rewrites, and index creation
  from measured production-like data. Define a controlled maintenance window
  when an online-compatible change is not safe.
- State which statements execute transactionally and which require separate
  orchestration, including concurrent index work. A partially applied
  non-transactional migration needs explicit detection and forward recovery.
- Do not run migrations independently from every web or worker replica.
- Verify schema/migration drift in CI and after deployment. A migration file
  existing in source control does not prove an environment applied it.
- Record migration, backfill, verification, and rollback evidence in the ledger
  required by Section 4.9.

Queries and verification:

- Avoid N+1 queries, accidental cross-tenant joins, unbounded lists, and
  offset-only pagination at unsafe scale.
- Parameterize every raw SQL value and centralize reviewed raw SQL fragments;
  never construct identifiers, predicates, sort expressions, or `search_path`
  from untrusted input.
- Add indexes from real constraint and query needs, then verify important paths
  with production-representative query plans and row counts.
- Make list queries deterministic with a unique tie-breaker, enforce maximum
  page size/date range/export size, and use keyset cursors for unbounded-growth
  timelines.
- Budget total connections across web/worker/scheduler/realtime replicas plus
  migration, monitoring, backup, and emergency reservations. Configure and test
  statement, lock, transaction, and idle-in-transaction boundaries by role;
  cancel abandoned work and expose saturation/long-transaction/lock-wait
  telemetry.
- Test constraint violations, delete/update behavior, transaction rollback,
  concurrency conflicts, RLS decisions, every runtime database role, migration
  compatibility, and restore behavior.
- Keep `docs/database-schema.md` synchronized with Drizzle source, migrations,
  applied environments, and runtime evidence using the complete Section 4.9
  contract. Generated Drizzle types are not sufficient documentation.

Activity-log implementation:

- Keep the registry and per-tag Zod schemas under one shared server-owned
  boundary and expose a typed writer; routes, components, and queue processors
  must not assemble arbitrary activity rows.
- Persist through a dedicated repository using the same transaction handle as
  the protected domain write. Require the caller to select a registered tag;
  derive trusted context centrally.
- Keep the Drizzle `activity_logs` definition, reviewed migration, database
  chapter, activity chapter, permissions, tests, and retention runbook aligned.
- Emit bounded telemetry for activity-write success/failure and latency without
  copying `data_json` into application logs or metric labels.
