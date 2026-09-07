
### 10.5 BullMQ queues and workers

Apply this module to active project-owned background work. An external provider
owning asynchronous processing does not require the client project to deploy
BullMQ; document its exposed job/status/retry contract at the integration
boundary instead.

- Run workers as dedicated processes, not inside request handlers.
- Define queue names, job names, payload schemas, return types, and event names
  centrally.
- Put identifiers, idempotency information, and the minimum execution contract
  in a job payload.
- Declare each job's state semantics: either load current durable state with an
  expected revision/precondition, or process an immutable snapshot/version
  reference captured by the triggering action. Do not silently process newer
  state when the original revision matters.
- Do not put secrets, access tokens, full documents, or unnecessary personal
  data in job payloads.
- Validate payloads at enqueue and processing boundaries.
- Make processors idempotent and safe to retry.
- Use deterministic idempotency/deduplication keys for externally triggered
  side effects.
- Define attempts, exponential backoff, timeout/cancellation, retention,
  concurrency, and terminal-failure handling per job type.
- Attach error, failed, completed, retry, and stalled telemetry.
- Use higher concurrency for measured I/O-bound jobs.
- Use sandboxed processors or separate compute workers for CPU-heavy jobs.
- Gracefully close workers on `SIGINT` and `SIGTERM`.
- Keep recent completed jobs for visibility and failed jobs long enough for
  investigation; do not retain everything forever.

#### 10.5.1 Queue namespace and identity contract

Do not use “queue key” as an ambiguous term. Define and document these separate
identities:

1. BullMQ Redis `prefix`: service/environment namespace for BullMQ-managed keys
2. queue name: stable business-capability lane
3. job name: versioned processor contract inside a queue
4. BullMQ `jobId`: queue-scoped job record identity and short-lived duplicate
   suppression
5. deduplication ID: explicit simple, throttle, debounce, or keep-latest scope
6. durable idempotency key: PostgreSQL/outbox uniqueness for the business effect
7. scheduler ID: stable identity used with `upsertJobScheduler`

Namespace rules:

- Centralize one BullMQ configuration factory and use the same connection,
  `prefix`, and queue-name registry for `Queue`, `Worker`, `QueueEvents`,
  `FlowProducer`, and scheduler operations.
- Use a predictable prefix such as
  `<service>:<environment>:bullmq:<contract-version>`. Environment is required
  in this namespace even when infrastructure is normally isolated.
- Define canonical, validated service and environment slugs in server
  configuration. Do not allow aliases such as `prod` and `production` to create
  different namespaces for the same deployment.
- Treat a prefix or namespace-version change as a queue migration, not a cache
  flush. Inventory waiting, active, delayed, repeatable, and failed work; define
  producer/worker cutover, drain or replay, rollback, and monitoring before the
  change.
- Use BullMQ's `prefix` option. Do not configure the incompatible ioredis
  `keyPrefix` option and do not hand-build, scan, rename, or delete BullMQ's
  internal Redis keys in application code.
- Queue names are low-cardinality, lowercase capability names such as
  `email-delivery` or `report-generation`. Do not put tenant IDs, request IDs,
  dates, deployment hashes, or user input in queue names.
- Do not create one queue per tenant by default. Use separate tenant queues only
  when measured noisy-neighbor isolation, dedicated concurrency/rate limits,
  compliance, or operational ownership requires them, and record the decision
  in an ADR.
- If Redis Cluster or another Redis-compatible engine is used, document and
  test its BullMQ key-slot/prefix requirements. Do not introduce hash-tag syntax
  by guesswork.
- Environment and tenant namespace values come from validated server
  configuration and authenticated scope, never directly from a client field.
- Producers must derive job name, tenant scope, custom job ID, deduplication ID,
  and scheduler ID from registered server-side builders. Public request bodies
  must not choose these infrastructure identities.

Example identity set:

| Concept | Example | Scope and purpose |
| --- | --- | --- |
| BullMQ prefix | `orders:production:bullmq:v1` | Isolates service, environment, and queue-contract generation. |
| Queue name | `email-delivery` | Stable low-cardinality capability, shared by tenants by default. |
| Job name | `send-order-confirmation.v1` | Versioned processor/payload contract. |
| Custom `jobId` | `tnt_01--send-order-confirmation--ord_01--v1` | Queue-scoped record identity and temporary duplicate suppression. |
| Deduplication ID | `tnt_01--order-confirmation--ord_01` | Product-selected simple/throttle/debounce scope. |
| Durable idempotency key | `order-confirmation--ord_01--revision_3` | PostgreSQL/outbox uniqueness for the external business effect. |
| Scheduler ID | `platform--expire-orders--v1` | Stable deployment-managed scheduler identity. |

The environment is intentionally carried by the BullMQ prefix and by log/job
context. Do not repeat it in every `jobId`, deduplication ID, or scheduler ID
unless jobs can legitimately cross namespace boundaries and an ADR documents
why. Repetition does not replace namespace isolation.

Every job uses a versioned envelope:

The following shape illustrates a project with tenant and platform scope.
Materialize its exact scope keys from the approved authorization-scope catalog;
do not introduce a new product entity called `tenant`. When `tenant_id` denotes
the isolation root, document its mapping and carry any narrower authorized
scope references required by the command. A genuinely global job uses the
documented platform/global form without a fabricated tenant. The generated
schema, identifiers, queries, activity, and tests must use that same mapping.

```ts
interface JobEnvelope<T> {
  schema_version: number
  environment: string
  scope: 'platform' | 'tenant'
  tenant_id: string | null
  initiator_type: 'actor' | 'service' | 'scheduler'
  initiator_id: string
  request_id: string | null
  trace_id: string | null
  correlation_id: string
  causation_id: string
  idempotency_key: string
  enqueued_at: string
  payload: T
}
```

Envelope rules:

- `environment` is injected from runtime configuration. A worker must reject and
  alert on an environment mismatch.
- A tenant-scoped job requires the immutable internal `tenant_id`. A mutable
  display code or slug may be included separately for diagnostics but must not
  be the authorization or uniqueness key.
- A platform-scoped job uses `scope: platform` and `tenant_id: null`; never omit
  scope and let a processor guess.
- `initiator_type` and `initiator_id` identify the human, service, or scheduler
  that caused the command. They provide attribution and audit correlation; they
  do not grant the worker the initiator's permissions.
- Include only identifiers and the minimum immutable snapshot or revision
  reference needed by the processor. Load authoritative records through a
  tenant-scoped query and recheck tenant state and authorization-sensitive
  preconditions before side effects.
- Preserve validated `request_id` and `trace_id` when a request initiated the
  job; use `null` for genuinely request-independent work. `correlation_id`
  connects a workflow across requests and jobs. `causation_id` identifies the
  event, outbox row, scheduler occurrence, or command that directly caused this
  job.
- `idempotency_key` identifies the business effect and remains stable across
  enqueue retries. Do not use a random value when retries must converge, and do
  not place secrets or direct personal data in the key.
- Validate the complete envelope and versioned payload with Zod at enqueue and
  worker boundaries. Reject unknown or unsupported schema versions through the
  documented terminal-failure path.
- Before any tenant-owned read or side effect, the worker must establish tenant
  context from the validated envelope and prove that every loaded record belongs
  to that tenant. A job ID containing a tenant ID is correlation, not
  authorization.

Custom `jobId` rules:

- Use custom `jobId` only when its duplicate-suppression semantics are
  intentional. Otherwise allow BullMQ to generate the record ID.
- A tenant-scoped template should normally be
  `<tenant-id>--<job-name>--<business-key>--v<contract-version>`.
- A platform-scoped template should normally be
  `platform--<job-name>--<business-key>--v<contract-version>`.
- Build IDs through one tested helper with a restricted character set and
  bounded length. Canonicalize allowed enum segments and hash an unsuitable
  business key instead of truncating it into collisions. Custom BullMQ job IDs
  must not contain `:`.
- Never place email addresses, phone numbers, names, secrets, raw URLs, access
  tokens, or other sensitive/user-controlled values in a job ID. Use immutable
  internal IDs or a non-reversible bounded hash when necessary.
- Job IDs are unique only within one queue. Include the job name when different
  job contracts in the same queue could otherwise collide.
- Document whether the business key represents an event, command, entity
  revision, or requested side effect. Do not reuse one ID across meanings.
- Job retention affects duplicate suppression: after a completed or failed job
  is removed, the same `jobId` may be accepted again. Therefore a custom
  `jobId` is never the only guarantee for money, inventory, notification,
  webhook, or other externally visible effects.

Deduplication and durable idempotency rules:

- Use a separate deduplication ID when the product needs simple, throttle,
  debounce, or keep-latest behavior. Include tenant scope in the ID for
  tenant-owned work.
- Document the selected mode, TTL, replacement behavior, and what happens to
  the earlier request. Emit and monitor BullMQ deduplicated/duplicated events.
- Never use debounce or replace semantics for financial, inventory, approval,
  audit, or ordered domain events unless the product explicitly defines
  latest-wins behavior.
- Manual job or deduplication-key removal changes duplicate behavior and must be
  restricted, logged, and covered by a runbook.
- Enforce durable idempotency in PostgreSQL or the transactional outbox with a
  unique business key such as
  `(scope_type, scope_id, operation, idempotency_key)`, where `scope_id` is
  non-null for both tenant and platform scope. The processor records/checks
  that result in the same durable transaction where practical.
- Do not assume a nullable `tenant_id` inside an ordinary PostgreSQL unique
  constraint protects platform-scoped work: ordinary uniqueness permits
  multiple nulls. Use a non-null canonical scope key, `NULLS NOT DISTINCT`, or
  reviewed partial unique indexes, and test both tenant and platform collisions.
- A retry, stalled recovery, replay, scheduler overlap, or re-enqueue after job
  cleanup must converge on the same durable result.

Multi-tenant capacity and ordering rules:

- Define per-queue backpressure, maximum accepted payload size, queue-depth and
  oldest-job thresholds, producer behavior when overloaded, and a safe pause
  and resume procedure.
- Measure queue wait and processing latency by safe tenant tier or class when
  the product needs noisy-neighbor detection. Do not put raw tenant IDs into
  low-cardinality metric labels.
- If one tenant can monopolize capacity, document and test the chosen fairness
  control: bounded per-tenant admission, tenant-aware dispatch, partitioned
  queues, dedicated workers, or an approved grouped/rate-limited capability.
- Do not assume a queue provides tenant-local ordering when concurrency,
  retries, delayed jobs, priorities, or multiple workers are enabled. Work that
  requires ordering must define the partition key, sequence/revision check,
  locking or serialization mechanism, stale-event behavior, and recovery path.
- Define priority classes centrally and test starvation behavior. Tenant or
  client input must not set an unrestricted BullMQ priority.

### 10.6 Scheduling

Apply this subsection only when scheduled work is active. A queue used only
for event-triggered jobs does not require a scheduler process or scheduler
tests.

- Use BullMQ Job Schedulers and stable scheduler IDs.
- Use `upsertJobScheduler` so deployment is repeatable and does not duplicate
  schedules.
- Do not introduce the obsolete `QueueScheduler` pattern.
- Store schedule timezone, owner, purpose, job template, and expected run window
  in `docs/jobs-and-schedulers.md`.
- Define missed-occurrence behavior explicitly: skip, coalesce, or bounded
  catch-up from a durable due-work ledger. BullMQ produces the next scheduled
  job when the previous one starts processing; a busy or stopped worker can
  make execution less frequent than the configured interval. Do not promise
  one execution for every wall-clock interval from a scheduler ID alone.
- Define daylight-saving gaps/overlaps, time-window boundaries, disable/re-enable,
  and deployment-cutover behavior. When an enabled flag gates work, check it
  at execution as well as schedule registration; an existing scheduler can
  outlive a configuration change.
- Monitor missed, delayed, overlapping, failed, and long-running scheduled work.
- Make scheduled work idempotent across deploys, restarts, and clock changes.
- Keep environment in the BullMQ prefix rather than duplicating it in every
  scheduler ID. Use `platform--<job-name>--v<version>` for a global scheduler
  and `<tenant-id>--<job-name>--v<version>` only when one scheduler per tenant
  is justified.
- For large tenant counts, prefer a bounded global scheduler that selects due
  tenants from PostgreSQL and enqueues tenant-scoped jobs over creating an
  unbounded scheduler inventory. Document the scale threshold and fairness
  behavior.
- Scheduler synchronization must upsert desired IDs, report configuration
  drift, and deliberately remove or disable obsolete IDs. Never remove unknown
  schedulers automatically without a reviewed ownership rule.

### 10.7 Reliable side effects

When a database write must reliably enqueue work:

- prefer a transactional outbox or an equivalently durable handoff
- process outbox rows idempotently
- record the committed business decision and durable delivery intent before
  external delivery; mark delivery successful only from the provider's defined
  acknowledgement
- model external provider retries separately from user-visible state

An outbox or PostgreSQL uniqueness constraint alone cannot make an external
provider call exactly once. Reuse the provider's supported idempotency key and
record its reconciliation reference. If a timeout or worker crash leaves the
delivery outcome unknown, reconcile before retrying a non-idempotent effect.
For providers without deduplication or lookup, document the possible duplicate
or loss boundary and the approved manual recovery; never claim guaranteed
single delivery. Test the affected crash window and recovery when introducing
or changing that delivery boundary.

Do not pretend a database transaction and Redis enqueue are one atomic operation.
