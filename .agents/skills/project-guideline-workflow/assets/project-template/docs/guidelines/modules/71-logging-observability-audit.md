
## 12. Logging, observability, and audit structure

### 12.1 Code ownership

Use clear, shared observability boundaries:

```text
server/utils/logger.ts
server/utils/log-redaction.ts
server/middleware/request-context.ts
shared/constants/observability-events.ts
shared/types/observability.ts
shared/constants/activity-tags.ts
shared/schemas/activity-log.ts
server/services/activity-log/
server/repositories/activity-log-repository.ts
workers/utils/logger.ts
workers/utils/job-context.ts
apps/mobile/lib/core/observability/
```

- Use Pino-compatible structured JSON on the server and in workers.
- Create child loggers from validated request/job context so call sites do not
  reconstruct actor, scope, correlation, and deployment fields inconsistently.
- Apply allowlisted serializers and redaction before an event leaves the
  process; downstream collector redaction is an additional safeguard, not the
  first protection.
- Pretty-print locally only.
- Write production logs to stdout/stderr for the runtime collector.
- Do not write rotating application log files inside ephemeral containers.
- Client errors go through an approved error-reporting boundary; do not bundle
  server logging configuration or secrets into the browser.
- Flutter diagnostics use the native profile's redacted development logger.
  Production crash/error telemetry must use an approved mobile reporting
  boundary and the same stable event vocabulary where applicable.

### 12.2 Log-level contract

Use the native Pino-compatible severity vocabulary:

| Level | Use | Production rule |
| --- | --- | --- |
| `trace` | Extremely detailed step-level diagnostics for a narrowly scoped investigation. | Off by default; temporary, targeted, sampled, and expiry-controlled when enabled. |
| `debug` | Developer diagnostics, safe derived state, and decision-path detail. | Off or sampled by default; never required to understand a normal business result. |
| `info` | Normal lifecycle events and completed HTTP `200` results with `success: true`, `code: 0`. | Retained according to the operational policy. |
| `warn` | Expected HTTP `200` non-zero business/validation/security results, retry, recoverable degradation, or approaching limits. | No manufactured exception stack for expected results. |
| `error` | Unexpected request, job, database, integration, migration, or system operation failure requiring investigation. | Include one restricted structured error at the owning boundary. |
| `fatal` | The process cannot start or continue safely, such as invalid critical configuration or an unrecoverable runtime failure. | Emit once, flush through the approved boundary, and perform controlled shutdown. |

`silent` may be a logger configuration but is not an event severity. Never use
`error` merely because an expected business result has a non-zero code; those
results remain `warn`.

### 12.3 Canonical log context and fields

Every event must answer the applicable parts of:

- **when:** when it was recorded and, if different, when the source event
  occurred
- **where:** service, runtime, environment, version, deployment location, and
  normalized route or operation
- **who/source:** authenticated actor, tenant, session correlation, impersonator,
  client/network source, or initiating system
- **what:** stable event, action, and affected target
- **outcome:** success, numeric result code, reason, duration, retry, or error
- **correlation:** request, trace/span, job, scheduler, and parent identifiers

Every event includes these base fields:

| Field | Meaning |
| --- | --- |
| `schema_version` | Integer log-contract version used by parsers and dashboards. |
| `timestamp` | ISO-8601 UTC time when the emitter recorded the event. |
| `level` | `trace`, `debug`, `info`, `warn`, `error`, or `fatal`. |
| `service` | Stable service or deployable process name. |
| `runtime` | `web`, `realtime`, `mobile`, `worker`, `scheduler`, `migration`, or `script`. |
| `environment` | `local`, `test`, `staging`, or `production`. |
| `version` | Build/commit identifier. |
| `event` | Stable dot-separated event name. |
| `message` | Short human-readable summary; never the only machine signal. |

Add the applicable context:

| Field | Meaning |
| --- | --- |
| `occurred_at` | Original event time when delayed, imported, offline, or different from `timestamp`. |
| `region` / `zone` / `instance_id` | Deployment location and instance/container identity when the platform provides them. |
| `request_id` | Correlates one inbound request and matches the response header/envelope. |
| `trace_id` / `span_id` / `parent_span_id` | Distributed trace context when enabled. |
| `actor_id` / `actor_type` | Opaque or pseudonymous authenticated human or machine actor. |
| `actor_role_keys` | Bounded registered active role keys when useful for security/support diagnosis; never localized labels and never metric labels. |
| `tenant_id` | Tenant, organization, workspace, account, or equivalent scope. |
| `session_id_hash` | Salted, non-reversible correlation value when session-level investigation is approved; never the real session credential. |
| `impersonator_id` | Actual acting identity when a represented actor is in use. |
| `source` | Approved network/client context such as trusted client IP representation, trusted proxy ID, normalized user-agent family, client type, and client version. |
| `action` | Stable operation name such as `order.create` or `permission.assign`. |
| `target` | Business-safe target type and opaque ID; never the complete object. |
| `http` | Method, normalized route, and status code. |
| `result` | Response-envelope `success`, numeric `code`, safe reason, and registered retryability. |
| `job` | Registered `queue_name`, `job_name`, `job_id`, safe deduplication reference, optional non-reversible `idempotency_key_hash`, attempt/max-attempts, scheduler/parent ID, and status. |
| `realtime` | Safe connection, protocol, frame/event/command, subscription type, close-code, and delivery context. Never a ticket, token, raw frame, Redis channel, or unbounded room/member list. |
| `duration_ms` | Measured operation time. |
| `error` | Sanitized unexpected-error contract from Section 12.5. |

Presence rules:

- HTTP completion events include `request_id`, `http`, `action`, `result`, and
  `duration_ms`.
- Authenticated operations include `actor_id`, `actor_type`, and applicable
  `tenant_id`; include bounded registered role keys when the event needs that
  authorization context. Anonymous operations use an approved anonymous
  correlation value only when needed.
- Actor display names are personal and mutable. Keep them in the authorized
  durable activity snapshot; do not include them in ordinary application logs
  unless a documented privacy-approved event requires the name and its
  retention/access policy.
- Jobs include `job`, originating request/trace context when available, and the
  durable actor/scope context required by the job contract.
- Realtime lifecycle and message results include `realtime`, safe actor/tenant
  context, gateway instance, and request/trace/correlation fields when
  available. Use opaque bounded `connection_id`, `message_id`, and `event_id`;
  do not put those high-cardinality values in metric labels.
- Job logs always include the runtime `environment` and applicable `tenant_id`
  as top-level context. Do not depend on parsing either value back out of an ID.
- Log job lifecycle IDs only when they satisfy the safe identifier policy. Hash
  an idempotency or deduplication value before logging when its business key is
  sensitive; never log a job payload to obtain context.
- Production server/worker events include deployment location and instance
  context when the runtime exposes them.
- Client/source fields are included only when their monitoring, security, audit,
  or support value is documented and the privacy contract permits them.
- Unexpected failures include `result`, `error`, and all safe operation context
  needed to identify the failed boundary.

Use dot-separated event names such as:

- `http.request.completed`
- `http.request.failed` for unexpected HTTP `500` failures
- `api.result.warned` for handled HTTP `200` outcomes with non-zero codes
- `auth.login.succeeded`
- `auth.login.failed`
- `authorization.denied`
- `permission.assignment.changed`
- `db.query.slow`
- `db.migration.failed`
- `cache.hit`
- `cache.miss`
- `cache.failed`
- `job.enqueued`
- `job.deduplicated`
- `job.skipped`
- `job.completed`
- `job.retrying`
- `job.failed`
- `job.stalled`
- `scheduler.upserted`
- `realtime.connection.accepted`
- `realtime.connection.rejected`
- `realtime.connection.closed`
- `realtime.subscription.accepted`
- `realtime.subscription.denied`
- `realtime.command.completed`
- `realtime.command.warned`
- `realtime.command.failed`
- `realtime.consumer.slow`
- `realtime.gateway.draining`
- `realtime.fanout.failed`
- `integration.request.failed`
- `process.startup.failed`

### 12.4 Example request event

```json
{
  "schema_version": 1,
  "timestamp": "2026-07-30T10:15:21.512Z",
  "level": "info",
  "service": "orders",
  "runtime": "web",
  "environment": "production",
  "version": "git:abc1234",
  "region": "ap-southeast",
  "zone": "ap-southeast-a",
  "instance_id": "orders-web-7d9f",
  "event": "http.request.completed",
  "message": "Request completed",
  "request_id": "req_01...",
  "trace_id": "tr_01...",
  "span_id": "sp_01...",
  "actor_id": "usr_01...",
  "actor_type": "staff",
  "tenant_id": "org_01...",
  "source": {
    "client_ip": "203.0.113.0/24",
    "ip_representation": "masked",
    "trusted_proxy_id": "edge-01",
    "user_agent_family": "Chrome",
    "client_type": "web",
    "client_version": "2026.07.30"
  },
  "action": "order.create",
  "target": {
    "type": "order",
    "id": "ord_01..."
  },
  "http": {
    "method": "POST",
    "route": "/api/orders",
    "status_code": 200
  },
  "result": {
    "success": true,
    "code": 0,
    "retryable": false
  },
  "duration_ms": 84
}
```

### 12.5 Unexpected-error contract

An `error` or `fatal` event includes a bounded, sanitized object:

| Field | Meaning |
| --- | --- |
| `type` | Stable application error class/type. |
| `technical_code` | Safe dependency/runtime code when useful; the API result remains `result.code`. |
| `message` | Sanitized diagnostic summary without secrets or unnecessary personal data. |
| `component` / `operation` | Owning technical boundary and failed operation. |
| `retryable` | Whether the same operation may be retried and under which registered policy. |
| `fingerprint` | Stable grouping key that does not contain raw sensitive values. |
| `cause` | Bounded safe cause type/code chain; never an unbounded serialized exception. |
| `stack` | One restricted server-side stack when policy permits. Never returned to clients. |

Example:

```json
{
  "schema_version": 1,
  "timestamp": "2026-07-30T10:15:26.512Z",
  "level": "error",
  "service": "orders",
  "runtime": "web",
  "environment": "production",
  "version": "git:abc1234",
  "event": "http.request.failed",
  "message": "Order creation failed unexpectedly",
  "request_id": "req_01...",
  "trace_id": "tr_01...",
  "actor_id": "usr_01...",
  "tenant_id": "org_01...",
  "action": "order.create",
  "http": {
    "method": "POST",
    "route": "/api/orders",
    "status_code": 500
  },
  "result": {
    "success": false,
    "code": 9000,
    "retryable": true
  },
  "error": {
    "type": "DatabaseTimeoutError",
    "technical_code": "connection_timeout",
    "message": "Database operation timed out",
    "component": "order_repository",
    "operation": "insert_order",
    "retryable": true,
    "fingerprint": "database-timeout:orders:create",
    "cause": {
      "type": "ConnectionTimeoutError",
      "technical_code": "pool_timeout"
    },
    "stack": "restricted server-side stack"
  },
  "duration_ms": 5032
}
```

### 12.6 Logging rules

- Validate an inbound request ID against a bounded format and length before
  accepting it; otherwise generate a new one. Return the chosen value in the
  response header and envelope.
- Carry request, trace, actor, tenant, and job correlation through services,
  repositories, integrations, outbox rows, and enqueued jobs without putting
  credentials into the context.
- Emit one completion event per normal request. Add a start event only for
  genuinely long-running diagnostics.
- Emit HTTP `200`, `success: true`, `code: 0` at `info`.
- Emit HTTP `200`, `success: false`, non-zero code at `warn`; include code,
  action, normalized route, target type when safe, and request ID without an
  exception stack.
- Emit unexpected HTTP `500` at `error` with the registered non-zero internal
  result code and one restricted error contract.
- Log an unexpected error with its full safe detail once at the boundary that
  owns the failure. Callers add missing correlation only; they do not repeat the
  same stack at every layer.
- Use `fatal` only when the process cannot start or continue safely. Do not use
  it for an individual failed request or job when the process remains healthy.
- Derive `client_ip` only from the connection and an explicitly configured
  trusted-proxy chain. Never trust or log an arbitrary raw `X-Forwarded-For`
  value as the verified client address.
- Treat IP addresses, user agents, device identifiers, actor IDs, session
  correlations, and location data according to the privacy classification.
  Collect only what has a named use, choose full/masked/hashed representation,
  and define access and retention.
- Do not derive or retain geolocation merely because an IP address is available.
- Normalize routes, event names, action names, target types, error types, and
  provider names. Do not create unbounded labels from raw URLs, messages,
  filenames, queries, or user input.
- Sanitize carriage returns, newlines, control characters, and other log
  injection content in untrusted strings.
- Log business-safe identifiers and bounded summaries, not entire objects.
- Never log request/response bodies by default.
- Never log passwords, secrets, cookies, authorization headers, session values,
  signed URLs, payment data, database connection strings, raw SQL parameters,
  raw uploaded documents, queue payloads, or unrestricted provider responses.
- Use numeric result codes for handled outcomes and structured error objects for
  unexpected failures. Do not serialize an exception into a handled warning.
- Keep permitted stack traces in restricted server-side telemetry with defined
  access, retention, export, and deletion controls.
- Do not upload mobile breadcrumbs, device identifiers, screenshots, or stack
  traces without an approved privacy, consent, retention, and redaction policy.
- Keep host clocks synchronized and preserve `occurred_at` for delayed/offline
  events rather than rewriting history to ingestion time.
- Version the log schema and update collectors, dashboards, alerts, and tests
  compatibly before removing a field.
- Log normal realtime connect/close/subscribe lifecycle at bounded `info`;
  sampled diagnostics at `debug`; handled denial, rate, malformed-input, and
  slow-consumer outcomes at `warn`; unexpected gateway/use-case/Redis failures
  at `error`; and an unusable gateway process at `fatal`. Apply sampling or
  aggregation to high-volume event delivery without losing failure evidence.
- Test redaction, trusted-proxy resolution, request/job propagation, level
  mapping, duplicate suppression, error serialization, and logger failure
  behavior.
- Define slow request, slow query, slow job, queue depth, non-zero-result rate,
  HTTP `500` error rate, fatal-process rate, and retry alert thresholds.
  Dashboards group handled warnings by numeric result code, action, normalized
  route, service, and safe scope—not raw message text.

### 12.7 Durable activity/audit records are not application logs

Audit records are durable, append-only business/security records. They include:

- occurred-at and recorded-at timestamps
- explicit tenant/platform scope and immutable internal tenant ID when scoped
- registered `module_key` and `tag_type` identifying the owning module and
  action/event meaning
- actor ID/type and execution source/service/normalized operation
- represented actor and impersonator/override context
- permission/policy ID
- target type and ID
- before/after summary or changed fields when safe
- reason/comment, approval, or break-glass reference when required
- outcome and registered result code
- request/trace/job correlation and approved source IP/context
- a versioned, Zod-validated, bounded PostgreSQL `jsonb` `data_json` value for
  tag-specific safe context

Audit retention, access, export, integrity, legal hold, and redaction rules
belong in `docs/security-model.md`. Audit records must not contain credentials,
unbounded payloads, or unnecessary personal data. Do not use ordinary
application logs as the only audit trail. Implement the table, tag registry,
atomic-write, access, scaling, and verification rules from the durable
activity-log contract in Section 4.9; the project-specific semantic catalog
belongs in `docs/activity-log.md`.

### 12.8 Health, metrics, traces, and alerts

Provide:

- liveness endpoint: process can answer
- readiness endpoint: required dependencies are usable
- protected diagnostic endpoint or runbook for detailed dependency state
- request count, latency, status, and error metrics
- PostgreSQL pool/query health
- cache latency/hit/miss/error metrics
- BullMQ waiting, active, delayed, failed, retry, stalled, and age metrics
- scheduler lateness
- realtime active/accepted/rejected connections, reconnects, subscriptions,
  inbound/outbound message and byte rates, command result codes, slow consumers,
  close codes, outbound-buffer pressure, event-loop lag, gateway memory,
  outbox/fanout latency and failures, Redis Pub/Sub health, and drain duration
- external integration latency/error metrics
- deployment version and environment labels

Do not expose secrets or detailed infrastructure state on a public health
endpoint.

The project documents must choose and name the alert-delivery topology; this
guideline does not mandate Grafana, Prometheus, or Alertmanager. A smaller
project may use an application-native model when the decision is explicit:

- persist a fingerprint-deduplicated incident in PostgreSQL
- separate new occurrence, acknowledgement, resolution, and recurrence facts
- notify authorized operators by in-app inbox/toast and durable queued email
- send one email per newly opened incident, not per repeated occurrence
- record current recipient delivery status through an idempotent effect ledger
- require current-version locking, confirmation, actor context, and a bounded
  resolution note for human transitions
- write incident state and registered activity/outbox intent atomically
- keep raw exceptions, request bodies, credentials, and unrestricted log text
  out of incident/email/activity projections
- test permission denial, concurrent detection, stale human action, email
  retry, responsive UI, accessibility, and durable audit history

This simple topology must state its blind spot: an unavailable application or
database cannot persist, display, or email its own total outage. If the project
requires all-down detection, add an independent external uptime probe. Do not
claim that application-native alerts replace that independent boundary.

Projects with approved scale, SLO, retention, query, or cross-service needs may
instead activate an external telemetry/alerting stack. Name its ownership,
cardinality, scrape/ingestion security, alert rules, deduplication, routing,
retention, cost, and recovery evidence in `docs/observability.md`; never add the
stack only because it is conventional.
