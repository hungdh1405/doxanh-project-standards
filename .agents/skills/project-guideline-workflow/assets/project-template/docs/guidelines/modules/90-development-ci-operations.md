
## 14. Development, CI, and operations

### 14.1 Local environment

Docker Compose is the required Nuxt local-development environment. A developer
with Git, Docker Engine/Desktop, the Compose v2 plugin, and Make must be able to
run the project without installing Node, pnpm/Bun, PostgreSQL, or Redis directly
on the host.

The Flutter exception is explicit: Docker may run APIs and dependencies, and
may optionally run platform-neutral Dart checks, but native Flutter emulators,
device debugging, signing, and platform builds use the supported host/native CI
toolchain. Do not imply that a container proves iOS/Android behavior.

#### 14.1.1 Required generated files

Every generated Nuxt project includes:

| File | Required responsibility |
| --- | --- |
| `compose.yaml` | Canonical local service, network, volume, health, profile, and development-watch model. Use the current Compose Specification without an obsolete top-level `version`. |
| `Dockerfile` | Named multi-stage development, build, and production runtime targets. Add separate final targets for web/worker/realtime only when their artifacts differ. |
| `.dockerignore` | Exclude Git metadata, local environments/secrets, dependencies, build output, test evidence, editor files, and other unnecessary or sensitive build context. |
| `.env.example` | Document every local setting with non-secret development-safe placeholders and required/optional status. |
| `Makefile` | Default `help` target and stable lifecycle, quality, database, queue, and documentation commands. |
| `docker/` | Only reviewed entrypoints, healthchecks, or scripts too substantial for readable Compose/Dockerfile commands. |
| `docs/local-development.md` | Human contract generated from and verified against the files above. |

Use one root `Dockerfile` with reusable named stages by default. Do not generate
near-identical `Dockerfile.web`, `Dockerfile.worker`, and
`Dockerfile.scheduler` files merely because processes have different commands.
A separate Dockerfile requires materially different operating-system/runtime
dependencies and a documented owner.

Do not create several Compose override files preemptively. Add a committed
profile or override only for a real optional capability or platform constraint,
and document the exact merge command. `compose.yaml` remains the normal path.

#### 14.1.2 Compose service contract

The baseline service graph is:

| Service | Default | Contract |
| --- | --- | --- |
| `web` | Required | Nuxt development server; binds inside the container to `0.0.0.0`; exposes the documented host URL. |
| `postgres` | Required | Project database with healthcheck and project-scoped named volume. |
| `redis-cache` | Required when caching is active | Disposable cache role with its documented eviction policy. |
| `redis-queue` | Required when BullMQ is active | Separate persistent/no-eviction queue role. |
| `redis-realtime` | Required when realtime is active | Separate ephemeral Pub/Sub fanout role; never treated as durable event history. |
| `worker` | Required when BullMQ jobs are active | Dedicated process built from the same reviewed source/lockfile. |
| `realtime` | Required when realtime is active | Dedicated `ws` gateway process with health, limits, and graceful drain; may use a named Compose profile until activated. |
| `migrate` | Required one-shot task | Applies committed Drizzle migrations deliberately; it is not an always-running service or per-replica startup hook. |
| `scheduler-sync` | Required when schedulers are active | One-shot idempotent synchronization task, normally activated explicitly. |
| Mail/object-storage/provider emulators | Conditional profile | Add only when a real local workflow needs them; use deterministic configuration. |

Compose rules:

- Give the project one stable, collision-resistant Compose project name. Do not
  use fixed `container_name` values; let Compose scope generated resources.
- Preserve an explicit shell or local `.env` project-name override through Make
  wrappers so a clean rehearsal cannot recreate another running project.
- If several process-role containers mount one image-populated dependency
  volume, initialize it through exactly one non-started container before
  parallel startup. Never rely on concurrent Docker volume copy-up; test this
  contract with a new project name and empty volumes.
- Host-side Compose and verification orchestration must use runtime built-ins or
  explicitly bootstrapped tools. It must not import application packages from a
  host `node_modules` directory when dependencies are owned by Docker volumes.
  Set an explicit local default such as
  `COMPOSE_PROJECT_NAME=<project-slug>-dev` and document how a second clone
  chooses a different name.
- Use service names such as `postgres` and `redis-queue` for container-to-
  container DNS. Never persist container IP addresses and never use `localhost`
  to reach another container.
- Add real healthchecks and use `depends_on` conditions such as
  `service_healthy` or `service_completed_successfully` when readiness/order
  matters. A container merely being started is not proof that its dependency is
  ready.
- Use `init: true` or an equivalent reviewed init/signal strategy for long-
  running development processes. Verify Nuxt and BullMQ graceful shutdown.
- Keep optional administration/debugging tools behind named Compose profiles.
  Core dependencies remain unprofiled so normal startup is predictable.
- Do not use privileged mode, host networking/PID namespaces, broad device
  mounts, or the Docker socket without an approved, documented requirement.
- Bind only required host ports, normally to `127.0.0.1`. Prefer `make db-shell`
  or `make redis-shell` over exposing infrastructure ports globally.
- Validate the fully rendered model with `docker compose config --quiet` in
  local verification and CI.

#### 14.1.3 Source synchronization and dependency lifecycle

- Prefer Compose Watch for the Nuxt/server/worker inner loop when the required
  Compose version supports it. Sync source/configuration paths, ignore
  `node_modules`, `.nuxt`, `.output`, coverage, and evidence, and rebuild when
  `Dockerfile`, the selected lockfile, or package manifests change.
- A verified bind-mount design is acceptable when it performs better for the
  supported hosts. Never let a host `node_modules` directory replace Linux
  container dependencies.
- Keep package-manager caches and container dependencies in controlled cache or
  named-volume locations. Lockfile changes must trigger a deterministic frozen
  reinstall/rebuild.
- Test hot reload, file creation/deletion, Vue/Nuxt type generation, worker
  restart, and signal handling on every supported host family.
- Do not enable polling globally without evidence. If a host/filesystem requires
  polling, expose a documented local setting with a safe interval.

#### 14.1.4 Network and volume contract

Use one project-scoped backend network for services that need to communicate.
This is the normal “shared network” inside one project.

- Keep PostgreSQL, cache Redis, BullMQ Redis, and realtime Redis only on the
  project backend network.
- When a local reverse proxy or another Compose project must reach the
  application, define one explicitly named external shared network. Attach only
  the web/API or gateway service that needs cross-project communication; keep it
  attached to the project backend network as well.
- Declare the external name through one documented variable such as
  `DEV_SHARED_NETWORK`; every participating project must use the same validated
  value. Do not confuse it with the project-scoped backend network.
- `make setup` may idempotently create the configured external network after
  validating its exact name. Normal Compose project networks are created and
  removed by Compose.
- `make destroy` must never remove an external shared network.
- Do not attach every local project, database, or Redis instance to one global
  network. Do not use static IP addresses or legacy `links`.
- Name all persistent data as Compose project-scoped named volumes. Source code
  remains a bind/sync input, not a database volume.
- `stop`, `start`, rebuild, and normal `down` preserve named volumes. Only an
  explicitly confirmed destructive target may remove them.
- Document whether local uploads/object storage are ephemeral or persistent and
  include them in reset/export behavior.

#### 14.1.5 Dockerfile and image rules

- Use the current Dockerfile syntax and named multi-stage targets such as
  `base`, `development`, `build`, `web-runtime`, and, when needed,
  `worker-runtime`.
- Pin supported base-image versions and review digest updates through dependency
  maintenance. Do not use floating `latest` for a reproducible project
  baseline.
- Install dependencies from the one selected lockfile with frozen behavior.
  Structure copy/install layers so ordinary source changes reuse dependency
  cache.
- Use BuildKit cache mounts where they improve repeatable build time.
- Build Nuxt and any worker artifacts in build stages. Production targets copy
  only required runtime artifacts and production dependencies.
- Run production processes as a non-root user with deliberate file ownership.
  Do not retain package-manager caches, compilers, test evidence, or development
  tools in the final image without a runtime need.
- Never pass credentials through Docker `ARG` or persisted build `ENV`. Use
  BuildKit secret/SSH mounts for unavoidable private build inputs and runtime
  secret/configuration injection for runtime values.
- Do not copy `.env`, credentials, local volumes, Git history, or private
  evidence into an image. Verify the effective `.dockerignore`.
- Use exec-form commands and verify PID 1 signal propagation, graceful
  shutdown, health behavior, and a bounded shutdown timeout.
- Build, scan, and smoke the production target in CI. Development-container
  success alone is not production-image evidence.

#### 14.1.6 Makefile command contract

The root `Makefile` is the human command facade. Its default target is `help`,
and every public target has a `##` description rendered by `make help`, including
parameters, examples, and a visible `[destructive]` marker where applicable.

Minimum target surface:

| Target | Required behavior |
| --- | --- |
| `make help` | List public targets, purpose, parameters, examples, and destructive markers. |
| `make doctor` | Check Docker daemon, Compose/Make capabilities, required files, port conflicts, architecture, and configuration prerequisites without changing the machine. |
| `make config` | Validate environment requirements and the rendered Compose model without printing secrets. |
| `make setup` | Idempotently prepare a clean clone: create `.env` only when absent, create an approved external network when configured, build images, start healthy dependencies, migrate, seed the selected development profile, and start the stack. Never overwrite local configuration or existing data. |
| `make pull` | Pull/update declared base/service images without starting or deleting services. |
| `make build [SERVICE=name]` | Build all or one allowlisted service using cache. |
| `make dev` | Run the normal foreground/watch development workflow with readable logs and signal handling. |
| `make up` | Create/start the normal stack in detached mode and wait/check health. |
| `make start` | Start previously stopped containers without rebuilding or recreating them. |
| `make stop` | Stop containers without removing containers, networks, or volumes. |
| `make restart [SERVICE=name]` | Restart all or one allowlisted existing service without deleting data. |
| `make rebuild [SERVICE=name]` | Rebuild and recreate all or one allowlisted application service without deleting named volumes. |
| `make down` | Remove project containers and Compose-owned networks while preserving named volumes and external networks. |
| `make destroy CONFIRM=destroy` | **[destructive]** Remove only this Compose project's containers, orphans, and named volumes after exact confirmation; preserve external networks, bind-mounted source, and unrelated images/volumes. |
| `make clean` | Remove documented generated build/test artifacts only; never candidate manual-evidence bundles, database, Redis, upload, or external-network data. |
| `make ps` | Show service state and health. |
| `make health` | Check service health/readiness and print actionable failures. |
| `make logs [SERVICE=name]` | Follow all or one allowlisted service's logs. |
| `make shell [SERVICE=web]` | Open a non-root shell in an allowlisted running application container. |
| `make db-shell` | Open the project PostgreSQL client without exposing credentials in process output. |
| `make redis-shell ROLE=cache|queue|realtime` | Open the selected active project Redis client without logging secrets. |
| `make migrate` / `make db-check` | Apply committed migrations deliberately through the approved runner / verify applied history, schema drift, required objects/policies, and runtime-role access without mutating application data. |
| `make db-backup [BACKUP_FILE=path]` | Create an operator-invoked logical PostgreSQL backup at a new explicit/default path, validate that the archive is readable, create a SHA-256 sidecar, use restrictive permissions, and refuse overwrite. This target does not schedule backups. |
| `make db-restore BACKUP_FILE=path CONFIRM=restore-db` | **[destructive]** Verify the file/checksum/archive before fencing writers, replace only the configured project database after exact confirmation, run committed migrations and integrity/health checks, and leave writers stopped on failure. Production/provider restore requires its separately approved runbook. |
| `make seed [PROFILE=development]` | Run an allowlisted deterministic seed profile. |
| `make reset-db CONFIRM=reset-db [PROFILE=development]` | **[destructive]** Reset only the project database and reseed after exact confirmation. |
| `make lint` / `make typecheck` / `make test` | Run the corresponding project checks inside the documented container target. |
| `make test-api` / `make test-e2e-smoke` / `make test-e2e` / `make test-a11y` | Run the canonical Playwright API, fast browser, full browser-matrix, and accessibility scripts against isolated Compose services or the named candidate environment. |
| `make docs-check` | Run the complete project-book validation command family. |
| `make verify-automated` | From a clean immutable checkout, run and record all automated release checks. |
| `make evidence-init [IMAGE=reference]` / `make evidence-check` | Initialize then validate the external candidate-bound human evidence bundle. |
| `make verify` | Aggregate current full automated evidence and completed manual evidence for the same candidate. |

Makefile rules:

- Declare non-file targets `.PHONY` and keep the default goal as `help`.
- Use the Compose v2 command `docker compose`; do not introduce legacy
  `docker-compose`.
- Keep targets non-interactive unless the command is explicitly human-only.
  CI-safe targets fail with useful exit codes.
- Validate `SERVICE`, `PROFILE`, `ROLE`, and confirmation variables against
  allowlists before interpolation into commands.
- Never run `docker system prune`, `docker volume prune`, broad image removal,
  `sudo`, host package installation, or destructive globs from a project
  Makefile.
- Make targets wrap canonical package/Compose commands; they do not implement
  business logic. Move complex portable logic into reviewed `scripts/` files
  and test it.
- Use the selected pnpm/Bun commands consistently inside the image. Do not
  silently fall back to a host package manager.
- Test `make help`, `doctor`, `config`, `setup`, lifecycle distinctions,
  backup overwrite/checksum/archive guards, restore writer fencing/failure
  behavior, parameter validation, and destructive confirmation from a clean
  clone.

#### 14.1.7 Deterministic seed and fixture profiles

Document and provide separate profiles when applicable:

- `base`: minimum reference/configuration data
- `development`: varied local data for normal development
- `demo`: stable, reviewable product stories with realistic content
- `automation`: smallest deterministic dataset for tests and evidence capture
- `performance`: large-volume data with no real personal information
- `failure`: explicit conflict, expired, permission-denied, retry, and outage
  scenarios

Rules:

- Use stable identifiers and credentials where automation needs them.
- Use controlled local media fixtures, not random remote images.
- Seed time-dependent data relative to a documented clock or fixed test clock.
- Make reruns idempotent or require an explicit safe reset.
- Print or write a gitignored seed report containing useful local URLs, actors,
  roles, scopes, and non-production credentials when humans need them.
- Never place production credentials, copied customer data, or sensitive
  personal data in seeds.
- Test seed commands in CI when they are part of onboarding, demo, or evidence
  generation.
- Distinguish seeded proof from browser-created and production-like proof.

### 14.2 CI

CI must:

- install each ecosystem from its applicable committed lockfile without mutation
- run `deps:check` and `standards:check`; reject unregistered/deprecated/
  forbidden direct dependencies, competing lockfiles, stack mixing, prohibited
  import crossings, and generated-code drift
- validate `compose.yaml` and Make target smoke fixtures without production
  credentials
- run all documentation generation/check commands and fail on generated-region
  drift
- validate formatting, lint, typecheck, Vitest suites, Playwright direct-API
  tests, the required browser project matrix, and automated accessibility
- start real PostgreSQL and Redis for integration coverage
- run `docs:data:check`; verify Drizzle schema/migration drift, empty and
  upgrade migration paths, documented runtime database roles, important
  DATA/QRY/TX contracts, and tenant/RLS enforcement as applicable
- build the production Nuxt output
- build the production web and conditional worker/realtime image targets, smoke
  their startup/health/shutdown/drain behavior, and scan dependencies, secrets,
  and images
- retain useful failure artifacts without retaining secrets
- reject committed focused tests such as `.only`
- allow skipped tests only when each skip has a visible reason, owner, tracking
  issue, and expiry or platform condition; report skips in CI
- reject unreviewed generated migration drift
- when Flutter is in scope, verify its formatting, analysis, generated-code
  drift, tests, and release-mode build in a separate native-client job

### 14.3 Deployment topology

Run separately scalable processes:

- Nuxt/Nitro web
- realtime WebSocket gateway when active
- BullMQ worker
- scheduler synchronization/release task
- migration/release task

Do not run migrations independently from every web replica at startup.

The realtime gateway scales independently of the request-driven Nuxt API.
Configure the edge/load balancer for WebSocket upgrade, TLS, idle timeout,
connection limits, health, and graceful drain. Reconnect may land on any
gateway; restore subscriptions and authoritative state through the protocol
rather than application sticky sessions. Deploy the dedicated realtime Redis
role independently from cache and BullMQ Redis.

Local Compose is a development and integration contract, not an automatic
production orchestrator decision. Production may use Compose, Kubernetes, a
managed container platform, or another approved target, but it must deploy the
same reviewed immutable production image targets and preserve their
configuration, health, signal, migration, worker, scheduler, and observability
contracts. Record topology-specific differences in architecture and production
readiness.

Recommended compatibility-aware order:

1. backup/preflight
2. apply expand/backward-compatible migrations
3. deploy workers that can process both old and new job payload versions
4. deploy web/API producers that remain compatible with the deployed workers
5. deploy protocol-compatible realtime gateways before publishing new event
   versions, then drain old gateways
6. activate or upsert new schedulers and behavior-changing feature flags
7. run health and smoke tests
8. verify logs, queue/realtime health, scheduler state, and key workflows
9. complete contract migrations and forward-only cleanup in a later safe release

Do not activate a scheduler or producer for a new job contract before compatible
workers are ready. When a release cannot maintain old/new compatibility, pause
the affected producer/scheduler explicitly and document the controlled cutover.

### 14.4 Native distribution

When Flutter is in scope:

- build signed native artifacts separately from the Nuxt deployment
- bind each flavor to an explicit API environment and application identifier
- keep signing keys and store credentials outside source control
- define semantic application versions and monotonically increasing platform
  build numbers
- verify permissions, privacy manifests, deep links, push entitlements, and
  store declarations against the shipped behavior
- use staged rollout, crash monitoring, server compatibility windows, and a
  documented minimum-supported-version policy
- prove the release build on representative real devices before submission

### 14.5 Backup, restore, and rollback

- Back up PostgreSQL and durable uploaded media.
- Provide explicit manual backup and guarded restore commands before deciding
  whether scheduling belongs in the project. Do not create an automatic backup
  scheduler merely because PostgreSQL exists; record the owner, cadence,
  retention, storage, and alerting requirements first.
- Define whether backups are physical, logical, snapshot, and/or continuous
  point-in-time recovery; include required extensions, encryption keys,
  database roles/grants/policies, migration history, and object-storage version
  compatibility.
- Configure BullMQ Redis durability appropriate to business impact.
- Keep backups outside the primary failure domain.
- Encrypt backups and restrict restore access.
- Test restore into an isolated environment on a schedule. Verify row counts and
  critical invariants, tenant/RLS separation, activity history, migration state,
  application compatibility, and representative read/write workflows rather
  than treating a successful restore command as complete proof.
- Record recovery point and recovery time objectives.
- Keep application rollback compatible with the currently deployed database
  schema.
- Document migration failure, partial non-transactional DDL, backfill resume,
  point-in-time recovery selection, queue replay, and partial-deployment
  recovery. Never run a destructive recovery against production merely to test
  the runbook.

### 14.6 Performance

- Set measurable budgets for JS, CSS, images, fonts, API latency, query latency,
  queue age, conditional realtime connections/messages/fanout/reconnect, and Web
  Vitals.
- Lazy-load heavy route or dialog content.
- Use `@nuxt/image`, declared dimensions, and appropriate responsive sources.
- Install only the icon collections used.
- Avoid dynamic icon names that defeat static scanning.
- Virtualize rows inside a bounded result page only when measurement proves it
  necessary; virtualization never replaces the mandatory pagination contract.
- Reserve space for async content to avoid layout shift.
- Measure before adding memoization, cache, or concurrency.
- Test representative low-end phones and realistic network conditions.
- When Flutter is in scope, set native startup, frame rendering, memory, binary
  size, network, and battery budgets and profile release-mode builds.
