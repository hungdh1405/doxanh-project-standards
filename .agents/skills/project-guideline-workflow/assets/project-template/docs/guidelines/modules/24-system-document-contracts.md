
### 4.9 Minimum content contracts: architecture and system contracts

`system-architecture.md` must include:

- system context and runtime/container views
- web, worker, scheduler, migration, optional realtime gateway, and optional
  native-client processes
- module responsibilities and dependency direction
- exact project actor/scope catalogs and closed hierarchy; Awilix process roots,
  child execution scopes, materialized execution/authenticated-actor context,
  protected fail-closed boundary, context/logger construction, and prohibition
  on ambient repository/container access
- request, job, scheduler, event, file, and native-client flows
- transaction, consistency, and reliable-handoff boundaries
- PostgreSQL, cache Redis, BullMQ Redis, conditional realtime Redis, object
  storage, and integration roles
- trust and failure boundaries
- when multiple audience or shareable entry surfaces exist, the canonical
  host/path resolution owner, proxy/forwarded-host trust boundary, proof-versus-
  locator boundary, and environment-specific URL construction
- scaling, graceful shutdown, migration, recovery, and observability hooks
- local Compose topology versus deployed topology, including which contracts
  remain identical and which infrastructure responsibilities change
- current and target topology when migration is in progress

`api-contract.md` must include an endpoint catalog:

| ID | Method | Path | Caller | Auth/scope | Permission/state | Request schema | Code-0 data | Handled non-zero results | Unexpected failure | Idempotency/concurrency | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

For each important endpoint include:

- purpose, caller, preconditions, scope, permission IDs, and allowed record
  states
- protected-route authenticated-actor-context requirement, server provenance,
  missing-context result, and the typed views consumed by handler, policy,
  logger, and activity writer
- params, query, headers, and body fields
- example request
- server steps and transaction boundary
- example success response
- validation, authentication, authorization, conflict, rate-limit, and
  dependency result codes and data schemas
- named server authorization policy/enforcement point, denial behavior, and
  direct-request tests
- referenced DATA fields/tables and QRY/TX IDs; endpoints do not redefine their
  database meaning
- unexpected-failure behavior
- idempotency and stale-revision behavior
- audit and telemetry
- compatibility and deprecation notes

Adopt the mandatory envelope from Section 10.1; do not invent a project-specific
top-level alternative. Define request IDs, pagination, filtering, sorting,
files, streams, webhooks, versioning, and every exception to the normal JSON
shape.

Maintain one result-code registry:

| Numeric code | Symbolic name | Meaning | `success` | HTTP | Log level | `data` schema | Retryable | Endpoints | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `0` | `success` | Requested operation completed successfully. | `true` | `200` | `info` | Endpoint-specific | No | All JSON application endpoints | API owner |

Every non-zero code must have one stable meaning and owner. Never reuse a
retired code for a different result. Non-zero values shown in this reusable
guideline are illustrative; each generated project allocates and owns its actual
values in this registry.

`database-schema.md` is the human-reviewable data contract, not a schema dump or
a copy of generated Drizzle types. It must be detailed enough that an engineer
can implement the Drizzle schema and reviewed migration without inventing
business meaning, while still remaining readable to product, security, QA, and
operations reviewers. It must begin with:

- supported PostgreSQL version and approved extensions
- physical schema namespace and `search_path`; table/column/constraint/index
  naming; internal/public identifiers; timestamp/timezone; text/collation/
  case-folding; money/precision; boolean; enum/reference data; `jsonb`; and
  delete conventions
- tenant, ownership, privacy classification, encryption, retention, and RLS
  strategy
- transaction, concurrency, immutable-history, outbox, audit, and reporting
  decisions
- target versus current schema boundary and migration compatibility policy
- canonical Drizzle schema, migration, seed/reference-data, and database-test
  paths, distinguishing proposed paths from files verified to exist
- a small ERD or equivalent relationship map with cardinality; the diagram never
  replaces the field-level contract

Use this chapter order so generated database books are predictable:

1. scope, current-versus-target status, assumptions, and non-goals
2. PostgreSQL/Drizzle profile and global conventions
3. compact ERD and module/data ownership map
4. table, tenant/scope, lifecycle/retention, transaction, and query catalogs
5. complete per-table field/relationship/constraint/index contracts
6. lookup/reference data, state transitions, and deterministic seed ownership
7. PostgreSQL roles, grants, RLS, and privileged maintenance boundaries
8. migration/backfill ledger and compatibility plan
9. capacity, partitioning, connection assumptions, maintenance, backup/restore
   dependencies, and operational risks
10. verification evidence, unresolved questions, and change history

Maintain a table catalog:

| Data ID | Physical table | Business name and description | Source of truth / owning module | Tenant/owner key | Classification and retention | Row lifecycle / expected scale | Drizzle path | Implementation/evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

The catalog must cover every persisted application table, join table,
reference/lookup table, activity/security/history table, idempotency record,
outbox, and project-owned migration metadata table. Framework- or
provider-owned tables may be grouped only when their version, ownership,
purpose, access, retention, and upgrade boundary are still explicit. A table
cannot appear only in an ERD or migration.

Before the per-table definitions, maintain these cross-table contracts.

Tenant and scope integrity:

| Scope ID | Table/data ID | Scope kind | Tenant/owner columns | Parent/root scope | Composite unique/FK or equivalent invariant | RLS policy/role | Server enforcement | Wrong-scope proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

- Use an immutable internal tenant/organization/workspace ID for isolation.
  Mutable codes/slugs may be alternate lookup keys but are not authorization
  boundaries.
- A tenant-owned child must not be able to reference a parent in another tenant.
  Prefer a composite tenant-aware foreign key/unique target where practical; if
  another design is used, document the exact database and server proof.
- Global/platform rows use an explicit scope rule. Do not infer platform scope
  merely because a nullable tenant key happens to be `NULL`.
- Unique constraints for tenant data include the tenant/scope columns unless
  the invariant is intentionally global and documented.

Lifecycle, privacy, and retention:

| Lifecycle ID | Table/data ID | Creation owner | Mutable states/transitions | Snapshot/history rule | Delete/archive/anonymize | Retention/legal hold | Purge owner/job | Required activity tag | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Transaction and write paths:

| TX ID | Use case/command | Actor and scope source | Reads/locks/revisions | Tables written | Isolation/constraint invariant | Idempotency | Activity/outbox/job/cache effects | Handled result codes | Unexpected failure/retry | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

This transaction catalog is required for multi-table, financial, destructive,
approval, inventory/capacity, security, idempotent, queued, and realtime-command
writes. State the commit boundary and never imply that an external HTTP call or
user wait occurs inside the database transaction.

Every mutable aggregate with concurrent writers must also name its revision
owner, commands requiring `expected_revision`, atomic update predicate, handled
conflict code/data, winning-only activity/outbox/effect behavior, UI
refresh/reapply flow, and two-independent-client proof from Section 10.2.

Query and access paths:

| QRY ID | Consumer/API/job/report | Permission and tenant scope | Tables/joins | Filters/search/order | Pagination/limit | Expected rows/growth | Latency budget | Serving index(es) | Plan evidence/status | Degraded/limit behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Every important list, lookup, authorization check, worker claim, scheduler
selection, report, activity timeline, and cleanup query must have a bounded
access path. Index rows must reference the QRY/constraint they serve; important
QRY rows must identify their serving index or explicitly justify a measured
sequential scan. Do not invent indexes without a query or invariant.

Each table uses one stable heading such as
``### DATA-ORD-001 Orders (`orders`)``. Under it, keep explicit Purpose and row
meaning, Fields, Relationships, Constraints, Indexes/access paths, Lifecycle/
concurrency, Examples/edge cases, and Implementation/evidence sections. Use
`N/A — <reason>` for a truly inapplicable relationship/index/etc.; do not omit
the section or bury it in generic notes. `docs:data:check` maps the table
catalog's DATA ID and physical name to this heading.

For every table, define:

1. business purpose, why the table exists, explicit non-goals, source of truth,
   owning module, expected writers/readers, and expected row/write/read scale
2. row meaning and lifecycle from creation through state changes,
   archive/anonymization/purge, including who or what owns each transition
3. primary-key/public-identifier strategy, identifier examples, and whether each
   identifier may cross a trust boundary
4. tenant, ownership, scope, partitioning, and RLS decision
5. fields using this minimum data dictionary:

| Column | Business label, description, and source | SQL / Drizzle type | Null / default / generated | Allowed values/check | FK, scope, and ownership | Write owner and mutability | Classification, encryption, and retention | API exposure/serialization | Example/notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Every field description must explain the business meaning, where its value
comes from, whether it is copied/snapshotted/derived, and what `NULL` means.
`status`, `type`, `code`, `metadata`, `data`, `value`, `notes`, and similarly
generic names require explicit value semantics; the name alone is not
documentation. Examples must be synthetic and safe.

The table section must be understandable without opening the migration or
application source. In particular, operational and security tables such as
suppression lists, rate-limit counters, inboxes, outboxes, idempotency records,
leases, locks, and audit history must explain in task language:

- what one row represents and why the product needs it
- the event or command that creates the row
- the readers and decisions that use it
- when and how the row changes, expires, becomes inactive, or is purged
- the user-visible or operational effect when the row exists
- what the table deliberately does not store or decide
- one representative example and one important boundary case

A terse label such as "stores suppressions" or "tracks events" is not a
purpose contract. Do not require a non-technical reader to infer behavior from
a table name, state value, foreign key, or implementation path.

Stable business fields, tenant/scope, identifiers, relationships, state,
authorization inputs, common filters, ordering, uniqueness, money, and
retention controls belong in typed columns. A `jsonb` column is allowed only
when its bounded flexible shape is intentional. For every JSON column define:

- purpose and why typed relational columns are not currently appropriate
- top-level object/array/scalar rule and PostgreSQL check where appropriate
- owning Zod schema/path, schema-version field, compatibility, and unknown-key
  behavior
- required/optional keys, null semantics, size/depth/count limits, and safe
  example
- sensitivity, redaction, encryption, retention, API projection, and whether
  clients may provide any part of it
- actual query operators and expression/GIN index decision; no blanket JSON
  index without a measured QRY path
- promotion rule for a value that becomes a relationship, invariant, common
  filter/order key, or stable reporting dimension

6. relationships:

| Relationship/FK | From columns -> target | Cardinality/optionality | On update/delete | Tenant/scope rule | History/lifecycle invariant | Notes |
| --- | --- | --- | --- | --- | --- | --- |

Every foreign-key column set must match the referenced types and have a
documented referencing-side index decision. Cross-tenant relationships must
identify how the tenant key participates in referential integrity. Never rely
on an ORM relation declaration as proof that PostgreSQL has the intended
foreign key or delete action.

7. constraints:

| Constraint | Type | Columns/expression | Business invariant | Conflict result code | Verification |
| --- | --- | --- | --- | --- | --- |

The constraint contract must cover null behavior, case/collation behavior,
tenant scope, partial predicates, and deferrability when applicable. Decide
whether nullable uniqueness means ordinary PostgreSQL distinct-null behavior,
`NULLS NOT DISTINCT`, a partial unique index, or separate explicit scope rows;
do not leave it accidental.

8. indexes:

| Index | Columns/order | Unique | Predicate/include | Query/constraint served | Expected selectivity/scale | Plan evidence/activation | Write-cost/notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

Index order, sort direction, null order, operator class, predicate, included
columns, uniqueness, and concurrent-build requirement must follow the named
query/invariant. Record unused/redundant-index review and removal evidence;
index presence alone is not performance proof.

9. mutable, immutable, snapshot, derived, optimistic-version, locking, and transaction
   behavior
10. create/update timestamps, effective-time fields, soft delete, retention,
   archive, anonymization, purge, and legal-hold behavior
11. representative safe rows and boundary/edge cases required by tests
12. audit, security-event, outbox, job, cache-invalidation, and reporting effects
13. corresponding Drizzle schema, migration, database comments when used,
    tests, and implementation evidence

For stateful entities, include a transition registry tied to domain rules,
permissions, transaction IDs, constraints, and activity tags:

| State ID/value | Business meaning | Enter from / trigger | Exit to | Permission/precondition | Database enforcement | TX ID | Activity tag | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

The registry covers every persisted state value, not only the unusual or
failure state. For each value, state who or what enters it, whether it grants or
removes any benefit, what the operator or end user can do next, its legal next
states, and what happens to dependent records and side effects. A secondary
workflow chapter may provide a longer narrative, but it must link back to the
same complete registry and may not redefine the meanings.

For reference/lookup data, distinguish schema migration rows, idempotent
reference-data seeding, administrator-managed data, and test/demo fixtures.
Name the owner and compatibility rule for adding, renaming, merging, disabling,
or retiring a value. A label translation is not the stored stable key.

The schema document must also contain:

- a catalog for enums, lookup/reference data, allowed transitions, owner, and
  compatibility behavior when a value is retired
- a PostgreSQL access-role matrix defined below
- a migration ledger:

| MIG ID/path | Purpose/dependencies | DDL/data and expand/backfill/contract phase | Transaction/concurrent execution | Lock/rewrite/load risk and budget | Old/new app-worker compatibility | Backfill checkpoint/idempotency | Applied environments | Pre/post verification | Forward recovery/app rollback/restore |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- volume and partitioning thresholds only for tables that need them
- query-plan evidence for important or high-volume access paths
- a project-owned database-object catalog:

| Object ID | Kind | Schema/name | Purpose/owner | Definition path | Inputs/dependencies | Security/search_path | Refresh/execution rule | Migration/status/evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

- explicit decisions for generated columns, database defaults, triggers,
  functions, views, materialized views, and extensions when used

The object catalog also covers sequences, domains, policies, publications,
subscriptions, foreign-data objects, and custom types when used. Do not hide
business logic in a trigger/function or privileged `SECURITY DEFINER` function;
such use requires explicit need, locked-down `search_path`, permissions,
failure behavior, tests, and an ADR when consequential.

For a genuinely greenfield database before its first approved production
release, consolidate generated development history into one readable, reviewed
initial migration. Apply it to an empty PostgreSQL database, rerun the unchanged
migrator against that database to prove idempotence, compare the resulting
schema with the intended schema contract, commit its Drizzle snapshot/journal,
and make it immutable at release approval. From that point onward, every schema
change is a new append-only migration: never squash, rename, reorder,
regenerate, or edit a migration that may have been applied. A replacement
baseline is allowed only for an explicitly disposable, unreleased environment
whose schema and data will be recreated.

Every migration must state whether it is transactional, which statements need
separate orchestration, how locks and rewrites are bounded, and which deployed
web/worker/scheduler/realtime versions remain compatible. Do not assume a
destructive down migration is a safe rollback. Prefer expand/backfill/contract,
application rollback within the compatibility window, a forward corrective
migration, or a rehearsed restore as appropriate. Contract/drop phases occur
only after code compatibility and backfill verification prove the old shape is
unused.

It must distinguish proposed target design, generated migration, reviewed SQL,
applied schema by environment, backfill state, and verified runtime. A generated
migration or Drizzle type does not prove the schema was applied or that its
constraints and query plans work.

The chapter also records database runtime assumptions that affect correctness:

| Process/role | Expected replicas | Pool per replica | Reserved/maximum total connections | Statement/lock/idle-transaction timeouts | Transaction/read consistency | Proxy/prepared-statement compatibility | Production owner/evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

`production-readiness.md` owns the exact deployed sizing and alert thresholds;
`database-schema.md` owns the calculation, query/transaction assumptions, and
safe bounds those deployed values must satisfy. Include migration,
administration, backup, monitoring, and emergency connection reservations.
Adding API/worker replicas must not silently exhaust PostgreSQL.

Application actors and PostgreSQL roles are separate concepts. Define only the
database roles the deployment needs, using this contract:

| Database role | Process/operator | Login | Schemas/objects | Allowed operations | RLS behavior | DDL/ownership | Credential owner/rotation |
| --- | --- | --- | --- | --- | --- | --- | --- |

The role design must address, as applicable:

- a non-login ownership role
- a migration role that can perform reviewed DDL but does not serve application
  traffic
- separately reviewable web/API and worker runtime access
- read-only/reporting access restricted to approved tables, columns, or views
- backup/restore and operational access
- explicit schema privileges, default privileges, sequence/function privileges,
  and a safe `search_path`
- environment isolation, encrypted connections, secret rotation, emergency
  access, and access-review evidence
- whether RLS is enabled per tenant-sensitive table, the policy owner and tests,
  or the documented reason and compensating enforcement when it is not used

Runtime roles must not own application schemas or receive DDL, superuser,
database-creation, role-management, broad bypass-RLS, or unrestricted public
schema privileges without a named operational requirement and approved ADR.
RLS is defense in depth and never replaces server authorization.

The database chapter is not ready for approval when it is only a list of table
or field names. Before approval:

- every table-catalog row resolves to one complete table contract
- every important business invariant resolves to a named PostgreSQL constraint
  or a documented transactional enforcement/test
- every tenant table resolves to the scope matrix and wrong-tenant proof
- every important write resolves to a TX row, result code, activity effect, and
  integration test
- every important read resolves to a bounded QRY row and reviewed index/plan
  decision
- every sensitive field has classification, projection, retention, and
  anonymization/deletion behavior
- every implemented table/object resolves to Drizzle, migration, and test paths;
  every `Verified` claim resolves to applied-environment evidence
- every blocking unknown uses the clarification protocol instead of an invented
  default

#### Durable activity-log contract

Every generated server-backed project must define a first-class,
PostgreSQL-backed `activity_logs` table in `docs/database-schema.md` and the
corresponding semantic contract in `docs/activity-log.md`. This is the durable
business/security history for significant actions. It is not Pino output, a
debugging sink, analytics event storage, a replacement for current domain
state, or an excuse to serialize arbitrary application objects.

When the product commonly needs the current creator/updater or last-transition
actor, keep that intentionally named FK/snapshot on the domain row as well.
Do not reconstruct ordinary current metadata by scanning `activity_logs`; the
activity row remains the immutable historical evidence.

The ownership boundary is:

- `activity-log.md` owns what must be recorded, the module/tag taxonomy,
  producers, readers, display/export behavior, and verification
- `database-schema.md` owns columns, PostgreSQL/Drizzle types, constraints,
  RLS, indexes, partitions, migrations, and measured query plans
- `security-model.md` owns access, integrity, privacy, legal hold, retention,
  anonymization, export, and incident-use policy
- `permissions-matrix.md` owns who may list, view detail, and export each
  activity class
- `observability.md` owns application telemetry and monitors whether durable
  activity writes are healthy; telemetry never substitutes for the row

Maintain one activity tag registry:

| Activity ID | `module_key` | `tag_type` | Stable business meaning | Trigger and producer | Actor/source | Target | Required `data_json` schema/version | Classification | View/export permission | Retention | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

`module_key` is a registered, stable, low-cardinality owning module such as
`orders`, `identity`, or `billing`. `tag_type` is the stable machine-readable
and globally unique action/event discriminator, such as `order.approve`,
`permission.assign`, or `payment.confirm`. `tag_type` identifies the action by
itself; `module_key` provides ownership, grouping, permissions, and operational
filtering. The registry binds each tag to exactly one module.

- Use lowercase dot-separated names with no tenant, actor, record, request,
  timestamp, or user-provided value in either key.
- Register a tag before emitting it. Do not accept either value from an
  untrusted client.
- Never reuse or silently redefine a tag. A meaning change creates a new tag;
  a compatible JSON shape change increments `data_schema_version`.
- Keep outcome separate from the tag so the same registered action can record
  `succeeded`, `denied`, `handled_failure`, or `unexpected_failure` when the
  project requires those attempts to be durable.
- Map permission IDs, API operations, jobs, and realtime commands to the same
  registered activity tag where they represent the same business action.

The physical `activity_logs` table must provide this minimum logical contract.
The generated database chapter selects exact identifier lengths/types and
documents every choice:

| Column | Required meaning and rule |
| --- | --- |
| `id` | Immutable, public-safe activity/event identifier generated by a trusted writer. Reuse it on delivery retry so duplicate processing cannot create another row. |
| `scope_type` | Registered `tenant` or `platform` scope. It is explicit; a missing tenant is never interpreted implicitly. |
| `tenant_id` | Immutable internal tenant identifier. Required for `tenant` scope and `NULL` only for `platform` scope, enforced by a check constraint and RLS/authorization rules. |
| `module_key` | Registered owning module used for routing, filtering, retention review, and ownership. |
| `tag_type` | Globally unique registered action/event discriminator identifying what happened; its owning `module_key` must match the registry. |
| `occurred_at` | UTC `timestamptz` for when the action actually occurred at its source. |
| `recorded_at` | UTC database-generated `timestamptz` for when this database accepted the immutable row. There is no normal `updated_at`. |
| `actor_type` | Registered accountable actor class such as `user`, `service`, `worker`, `scheduler`, `integration`, or `system`. |
| `actor_id` | Opaque accountable/initiating actor ID; nullable only for a documented autonomous system action. A background job preserves the initiating actor when one exists. |
| `actor_display_snapshot` | Nullable bounded server-derived actor display name captured for human-readable activity history. It is never an authorization key and follows personal-data access/retention rules. |
| `actor_role_keys_snapshot` | Non-null bounded snapshot of registered active role keys at the time of action, normally an empty array for autonomous system actors. It supports explanation/audit and never reauthorizes a replay. |
| `role_assignment_id` | Nullable immutable assignment, membership, or grant-set identifier that established the actor's active roles in the registered scope. |
| `impersonator_id` | Actual authenticated actor when acting as or for another actor; otherwise `NULL`. |
| `source_type` | Registered execution origin such as `web`, `mobile`, `api`, `worker`, `scheduler`, `integration`, or `system`. |
| `source_service` | Stable service/process that committed the record. |
| `source_environment` | Validated deployment environment that produced the activity, useful when records are restored or exported across environments. Never accept it from the client. |
| `source_region` | Nullable deployment region/site when it materially helps incident, compliance, or support investigation. |
| `source_operation` | Normalized route, command, job, scheduler, or integration operation; never a raw URL or untrusted string. |
| `source_ip` | Nullable PostgreSQL `inet` value or approved masked representation derived only from the trusted connection/proxy chain. Collect it only when the security/privacy policy names a use and retention period. |
| `session_id_hash` | Optional salted, non-reversible session correlation when approved; never a cookie, access token, refresh token, or raw session ID. |
| `target_type` | Registered business-safe target type. |
| `target_id` | Opaque target identifier, nullable only when the registered tag has no target. Do not cascade-delete activity because a target is removed. |
| `target_version` | Optional domain revision/version after the action, used for ordering and stale-state investigation where applicable. |
| `outcome` | Registered durable outcome such as `succeeded`, `denied`, `handled_failure`, or `unexpected_failure`. |
| `result_code` | Numeric API/command result code when one exists; `0` only for true success under the response-envelope contract. |
| `reason_code` | Optional bounded machine-readable reason required for registered denial, override, or destructive actions. |
| `request_id` | Nullable request correlation identifier matching the response envelope when initiated by HTTP. |
| `trace_id` | Nullable distributed trace correlation; never required to reconstruct the business meaning. |
| `job_id` | Nullable safe BullMQ job correlation for asynchronous execution; it is not the durable idempotency guarantee. |
| `data_schema_version` | Positive integer version of the registered `data_json` contract for this `tag_type`. |
| `data_json` | Non-null PostgreSQL `jsonb`, default `{}`, containing only bounded, business-safe, tag-specific extra context validated against the registered Zod schema. |

The generated schema must name and test the primary key, the
`scope_type`/`tenant_id` consistency check, bounded format checks for
`module_key` and `tag_type`, allowed actor/source/outcome values,
`data_schema_version > 0`, `jsonb_typeof(data_json) = 'object'`, and this
non-null result-code invariant: `succeeded` uses `0`; every other outcome uses
a non-zero code. Use check-constrained text or a reference table when activity
vocabulary changes more frequently than a safe PostgreSQL enum rollout
permits. When several deployables, imports, or direct database writers emit
activity, strongly prefer an
`activity_log_tag_definitions` reference table with globally unique `tag_type`
and a composite foreign key on `(module_key, tag_type)` to enforce the owning
module mapping in addition to the code/document registry.

`data_json` provides controlled extensibility, not the main query model. Its
registered Zod schema must define required/optional keys, size/depth limits,
classification, redaction, compatibility, and a synthetic example for every
tag. Appropriate contents include a bounded changed-field list, safe
before/after values, reason details, workflow context, or an immutable snapshot
needed to understand the action. It must not contain credentials, tokens,
cookies, raw headers, complete request/response bodies, unrestricted
exceptions, raw queue payloads, payment secrets, uploaded files, or an
unbounded copy of a domain entity.

Representative safe row:

```json
{
  "id": "act_01JEXAMPLE123",
  "scope_type": "tenant",
  "tenant_id": "tnt_01JEXAMPLE123",
  "module_key": "orders",
  "tag_type": "order.approve",
  "occurred_at": "2026-07-30T10:15:21.490Z",
  "recorded_at": "2026-07-30T10:15:21.512Z",
  "actor_type": "user",
  "actor_id": "usr_01JEXAMPLE123",
  "actor_display_snapshot": "Morgan Lee",
  "actor_role_keys_snapshot": [
    "order_approver"
  ],
  "role_assignment_id": "asg_01JEXAMPLE123",
  "impersonator_id": null,
  "source_type": "web",
  "source_service": "orders-api",
  "source_environment": "production",
  "source_region": "ap-southeast",
  "source_operation": "POST /api/orders/:id/approve",
  "source_ip": "203.0.113.0/24",
  "session_id_hash": "sha256:bounded-example",
  "target_type": "order",
  "target_id": "ord_01JEXAMPLE123",
  "target_version": 8,
  "outcome": "succeeded",
  "result_code": 0,
  "reason_code": null,
  "request_id": "req_01JEXAMPLE123",
  "trace_id": "tr_01JEXAMPLE123",
  "job_id": null,
  "data_schema_version": 1,
  "data_json": {
    "changed_fields": [
      "status"
    ],
    "changes": {
      "status": {
        "before": "pending",
        "after": "approved"
      }
    }
  }
}
```

Keep values used for tenancy, authorization, common filters, ordering,
correlation, joins, retention, or operational ownership in typed columns. Do
not hide actor, tenant, module, tag, target, timestamps, outcome, result code,
or correlation inside JSON. Do not add a blanket GIN index to `data_json`.
Promote a repeatedly queried JSON value to a typed column, or add one reviewed
expression index only after the access path and write cost are measured.

Write and integrity rules:

- Derive scope, actor ID/type/display/role snapshot, role assignment,
  impersonator, module, tag, source, target, and result server-side from trusted
  request/job context and the registered use case.
- A required activity row for a privileged, financial, destructive, security,
  permission, configuration, or legally significant state change is inserted
  in the same PostgreSQL transaction as that change. If the row cannot be
  written, the sensitive action fails closed and the transaction rolls back.
- For a committed action whose activity must cross a service boundary, use a
  transactional outbox and an idempotent trusted consumer. Reusing `id` with
  different immutable content is an integrity error.
- The normal web and worker roles receive the minimum required `INSERT` and
  authorized `SELECT`; they cannot `UPDATE`, hard-delete, or truncate activity
  history. Retention, legal hold, anonymization, and purge use a separate
  controlled maintenance role and runbook and leave verifiable evidence.
- Append-only runtime grants protect against application mistakes, not a
  privileged database operator. The security model must state whether the
  threat/risk requires hash chaining, signed batches, immutable object-storage
  export, or another tamper-evident/WORM control and must not claim the table is
  tamper-proof without verification.
- Foreign-key and deletion rules must preserve the required history. Prefer
  durable opaque references and intentional snapshots; never use cascading
  deletion from actor, tenant, or target tables without an approved retention
  decision.
- Record the attempt as well as the outcome only for tags whose security,
  support, or business requirements need it. Avoid generating noisy rows for
  ordinary reads unless the data classification or threat model requires read
  access auditing.

Scale and access rules:

- Estimate events per action, tenant, day, and retention period before launch.
  `jsonb` adds flexibility; it does not itself provide scale.
- Use keyset pagination with a deterministic cursor such as
  `(recorded_at, id)`, never unbounded reads or unsafe large offset scans.
- At minimum, review B-tree access paths for tenant timeline, tenant +
  module/tag timeline, target history, actor history, and request/job
  correlation. Add the indexes that serve active documented queries and prove
  high-volume paths with representative `EXPLAIN` evidence.
- Provide an explicit partial/indexed path for platform-scope rows when they
  exist. Never depend on `tenant_id = NULL` equality semantics.
- Partition by recorded time only after measured volume, retention deletion,
  vacuum, or index size justifies it. Do not create one table or partition per
  tenant by default. Define partition creation, late events, legal hold,
  archive, restore, and drop runbooks before activating partitioning.
- Default list/detail/export APIs and UIs to the authorized tenant scope.
  Apply module/tag, actor, target, and date filters server-side; never expose raw
  `data_json` directly. Render an allowlisted projection per registered tag.
- Store durable facts rather than localized presentation sentences. The tag
  registry defines the web/Flutter i18n key, compatible projection, and fallback
  for each version; snapshot exact text only when legal/business evidence
  specifically requires it.
- Test wrong-tenant direct access, RLS or compensating enforcement, tag/schema
  rejection, JSON size and redaction, transactional rollback, duplicate
  delivery, actor/user ID plus name/role/assignment snapshot provenance,
  actor/impersonator attribution, source-IP derivation, immutable behavior,
  pagination stability, retention/legal hold, and authorized export.

`activity-log.md` must also state which actions are intentionally not captured,
the rationale, activity-history UI/API requirements or `N/A` decision, support
and incident search workflows, expected delays, degraded behavior, storage
forecast, and evidence that critical rows are actually persisted. If a project
also creates `security_events`, analytics, or domain-history tables, document
their distinct purpose, writer, retention, and source of truth so the same
event is not inconsistently duplicated.

It must map the canonical authenticated actor context to `actor_id`,
`actor_type`, `actor_display_snapshot`, `actor_role_keys_snapshot`,
`role_assignment_id`, `impersonator_id`, registered scope, and non-secret
session/request correlation; define autonomous/anonymous nullability; and state
that snapshots explain history but never grant current authorization.

`security-model.md` must contain:

- assets, threats, trust boundaries, and abuse cases
- authentication and recovery
- browser and native session rules, including the explicit per-actor device and
  concurrent-session policy from Section 11.1
- default-deny authorization model, role/capability lifecycle, revocation,
  delegation, impersonation, break-glass, separation of duties, and enforcement
  points
- canonical immutable authenticated actor context, server-derived field
  provenance, protected fail-closed behavior, full-user/credential exclusion,
  and the rule that context/role/display name never replaces target-level
  authorization
- application-role versus PostgreSQL-role boundary, least-privilege grants, RLS
  decision, and privileged database access
- secrets and rotation
- CSRF, XSS, IDOR, injection, SSRF, replay, and open-redirect controls
- shareable-entry, invitation, pairing, QR/code, or deep-link threat controls
  when those capabilities exist; a URL is never authority merely because it is
  difficult to guess
- upload, file-serving, dependency, CSP, and third-party-script controls
- activity/audit integrity, writer/reader/maintenance roles, fail-closed action
  classes, privacy, retention, legal hold, anonymization, export, incident, and
  disclosure rules
- security verification and residual risks

`permissions-matrix.md` owns application authorization decisions. It references
actors from the product specification and must not confuse product roles with
PostgreSQL access roles.

It must name the authenticated-actor context fields available to policies,
which values identify the principal/scope, which values are snapshot-only,
missing/stale/revoked behavior, and tests proving no client forgery,
cross-request leakage, display-name authorization, or role-only bypass.

Start with an actor and role catalog:

| Role ID | Actor type/purpose | Assignment authority | Scope | Inheritance | Preconditions | Prohibited actions | Expiry/revocation |
| --- | --- | --- | --- | --- | --- | --- | --- |

Then define a stable capability catalog:

| Permission ID | Action | Resource | Owning module | Risk | Description | Default |
| --- | --- | --- | --- | --- | --- | --- |

The default is `Deny`. Every grant needs an explicit rule. If role inheritance
exists, document its direction, conflict behavior, and tests; otherwise state
that roles do not inherit.

The decision matrix must be action- and state-specific:

| Permission ID | Actor/role | Tenant/scope | Ownership/relationship | Record state/preconditions | Capability flag | Decision | UI behavior | Server policy/enforcement | Denial code | Activity tag | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Allowed decision values are:

- `Allow` — all named conditions are satisfied
- `Deny` — explicitly prohibited
- `Conditional` — the complete Boolean rule and missing-condition denial are
  written in the row

The document must also define:

- default-deny and explicit-deny precedence
- grant, invitation, acceptance, scope change, suspension, expiry, revocation,
  and session/cache invalidation behavior
- who may assign or remove each role/capability and whether re-authentication,
  approval, reason, or separation of duties is required
- temporary access, delegation, impersonation, support access, override, and
  break-glass behavior
- mutually exclusive roles or capabilities
- row-, field-, export-, and aggregate-level visibility when full-resource
  access would expose too much
- activity-history list, detail, module/tag class, tenant/platform scope, and
  export permissions, including whether support or auditors may see actor,
  source IP, reason, change values, and tag-specific `data_json` projections
- behavior for disabled users, deleted memberships, changed tenant ownership,
  stale sessions, background jobs, and realtime subscriptions
- UI gating, scope-safe lookup, server enforcement point, handled numeric denial
  code, user recovery, warning log, and audit requirement
- direct-request allow and deny tests for wrong role, scope, owner, state,
  capability, identifier, and impersonation context

Role-level `Yes`/`No`, hidden controls, route middleware, or a successful
scope-free record lookup are never sufficient authorization documentation.

`realtime-events.md` remains required when the current decision is
request-driven. Each event must define:

- stable ID, event name, version, producer, and trigger
- payload schema and revision
- tenant/actor scope and subscription authorization
- consumers and UI effect
- ordering, duplicate, stale, reconnect, replay, and missed-event behavior
- retention, observability, and fallback request

Event meaning belongs here and must remain independent of a particular live
transport. When realtime is inactive, record why, the activation trigger,
candidate event IDs, and the owner/review date.

When realtime is active, `realtime-protocol.md` must define the complete
cross-platform contract instead of scattering it across source comments:

1. scope and capability decision:
   - user workflows that need live server-to-client or client-to-server
     behavior
   - why polling or SSE is insufficient
   - latency, availability, connection, message-rate, and payload budgets
   - approved standards-based WebSocket baseline and the dated library
     acceptance evidence from Section 3.6
2. topology:
   - dedicated gateway process/container and ownership
   - load balancer/proxy upgrade, idle-timeout, TLS, origin, and health behavior
   - API replicas, gateway replicas, PostgreSQL outbox dispatcher, dedicated
     realtime Redis, and client data flow
   - independent API/gateway scaling, graceful connection drain, and deployment
     compatibility
3. endpoints and connection:
   - `wss` endpoint, supported subprotocol/version, maximum handshake size, and
     origin policy
   - short-lived, single-use connection ticket issued through the normal
     authenticated API; expiry, redemption, replay protection, and revocation
   - server-derived actor, tenant, device/client, permissions, and connection
     context; clients never choose a trusted tenant or room
   - connect, authenticate, subscribe, reauthorize, heartbeat, idle, close,
     reconnect, and shutdown state machine
4. protocol registry:

| Frame | `kind` | Direction | Version | Zod schema | Dart model | Authorization | Idempotency/order | Ack/result | Size/rate limit | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

5. close-code registry:

| Close code | Stable name | Meaning | Client retry | Reauthenticate | Refetch/resubscribe | Log level | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |

6. subscription registry:

| Subscription | Scope source | Permission/policy | Filter schema | Event IDs | Initial snapshot | Missed/stale recovery | Revocation | Limits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

7. delivery and recovery:
   - PostgreSQL is durable truth and transactional outbox is the reliable
     post-commit event handoff
   - dedicated realtime Redis Pub/Sub is ephemeral cross-gateway fanout with
     at-most-once delivery
   - environment/service/protocol namespace and tenant-safe routing
   - duplicate, stale revision, out-of-order, missing-event, reconnect, and
     authoritative-refetch behavior
   - whether any workflow truly requires durable replay; if so, define its
     durable store and cursor instead of pretending Pub/Sub provides replay
8. client behavior:
   - one Nuxt/Vue connection owner around native `WebSocket`/VueUse
     `useWebSocket`
   - one Flutter data-layer connection owner using `web_socket`
   - exponential backoff with jitter and ceiling, online/offline awareness,
     reauthentication, resubscription, and refetch after reconnect
   - foreground/background lifecycle; use FCM/APNs for background mobile
     notification instead of relying on a persistent Flutter socket
   - minimum supported protocol/app versions and incompatible-version behavior
9. capacity, abuse, and operations:
   - connection, subscription, frame-size, message/byte-rate, and fanout limits
   - bounded outbound buffers, slow-consumer policy, admission control, and
     overload behavior
   - gateway and Redis failure modes, deploy drain, regional behavior, and
     incident/runbook ownership
   - metrics, logs, traces, privacy/redaction, load-test profiles, and release
     evidence

All JSON frames must reject unknown unsupported versions and validate through
Zod on the TypeScript boundary. Flutter consumes equivalent generated or
reviewed typed Dart models plus shared valid/invalid protocol fixtures; it does
not execute Zod. Text JSON is the default. Binary/protobuf requires measured
need and an ADR.

Use two related envelopes, each with a distinct purpose:

```json
{
  "kind": "command_result",
  "message_id": "msg_01...",
  "success": false,
  "code": 1204,
  "message": "This record has changed. Refresh and try again.",
  "data": {
    "current_revision": 8
  },
  "request_id": "req_01..."
}
```

Command results preserve the normal API result semantics: only `code: 0` is a
real success; expected non-zero results are structured handled outcomes and
emit `warn`; unexpected processing failures use a registered internal non-zero
code, emit `error`, and never expose a stack.

```json
{
  "kind": "event",
  "event_id": "evt_01...",
  "name": "order.updated",
  "version": 1,
  "occurred_at": "2026-07-30T10:15:21.512Z",
  "scope": {
    "tenant_id": "tnt_01..."
  },
  "resource": {
    "type": "order",
    "id": "ord_01...",
    "revision": 8
  },
  "payload": {},
  "correlation_id": "cor_01..."
}
```

Inbound durable commands must invoke the same authorized application use case
as HTTP and retain idempotency, transaction, audit, and result-code behavior.
The gateway may handle transport-only operations such as heartbeat and
subscription state; it must not duplicate domain business logic.

`jobs-and-schedulers.md` must include:

Queue registry:

| Queue ID | Queue name | BullMQ prefix/namespace | Environment isolation | Purpose | Producers | Workers | Tenant model | Concurrency/rate limit | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Job registry:

| Job ID | Queue | Job name/version | Scope | Payload schema | `jobId` template | Deduplication ID/mode | Durable idempotency key | Attempts/backoff | Timeout | Retention | Terminal failure/runbook |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Scheduler registry:

| Scheduler ID template | Queue/job | Global or tenant scope | Schedule/timezone | Upsert/removal owner | Overlap/misfire behavior | Idempotency | Monitoring/runbook |
| --- | --- | --- | --- | --- | --- | --- | --- |

It must define:

- separate cache and queue Redis assumptions
- environment and service namespace, queue names, job names, custom job IDs,
  deduplication IDs, durable idempotency keys, and stable scheduler IDs as
  separate concepts
- canonical identifier grammar, normalization, allowed characters, maximum
  length, ownership, versioning, collision behavior, and worked examples
- tenant/global scope, timezone, purpose, and owner
- enqueue and processing validation
- retries, deduplication, cancellation, and idempotency
- worker concurrency, tenant fairness, priority, ordering, backpressure,
  resource limits, and graceful shutdown
- completed/failed retention and replay policy
- terminal failure, alert, and recovery procedure
- prefix/namespace migration, producer-worker compatibility, and queue drain or
  replay procedure
- deployment-safe scheduler synchronization

`mobile-platform-contract.md` owns cross-platform and native integration
behavior. It must not duplicate Flutter source architecture.
