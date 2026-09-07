
## 3. Approved technology baseline

### 3.1 Core stack

The table is a profile catalog, not an installation list. Browser packages
apply to `nuxt-web`; server/ORM/process packages apply to owned `nuxt-api`
responsibilities; Flutter/Dart packages apply to `flutter-native`. A client
that consumes an external API does not install that service's stack. Shared
quality and documentation obligations use the selected platform's tools.

| Concern | Standard | Rule |
| --- | --- | --- |
| Web framework | Nuxt 4 | Use the latest stable Nuxt 4 release for new projects. |
| Native mobile client | Flutter | Independent native profile or companion; consumes documented APIs and shares product/security contracts. |
| Native mobile language | Dart | Pin the SDK range supported by the selected Flutter release. |
| Web UI framework | Vue 3 | Use Composition API and `<script setup lang="ts">`. |
| Web language | TypeScript | Enable strict type checking; avoid untyped public boundaries. |
| Web component system | shadcn-vue with `shadcn-nuxt` | Use default components and official composition patterns. |
| Web styling | Tailwind CSS v4 | Application code uses it for layout and responsive composition only. |
| Web theme | shadcn-vue CSS variables | Approved project theme; green fallback when no design exists; light, dark, and system modes. |
| Web client state | Pinia | Required for the Nuxt application-shell blocking-activity controller; use it for other shared client state only when genuinely needed. |
| Web utilities | VueUse | Prefer proven SSR-safe composables over local reinvention. |
| Web forms | VeeValidate + Zod | Typed client schemas; server validation remains mandatory. |
| Server request validation | Zod | The only approved schema-validation library for params, query, selected headers, and bodies. |
| Server dependency injection | Awilix | Server/worker/realtime composition roots only; strict mode, typed cradle, explicit registrations, and execution scopes. |
| Database | PostgreSQL | Durable relational source of truth. |
| ORM | Drizzle ORM + Drizzle Kit | Schema, migrations, typed queries, and reviewed SQL. |
| Cache | Redis | Cache only; use explicit TTL and invalidation. |
| Queue and scheduler | BullMQ | Dedicated workers and current Job Scheduler APIs. |
| Realtime transport | Standards-based WebSocket | Conditional. Use a separately scalable gateway when bidirectional live behavior is approved. |
| Node realtime server | `ws` | Conditional default for the Node LTS gateway; keep the wire protocol library-neutral. |
| Web realtime client | Browser `WebSocket` through VueUse `useWebSocket` | Use the platform transport with one application-owned connection/reconnect boundary. |
| Flutter realtime client | Dart `web_socket` | Conditional cross-platform client; keep transport below repositories/use cases. |
| Realtime fanout | Dedicated Redis realtime role | Conditional ephemeral cross-gateway fanout; PostgreSQL remains durable truth. |
| Web motion | shadcn-vue transitions, AutoAnimate, GSAP | Choose the smallest capable layer. |
| Web dates | Day.js | Centralize plugins, locale, UTC, and timezone behavior. |
| Web general utilities | Lodash | Import only the functions that add real value. |
| Web HTTP | Nuxt `$fetch` / `useFetch`; Axios where justified | Do not duplicate the same fetching concern. |
| Web localization | `@nuxtjs/i18n` | No hardcoded user-facing copy in reusable product UI. |
| Web icons | `@nuxt/icon` plus the shadcn-vue configured icon library | Use one visual icon family; no emoji as structural icons. |
| Web images | `@nuxt/image` | Use responsive sizes, dimensions, and modern formats. |
| Web linting | `@nuxt/eslint` | Project-aware flat configuration. |
| Web/server testing | Vitest and Nuxt test utilities | Unit, component, in-process route, server, database, queue, and integration coverage. |
| Browser and API automation | Playwright Test | Required black-box browser workflows and direct HTTP API contract tests against a running application. |
| Automated accessibility | `@axe-core/playwright` | Required automated checks on important rendered routes and interaction states; manual review remains required. |
| Server/worker logging | Pino-compatible structured JSON | One event contract across web, workers, and schedulers. |
| Local development environment | Docker Engine/Desktop with Docker Compose v2 | Nuxt, workers, PostgreSQL, cache Redis, and BullMQ Redis run through the committed Compose contract. |
| Development command facade | `Makefile` | One documented, self-describing command surface over Compose and project scripts. |

### 3.2 Version policy

- Start with current stable, security-maintained releases.
- Pin the runtime and package-manager expectations in the repository.
- Commit exactly one JavaScript workspace lockfile: `pnpm-lock.yaml` or
  `bun.lock`. Each Flutter application also commits its own `pubspec.lock`;
  these are separate ecosystem locks, not competing JavaScript lockfiles.
- Do not use nightly, edge, release-candidate, beta, or alpha dependencies in a
  production baseline without an ADR and an exit plan.
- Run dependency review, type checking, tests, and production build before every
  framework or major-library upgrade.
- Let Nuxt manage its supported Vue, Vite, Nitro, and Vue Router versions. Do not
  independently force incompatible versions.
- When Flutter is used, pin its SDK channel/version and compatible Dart range in
  `docs/flutter-standards.md` and CI.
- Treat Flutter code generators and their analyzer/build dependencies as one
  compatibility set. Resolve them together; never upgrade Freezed, Riverpod
  generation, JSON generation, Retrofit generation, GoRouter generation, or
  `build_runner` independently merely because a newer package exists.
- A Flutter application's Dart constraint must describe the minimum SDK that
  its direct dependencies actually support. Pin the exact Flutter patch in CI
  or the repository's approved SDK-version manager as well as declaring the
  compatible range in `pubspec.yaml`.

### 3.3 Nuxt web module policy

Modules are not a shopping list. Add a module only when the current product uses
the capability and the module is compatible with the selected Nuxt version.
The browser UI, theme, forms, and state modules below are not required for an
API-only service. That service keeps its applicable Nuxt/Nitro, validation,
TypeScript, lint, server composition, and testing toolchain.

| Module | Default | Use |
| --- | --- | --- |
| `shadcn-nuxt` | Required | shadcn-vue auto-import and component directory integration. |
| `@nuxtjs/color-mode` | Required | Persisted light, dark, and system theme selection. |
| `@nuxtjs/i18n` | Required | Routes, messages, locale switching, SEO, and formatting policy. |
| `@vueuse/nuxt` | Required | SSR-aware Vue composables and auto-import integration. |
| `@nuxt/icon` | Required | Consistent, locally bundled vector icon set. |
| `@nuxt/eslint` | Required | Nuxt-aware lint configuration. |
| `@pinia/nuxt` | Required for the interactive Nuxt profile | Own the application-shell blocking-activity controller. A content-only project with no client API or heavy foreground task may omit it only through an explicit profile decision. |
| `@nuxt/image` | Conditional | Required when the product renders managed or responsive images. |
| `@nuxt/a11y` | Development aid | Use only when its current maturity and Nuxt compatibility are acceptable. A pre-stable release requires an ADR, remains opt-in for development, and never replaces CI accessibility tests. |
| `@formkit/auto-animate` | Conditional | Simple list, reorder, expand, and removal transitions. |
| `@nuxtjs/device` | Conditional | Server-aware behavioral differences only, never responsive layout. |
| `nuxt-llms` | Conditional | Public documentation/content only; never expose private product data or routes. |

### 3.4 Tailwind integration policy

Tailwind v4 and shadcn-vue must use one verified integration path.

- The preferred current path is `tailwindcss` with `@tailwindcss/vite`, configured
  through `nuxt.config.ts`, because it is the current Tailwind v4 and
  shadcn-vue Nuxt path.
- `@nuxtjs/tailwindcss` remains an approved Nuxt ecosystem option only when its
  selected stable release explicitly supports the chosen Tailwind major and the
  production build is verified.
- Never install `@tailwindcss/vite` and `@nuxtjs/tailwindcss` as competing
  integrations.
- Keep the selected path documented in `docs/engineering-standards.md`.
- Keep the global CSS entry at `app/assets/css/main.css` or one equivalently
  documented path.

### 3.5 Nuxt package manager and production runtime

For Nuxt, pnpm and Bun are the approved development package managers. Choose one
per project. Flutter dependencies continue to use Dart Pub through the Flutter
toolchain.

- Set the `packageManager` field in `package.json`.
- Commit either `pnpm-lock.yaml` or `bun.lock`, never both.
- Use the same package manager locally, in CI, in containers, and in release
  scripts.
- Do not generate `package-lock.json` or `yarn.lock`.
- Use an active Node.js LTS release as the default production runtime.
- Bun may be the production runtime only after the full build, SSR, database,
  Redis, BullMQ, shutdown, and load-test suite passes on Bun.

| Task | pnpm project | Bun project |
| --- | --- | --- |
| Create | `pnpm create nuxt@latest <name>` | `bun create nuxt@latest <name>` |
| Install | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` |
| Add package | `pnpm add <package>` | `bun add <package>` |
| Add dev package | `pnpm add -D <package>` | `bun add -d <package>` |
| Run script | `pnpm <script>` | `bun run <script>` |
| Run package binary | `pnpm dlx <package>` | `bunx --bun <package>` |

Documentation should use `<pm> <script>` when the command is package-manager
neutral, then state the selected project package manager once.

### 3.6 Server dependency-injection baseline

Awilix is mandatory for owned `nuxt-api` server, worker, scheduler, and realtime
process roles. Even the first vertical slice creates the typed server
composition root; do not defer DI until the project is considered “large.” It
is a server-side composition tool, not a Vue client state mechanism and not a
replacement for Pinia, Vue props/events, composables, or Vue's narrow
component-tree `provide`/`inject`.

Awilix is preferred over InversifyJS for this baseline because:

- it supports constructor/factory injection without decorators, emitted
  metadata, or annotations in domain/application source
- its explicit child scopes fit HTTP requests, BullMQ jobs, scheduled
  occurrences, and individual WebSocket command executions
- strict mode detects important lifetime leaks and prevents scope-local
  singleton registration
- typed resolver/cradle inference supports one checked registration graph
- it matches a functional/modular TypeScript style without requiring every
  service to become a framework-decorated class

InversifyJS is not part of this baseline. Its class-metadata/decorator model,
runtime service identifiers, and binding ceremony do not match this
annotation-free Nuxt contract. A normal project ADR cannot silently replace
Awilix: changing DI requires an explicit owner decision that updates this
approved stack, supersedes the generated project decision/ADR, and proves
request/job scope, ESM/build, testing, and lifecycle behavior. Do not install
both.

Required Awilix contract:

- Create exactly one root container per process role. The Nuxt/Nitro server,
  worker, scheduler, and realtime gateway each own an explicit composition
  root; they do not import a process-global container from domain code.
- Create the container with `InjectionMode.PROXY` and `strict: true`. Use one
  typed `Cradle`/resolver map. Do not mix injection modes without an ADR.
- Register dependencies explicitly in reviewed module registration functions.
  Do not use filesystem glob auto-loading or filename conventions as hidden
  dependency graph behavior.
- Restrict Awilix imports, registration, `createScope()`, and
  `container.resolve()`/`cradle` access to `server/di/` and the thin process or
  transport composition boundaries. Domain entities, use cases, policies,
  repositories, and adapters receive normal typed constructor/factory
  parameters and never receive the container.
- Resolve only the route/processor/command entry handler at the composition
  boundary. A resolved service must not call back into the container. This
  prevents the service-locator anti-pattern and keeps unit tests container-free.
- Build one child execution scope for each HTTP request, BullMQ job attempt,
  scheduler occurrence, and accepted WebSocket command. A long-lived socket
  connection must not retain tenant/actor business services; reauthorize and
  create a fresh command scope for each durable command.
- Register verified request/job context only in its child scope: request/trace
  IDs, authenticated actor, immutable registered authorization scope, locale,
  abort/deadline, and job/connection identifiers as applicable. Never register
  actor, scope, transaction, or request state as a singleton.
- Dispose each execution scope in `finally`. Drain and dispose the root
  container during graceful process shutdown after stopping new work.
- Initialize async infrastructure explicitly during process startup, verify it,
  then register the ready resource or an explicit lifecycle-managed adapter.
  Constructors and resolution must not hide network I/O, migrations, or
  unbounded startup work.

Canonical execution and authenticated-actor context:

```ts
interface ExecutionContext {
  readonly requestId: string
  readonly traceId: string | null
  readonly startedAt: string
  readonly locale: string
  readonly source: Readonly<{
    type: 'web' | 'mobile' | 'api' | 'realtime'
    clientIp: string | null
    userAgent: string | null
  }>
}

interface AuthorizationScopeRef {
  readonly type: string
  readonly id: string
}

interface AuthenticatedActorContext {
  readonly actorId: string
  readonly actorType: string
  readonly displayNameSnapshot: string
  readonly authSessionId: string | null
  readonly roleAssignmentId: string | null
  readonly roleKeys: readonly string[]
  readonly permissionKeys: readonly string[]
  readonly authorizationVersion: string | number | null
  readonly impersonatorId: string | null
  readonly scope: Readonly<{
    mode: 'global' | 'scoped'
    primary: Readonly<AuthorizationScopeRef> | null
    hierarchy: readonly Readonly<AuthorizationScopeRef>[]
  }>
}
```

The generated project may add bounded fields required by its security model,
but it must preserve these meanings:

- For a human actor, `actorId` is the immutable internal user ID. Do not
  duplicate it under competing `userId`, `currentUserId`, or `createdByUserId`
  context names.
- `displayNameSnapshot` is a server-derived, bounded human-readable snapshot
  for activity/audit presentation. It is mutable identity metadata, not an
  authorization key, and it is not included in ordinary telemetry by default.
- `actorType`, scope-reference `type` values, `roleKeys`, and `permissionKeys`
  are stable registered keys. User-facing labels are localized separately.
  A role or permission snapshot may provide coarse authorization input but
  never replaces target, ownership, relationship, field, state, scope, or
  revocation checks.
- `roleAssignmentId` is the optional immutable assignment/membership/grant-set
  record that established the roles in the active scope. A generated project
  may give this field a domain-specific name in its project contract.
- `authSessionId` is an internal opaque session-record identifier when the
  authentication model has a session. It is never the cookie, bearer token,
  refresh token, or other credential. Logs use only the approved
  non-reversible session correlation.
- `scope.mode: global` uses `primary: null` and an empty hierarchy.
  `scope.mode: scoped` requires a registered primary scope reference.
  Its bounded, server-derived `hierarchy` is non-empty and ends with the same
  reference as `primary`; for example, organization → workspace. The generic
  guideline does not prescribe product scope names.
- Authentication/session middleware derives the actor and active scope from
  trusted server state. Request bodies, headers, route parameters, hosts, and
  realtime frames cannot supply trusted actor, role, permission, assignment,
  scope, or impersonator values.
- Freeze the context and its nested collections before registering them as
  child-scope values. Do not inject the mutable ORM user/membership entity,
  password/auth fields, tokens, full profile, or unrestricted claims.
- Every protected HTTP handler, durable authenticated realtime command, and
  other actor-initiated server entry point requires
  `AuthenticatedActorContext`; resolution or execution fails closed when it is
  absent. Public routes receive an explicit anonymous execution context rather
  than a fabricated user.
- The authorization policy and durable activity writer receive the actor
  context. Use cases receive it when actor/scope affects behavior. Repositories
  and queries still accept explicit scope/actor/transaction predicates; they
  must not resolve ambient context from Awilix.
- Create a child logger enriched from the safe allowlist:
  `request_id`, `trace_id`, `actor_id`, `actor_type`, registered role keys,
  registered `scope_type`/`scope_id` values, impersonation indicator, and
  privacy-approved client source. A generated project may add normalized
  product-specific scope fields. Do not automatically log display name,
  permissions, raw session ID, complete context, or a serialized user object.
- The activity writer copies `actorId`, `actorType`, bounded display-name and
  role snapshots, role-assignment/impersonator identifiers, scope, source, and
  correlation into the immutable activity contract. It never trusts action,
  target, result, or activity classification supplied by the client.
- A job/scheduler execution uses a separate job context. It may preserve the
  initiating actor ID/display/role snapshot for audit, but that snapshot is not
  a live login and cannot grant worker authority. Reload current durable state
  and re-check authorization or preconditions whenever execution still depends
  on current access.

#### Project-specific actor and scope materialization

The interfaces above are reusable governance vocabulary only. A generated
project must replace open-ended `string` scope/actor examples with its exact
approved product contract before architecture, security, permissions, API, or
database chapters can become `Approved`. Do not leave “scope”, “tenant”, “site”,
“workspace”, “account”, “membership”, or “role” undefined and expect developers
to infer their meanings.

The project book must contain an exact actor catalog:

| Actor type key | Product meaning | Immutable ID source | Display-name snapshot source | Authentication/session model | Role-assignment source | Global/scoped behavior | Impersonation/delegation | Disabled/revoked behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

It must also contain an exact authorization-scope catalog:

| Scope type key | Product term and meaning | Authoritative entity/ID source | Allowed parent and hierarchy position | How selected/resolved | Actor assignment/relationship | APIs/data constrained | Log fields | Activity fields | Revocation and tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Project materialization rules:

- A project with no scoped authorization explicitly selects `global` and
  documents why no per-customer, organization, workspace, account, site, or
  other isolation boundary exists. Do not create a fake tenant.
- A scoped project enumerates every allowed scope type and hierarchy path. The
  code contract uses a closed union of those registered keys, not arbitrary
  client-provided strings.
- Define the exact source for actor ID, display name, role assignment, roles,
  permissions, authorization version, impersonator, primary scope, and each
  hierarchy element. State when each value is loaded, refreshed, revoked, and
  snapshotted.
- Choose one canonical product term for each concept and define it in
  `glossary.md`. Map legacy/external synonyms explicitly; do not alternate
  casually among tenant, organization, customer, account, workspace, site, or
  another term.
- Publish the exact project `AuthenticatedActorContext` type and builder path
  in `engineering-standards.md` and `source-file-guide.md`. Reference the same
  field meanings from `system-architecture.md`, `api-contract.md`,
  `security-model.md`, `permissions-matrix.md`, `activity-log.md`,
  `database-schema.md`, `observability.md`, and `test-strategy.md`; do not
  redefine competing variants.
- Map every context field to its consumers: permission policy, scope-safe query,
  request logger, activity writer, queue/realtime handoff, and test fixture.
  Mark a consumer `N/A` with rationale rather than silently omitting it.
- Test every allowed hierarchy plus missing, unknown, malformed, wrong-parent,
  cross-scope, stale assignment, revoked actor, impersonation, and client-
  forgery cases.
- If evidence does not reveal the exact actor types, IDs, scope names,
  hierarchy, assignment model, or resolution source, treat the relevant
  chapters as blocked under Section 4.18 and ask the product owner. Never
  invent a generic-looking scope model merely to finish the book.

Lifetime policy:

| Lifetime | Allowed examples | Rules |
| --- | --- | --- |
| Singleton | validated immutable configuration, logger root/factory, PostgreSQL pool, role-specific Redis/BullMQ clients, schema/result/activity registries | root registration only; cannot capture scoped/transient state |
| Scoped | execution context, authorized actor/scope context, request logger, repositories/use cases that intentionally bind to that context | one execution scope; no reuse across request/job/command |
| Transient | stateless short-lived command/query handler or mapper where a cached scoped instance adds no value | must not be captured by a longer-lived dependency under strict mode |
| Value | immutable configuration or already-created lifecycle resource; verified execution-context values in a child scope | never use `asValue` to smuggle mutable global tenant/request state |

Transactions remain explicit use-case boundaries. Do not hide an automatically
opened database transaction in a request scope, and do not assume one HTTP
request equals one transaction. Queue retry, WebSocket reconnect, or scope
disposal does not commit/rollback business state by itself.

Testing and verification:

- build a fresh root container for each integration-test process/fixture
- unit-test use cases and policies by passing typed fakes directly, without
  Awilix
- override registrations only in a test-owned container before creating the
  execution scope; never mutate a shared production container
- add graph smoke tests that resolve every registered entry handler for each
  process role and fail on missing, circular, or lifetime-invalid dependencies
- verify parallel requests/tenants/jobs cannot observe one another's scoped
  context and that every scope/resource is disposed on success, handled result,
  exception, abort, timeout, and shutdown
- keep DI resolution outside hot loops; measure startup/resolution overhead
  only if profiling shows it is material

At scaffold and each major upgrade, apply the dependency-admission gate below
to Awilix and record its exact locked version, Node/Nitro/ESM compatibility,
license, security path, maintenance evidence, graph tests, and removal trigger.

### 3.7 Realtime library baseline and dependency acceptance gate

When realtime is active, use:

- `ws` on the separately deployed Node.js realtime gateway
- the browser's native `WebSocket`, normally wrapped by VueUse
  `useWebSocket`, for Nuxt/Vue
- Dart's `web_socket` package for Flutter

Governance baseline reviewed 2026-07-30:

- `ws` was active, unarchived, MIT-licensed, security-documented, recently
  released, broadly adopted, and documented as passing the Autobahn conformance
  suite.
- `web_socket` was a stable package published by `dart.dev`, supported Android,
  iOS, Linux, macOS, web, and Windows, and provided conformance-tested
  implementations behind one API.
- Browser-native `WebSocket` avoids an unnecessary client protocol dependency;
  VueUse adds Vue lifecycle/reconnect ergonomics without replacing the wire
  protocol.

Do not install `ws` in browser code. Do not introduce Socket.IO as the generic
protocol: it creates a different wire protocol and matching-client dependency.
Do not use `web_socket_channel` by default; it is an approved alternative only
when the Flutter implementation specifically needs its `StreamChannel`
abstraction. A high-performance native-addon server such as `uWebSockets.js`
requires an ADR, representative load evidence, supported build/runtime proof,
and an operational exit plan. `crossws` is an optional portability adapter, not
a performance upgrade on Node where it uses `ws`.

Package popularity alone is not an approval. At project creation, realtime
activation, and every major upgrade, record a dated dependency review in
`docs/engineering-standards.md` and `docs/realtime-protocol.md` with:

| Check | Required evidence |
| --- | --- |
| Ownership and source | Official registry/repository links, publisher or maintainer, license, and security-reporting path. |
| Maintenance | Not deprecated or archived; current stable release; recent compatible maintenance; unresolved critical advisories reviewed. |
| Adoption | Registry downloads, dependents, repository adoption, or framework/ecosystem use sufficient for operational confidence. Treat these as signals, not quality guarantees. |
| Compatibility | Selected Node, browser, Flutter/Dart, platform, proxy/load-balancer, and package-manager versions. |
| Protocol quality | Standards compatibility, conformance tests where available, heartbeat/close behavior, message limits, and failure semantics. |
| Operational fit | Memory/CPU under representative connections and messages, graceful drain, backpressure, observability, and dependency footprint. |
| Reproducibility | Exact direct constraint, committed lockfile, production build, integration tests, vulnerability scan, and review date/owner. |

Do not freeze download counts or star counts in this reusable guideline. If the
active default no longer passes this gate, select a maintained replacement
through an ADR while preserving the documented WebSocket protocol and client
contract. Disable WebSocket compression by default; enable it only when
representative load tests prove acceptable CPU, latency, and memory behavior.

### 3.8 Dependency admission, stack integrity, and removal

The approved profiles are cohesive stacks, not suggestions that generators may
blend with unrelated frameworks. A new project starts with only the required
dependencies for its active profile. Add a conditional dependency only when an
approved requirement activates its capability.

For the Nuxt web profile:

- Nuxt/Vue is the only application and server framework baseline. Do not
  scaffold a second application or frontend framework inside the generated
  project.
- shadcn-vue is the only application component system. Do not add a second
  component library, another Tailwind component kit, or a page-local mixture of
  visual systems.
- Tailwind remains the layout-only application utility boundary from Section
  8.4; another CSS framework or utility system is not a permitted shortcut.
- Zod remains the only server request-schema validation library. Pinia remains
  the only approved shared Vue state library. Beyond the explicitly approved
  Nuxt `$fetch`/Axios boundary and motion decision ladder, do not install
  overlapping validation, state, date, HTTP, animation, or utility packages
  without a named unmet requirement and ADR.
- A deprecated package is never part of a new-project baseline. If a product
  needs an unlisted capability, evaluate currently maintained options through
  this section's gate instead of silently adding or substituting a package.

An existing external legacy system may remain an integration dependency when
the product requires it. It is documented as an external boundary; it does not
change the generated Nuxt application stack.
The Flutter native profile can ship independently or as a companion. It does
not change the component system of an active Nuxt web profile.

`docs/engineering-standards.md` must maintain an approved-dependency registry:

| Package/module | Ecosystem | Concern and requirement ID | Required/conditional | Declaration kind | Runtime/build/dev | Owner | Exact constraint/resolved version | License/source/security path | Maintenance/deprecation evidence | Compatibility and size impact | Verification | Removal trigger/replacement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Dependency rules:

- Every direct dependency must have one concrete consumer and one registry row.
  “Useful later,” scaffold default, popularity, or AI recommendation is not a
  requirement. SDK and important endorsed-transitive packages may have rows
  when the project needs to document why they are not declared directly.
- Prefer framework/SDK capabilities already in the stack. Do not add a package
  that duplicates an approved dependency unless measured requirements prove
  the existing boundary insufficient.
- Use current stable releases that resolve as a tested compatibility set. A
  prerelease requires the time-bounded ADR and exit plan from Section 3.2.
- A deprecated, archived, abandoned, unlicensed, source-unavailable, or
  unpatched critically vulnerable dependency blocks new use. Existing use
  requires a migration decision, owner, compensating controls, expiry date, and
  removal evidence; an ADR cannot make an indefinite exception acceptable.
- Do not declare an endorsed Flutter platform implementation directly unless
  application source imports its platform-specific API.
- Production code must not import a development-only package. Browser/native
  bundles must not include server-only dependencies, credentials, or tooling.
- Remove a dependency only after source, configuration, generated code,
  platform setup, tests, build artifacts, and lockfiles prove that it is unused.
  Apply the preservation protocol to an existing project; never delete it only
  because a replacement is fashionable.
- Review the registry at project creation, before every direct or major
  transitive upgrade, and before release. Scan the complete lockfile on every
  release even though transitive packages do not each need a manually authored
  row.

The project must expose `deps:check` and `standards:check` from Section 13.7.
They make this contract executable rather than relying on review memory.
