
### 10.3 Cache Redis

Apply this subsection only when caching is active. Queue or realtime use of
Redis does not itself activate an application cache.

Redis cache is disposable acceleration:

- PostgreSQL remains the source of truth.
- Use versioned, namespaced keys such as
  `<service>:<environment>:<version>:<scope>:<resource>:<id>`.
- Define TTL, invalidation trigger, stale tolerance, and owner for every cache.
- Add bounded TTL jitter when synchronized expiry would cause a stampede.
- Never cache authorization decisions longer than their safe invalidation
  window.
- Avoid caching secrets or raw sensitive responses.
- Degrade safely when cache Redis is unavailable.
- Record cache hit, miss, error, and latency metrics without logging values.

### 10.4 Separate Redis roles: cache, BullMQ, and realtime

Treat these as different infrastructure roles:

| Role | Activation | Durability/eviction | Failure behavior |
| --- | --- | --- | --- |
| Cache Redis | When caching is active | Disposable, bounded TTL, reviewed eviction policy. | Bypass or degrade without corrupting durable truth. |
| BullMQ Redis | When jobs/schedulers are active | Queue-appropriate persistence and `noeviction`. | Stop unsafe enqueue/processing paths, alert, and recover through the queue runbook. |
| Realtime Redis | When realtime is active | Ephemeral Pub/Sub fanout; `noeviction` is not a delivery guarantee. | Existing local connections may continue; cross-gateway live delivery may be missed, so clients reconnect/refetch authoritative state. |

Use separate instances or independently managed clusters in production. One
local Compose stack may run distinct Redis services for the active roles; it
must not collapse them merely to reduce the service count.

Do not place critical BullMQ data in a Redis instance that may evict arbitrary
keys. Do not let cache flushes, queue maintenance, or realtime connection/fanout
load affect another role. Enable and verify the persistence/backup policy
appropriate to BullMQ's durability requirements. Realtime Redis is not a
durable event store; PostgreSQL/outbox remains the recoverable truth.

Prefer separate deployments per environment. A Redis database number is not an
adequate production isolation boundary. Redis Pub/Sub channels are not scoped
by database number, so realtime channels must include a validated namespace
such as
`<service>:<environment>:realtime:<protocol-version>:<scope>:<scope-id>:<topic>`.
Tenant scope uses the immutable internal tenant ID; platform scope uses the
registered literal `platform`. A mutable tenant code/slug may appear only as
safe diagnostic metadata, never as authorization or the sole namespace key.
BullMQ continues to use its own required `prefix`. Credentials and network
policy must prevent one environment or role from operating another.
