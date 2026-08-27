
### 10.8 Realtime

Realtime is conditional. Start request-driven and activate a live transport only
when timeliness materially improves an approved workflow. Once bidirectional
web and Flutter behavior is required, the generic default is standards-based
WebSocket:

```text
Nuxt web ─┐
          ├─ WSS ─> load balancer ─> realtime gateway replicas (`ws`)
Flutter ──┘                         │
                                   ├─ authorized use cases ─> PostgreSQL
PostgreSQL outbox ─> dispatcher ─> realtime Redis Pub/Sub
                                   └─> all gateway replicas ─> subscribers
```

#### 10.8.1 Transport and library decision

- Use a dedicated TypeScript/Node LTS gateway process with `ws`.
- Web clients use the browser's native WebSocket API through one application
  boundary; VueUse `useWebSocket` is the approved reactive wrapper.
- Flutter clients use Dart's `web_socket`.
- Keep the public protocol RFC 6455/WebSocket-compatible so web, Flutter, test,
  and operational clients are not coupled to a vendor protocol.
- Socket.IO is not the default. It may be approved only when its additional
  protocol features are a demonstrated product requirement and every target
  client, scaling adapter, and operational consequence is accepted in an ADR.
- SSE is an approved simplification only for explicitly one-way,
  browser-oriented live updates. It is not the cross-platform bidirectional
  baseline.
- Nitro-native WebSocket support or a cross-runtime wrapper may replace the
  gateway only after its current stability, runtime behavior, deployment
  target, and load evidence pass Section 3.6. Do not base a generic production
  standard on an experimental runtime feature.
- Keep `permessage-deflate` disabled by default. Enable and tune compression
  only after representative concurrency, memory, CPU, and payload tests.

#### 10.8.2 Gateway topology and autoscaling

- Deploy the realtime gateway independently from Nuxt API replicas. Do not keep
  long-lived sockets inside otherwise stateless autoscaled API replicas.
- A live TCP/WebSocket connection naturally remains on its selected gateway.
  Raw WebSocket does not require application sticky sessions for a reconnect;
  the client may reconnect to any healthy replica and restore state from the
  documented protocol.
- The load balancer must support WebSocket upgrade, TLS, bounded handshake
  limits, deliberate idle timeout, connection draining, and real
  liveness/readiness checks.
- API autoscaling is based on request/latency/resource signals. Gateway
  autoscaling is based on active connections, connection rate, subscriptions,
  inbound/outbound messages and bytes, event-loop lag, memory, outbound-buffer
  pressure, and fanout latency. Do not use CPU alone.
- Scale out before connection and memory ceilings. Define safe maximum
  connections per replica from load tests, not library marketing.
- On deployment or scale-in, mark the gateway unready, stop accepting
  connections, optionally send a bounded retry hint, drain for a documented
  interval, close remaining connections with a registered close code, and let
  clients reconnect elsewhere.
- Multi-region deployment must define connection routing, tenant/data
  residency, regional Pub/Sub topology, failover, and authoritative data access.
  Do not assume one global Redis solves regional delivery.

#### 10.8.3 Authentication, tenancy, and authorization

- The normal authenticated API issues a short-lived, single-use connection
  ticket bound to the session/actor, tenant/scope, client type, allowed
  protocol version, expiry, and random nonce. Store only the minimal
  replay-prevention state.
- Redeem the ticket during connection establishment. Do not place a long-lived
  bearer/access/refresh token in a WebSocket URL or arbitrary client-selected
  subprotocol.
- Derive actor, tenant, permissions, and allowed subscriptions server-side.
  Never trust a client-provided tenant ID, room, channel, actor, role, or
  infrastructure namespace as authorization.
- Recheck authorization for every subscription and durable command. Define how
  role change, membership removal, logout, session revocation, and tenant
  suspension close or reduce an existing connection.
- Apply origin allowlisting to browser upgrades, rate-limit ticket issue and
  redemption, and cap connections/subscriptions per actor, tenant tier, IP
  representation, and device as privacy and abuse policy permit.
- Treat Flutter and other non-browser clients as authenticated native clients;
  origin checks do not replace their ticket and device/session controls.

#### 10.8.4 Protocol and validation

- Use versioned JSON text frames by default. Every frame includes a registered
  `kind`, protocol version or versioned frame name, bounded opaque identifier,
  and only the context needed for that frame.
- Validate upgrade inputs and every inbound TypeScript frame with Zod. Close or
  reject malformed, oversized, unknown-kind, unknown-version, or
  rate-violating input according to the registered protocol result/close code.
- Generate or review equivalent typed Dart models and share valid/invalid JSON
  fixtures across gateway, Nuxt, and Flutter tests. Flutter does not run Zod.
- Register frame schemas, direction, authorization, idempotency, ordering,
  result/ack behavior, size, and rate limits in
  `docs/realtime-protocol.md`.
- A client command has a unique `message_id`. A command result contains
  `kind`, `message_id`, and the standard `success`, numeric `code`, `message`,
  `data`, and `request_id` fields. Only `code: 0` is success; expected non-zero
  results are handled `warn` outcomes, and unexpected failures are `error`.
- A server event has `event_id`, stable name, version, occurrence time, scope,
  resource ID/revision, payload, and correlation ID. Event IDs and revisions
  let clients ignore duplicates and stale updates; they do not promise replay.
- Heartbeats, subscribe/unsubscribe, command, command-result, event, and
  server-draining behavior are explicit registered frames or standard
  ping/pong behavior. Do not create ambiguous free-form messages.
- Define standard and private-use close codes, stable names, retryability,
  reauthentication/refetch action, logging level, and safe client copy.

#### 10.8.5 Commands and event delivery

- Transport-only messages such as heartbeat and subscription changes may be
  handled by the gateway.
- Ephemeral signals such as presence, cursor movement, or typing indicators may
  use the gateway and realtime Redis directly only when their loss is harmless.
  Give them authorization, TTL, coalescing, and strict rate/size limits; never
  treat them as audit or durable business state.
- Durable commands must call the same service/use-case layer as HTTP, with the
  same authorization, Zod-derived contract, transaction, idempotency, audit,
  and response result-code semantics. Do not implement business logic twice.
  A chat/support message, approval, order change, or other business record is a
  durable command even when submitted over WebSocket.
- Commit durable state first and publish the resulting event through a
  transactional outbox dispatcher.
- Use dedicated realtime Redis Pub/Sub for low-latency fanout between gateway
  replicas. Its delivery is at-most-once: a disconnected gateway or client may
  miss a message.
- Because the default recovery is reconnect, resubscribe, and refetch, do not
  add a replay store preemptively. When a workflow requires guaranteed event
  consumption or resume-from-cursor, define its durable log, retention,
  authorization, cursor, compaction, and recovery through an ADR.
- Never publish directly to client-selected Redis channels. Route through a
  server-owned registry and validated environment/service/protocol namespace.
- When measured fanout traffic outgrows ordinary Pub/Sub, evaluate Redis
  sharded Pub/Sub or another partitioned fanout layer through load tests and an
  ADR. Preserve event/protocol contracts and reconnect/refetch behavior.
- Keep payloads small and scoped. Publish identifiers, revision, and the minimum
  safe display delta; clients refetch large or security-sensitive resources.
- Do not turn heavy reports, file bodies, or bulk exports into realtime frames.
  Publish status/progress and fetch the result through the normal API.

#### 10.8.6 Client lifecycle and recovery

- Maintain one connection owner per signed-in browser tab/application policy
  and one per active Flutter application session. Feature components subscribe
  through that boundary; they do not create arbitrary sockets.
- Use exponential reconnect backoff with jitter and a maximum delay. Pause while
  offline/backgrounded where appropriate and respect registered server retry
  hints without creating a reconnect storm.
- After reconnect: obtain/redeem a fresh ticket when required, reauthenticate,
  resubscribe, and refetch authoritative snapshots for active workflows before
  trusting further deltas.
- Reconcile by resource revision. Ignore known duplicates/stale revisions;
  refetch on a gap, unknown state, permission change, or protocol mismatch.
- Preserve useful pending UI state, but never treat unsent or unacknowledged
  client messages as committed. Durable commands require idempotency keys when
  a retry could repeat an external effect.
- Flutter sockets are foreground live behavior. Use platform push
  notifications through FCM/APNs for background/offline delivery and refetch
  on notification open or app resume.
- Expose explicit connecting, live, reconnecting, stale/offline, and
  permission-lost UI states only where they change the user's next action.

#### 10.8.7 Backpressure, security, and proof

- Set maximum connection handshake, frame, decompressed-frame, command rate,
  byte rate, subscription count, fanout, and outbound-buffer limits.
- Use bounded per-connection queues. A slow consumer must be coalesced,
  resynchronized, or disconnected by a documented policy; never allow
  unbounded memory growth.
- Validate UTF-8/JSON safely, reject unsupported binary input, prevent
  compression bombs, cap parsing work, and never log raw frames by default.
- Sanitize all client-visible messages and telemetry. Do not expose internal
  channel names, Redis keys, stack traces, connection tickets, tokens, or
  unrestricted payloads.
- Load-test representative web and Flutter connection churn, steady
  connections, subscriptions, broadcasts, tenant hotspots, slow consumers,
  Redis interruption, gateway restart/drain, deploy, and reconnect storms.
- Prove horizontal delivery across at least two gateway replicas, authorization
  revocation, reconnect/refetch recovery, and API autoscaling independence
  before calling realtime production-ready.
