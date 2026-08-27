
## 5. Project discovery and delivery workflow

### 5.1 Phase 0: product truth

Before UI or schema design, define:

- target audience and the context in which they use the product
- actor and role types
- tenant, workspace, organization, and ownership boundaries
- top workflows and their start, intermediate, terminal, and failure states
- business invariants and irreversible actions
- source-of-truth and immutable records
- locale, timezone, currency, unit, and retention rules
- measurable first-version outcomes
- explicit exclusions

### 5.2 Phase 1: information architecture

- Create the `docs/mock-ui/README.md` screen registry with stable screen IDs,
  routes/deep links, actors/scopes, templates, required states, contract files,
  and workflow links.
- Group navigation around user mental models, not technical modules.
- Map every high-frequency task to the fewest clear steps.
- Define master layout families before designing individual screens.
- Define list, detail, create/edit, settings, report, workboard, and state-screen
  templates before page-by-page customization.

### 5.3 Phase 2: content and wireframes

- Use real or domain-realistic content.
- Write mobile wireframes first.
- Create one canonical Section 8.9 file for each important screen instead of
  accumulating unrelated screens in a role document.
- Define every important interaction target and destination.
- Complete content/control, data-dependency, state, and responsive matrices;
  complete table/list and form matrices when applicable.
- Define loading, empty, error, success, conflict, permission, expired, and
  destructive-confirmation variants where relevant.
- Review the user task and reading order before selecting visual decoration.

### 5.4 Phase 3: design system

- Name the product subject, audience, and each surface's single job.
- Generate and review a product-specific design direction; do not accept a
  generic SaaS or AI visual default.
- Persist the approved master design system.
- Define green primary tokens and both light and dark mappings.
- Map shadcn-vue components to product patterns.
- Approve the master layouts, page templates, and one representative vertical
  slice before designing many screens.

### 5.5 Phase 4: architecture and contracts

- Finalize API, validation, permissions, schema, cache, queue, logging, and
  deployment contracts.
- Decide what remains request-driven and what truly needs background processing
  or realtime behavior.
- Define the command surface and release gate.
- Review migrations and recovery paths before real data exists.

### 5.6 Phase 5: vertical slices

Build in slices that include:

1. routed UI
2. server endpoint or server action
3. validation and authorization
4. durable persistence
5. cache/queue side effects when required
6. logs and audit records
7. unit, integration, and end-to-end tests
8. phone, tablet, desktop, light, and dark evidence
9. updated canonical docs and traceability

## 6. Reference architecture

### 6.1 Nuxt 4 directory baseline

Use framework conventions before inventing folders:

```text
.
├── app/
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── ui/                 # shadcn-vue source managed through its CLI
│   │   ├── common/
│   │   │   ├── shell/          # AppMasterLayout/AppTopBar/AppSidebar/AppLoadingOverlay
│   │   │   ├── feedback/       # AppMutationConfirmDialog and shared feedback
│   │   │   └── page-templates/ # approved cross-feature page families
│   │   └── features/           # feature-owned UI
│   ├── composables/
│   │   └── useBlockingActivity.ts
│   ├── layouts/                # thin slot adapters to shared master layouts
│   ├── middleware/
│   ├── pages/
│   ├── plugins/
│   │   └── api.client.ts       # central client request/loading integration
│   ├── stores/
│   │   └── app-loading.ts      # required, non-persisted Pinia operation registry
│   ├── utils/
│   ├── app.config.ts
│   ├── app.vue
│   └── error.vue
├── server/
│   ├── api/
│   ├── middleware/
│   ├── di/
│   │   ├── container.ts        # strict root-container factory
│   │   ├── cradle.ts           # typed resolver/cradle contract
│   │   ├── context.ts          # immutable execution/actor/job context types and builders
│   │   ├── scope.ts            # execution-scope creation/disposal
│   │   └── registrations/      # explicit process/module registrations
│   ├── domain/
│   ├── services/
│   ├── repositories/
│   ├── db/
│   │   ├── client.ts
│   │   └── schema/
│   ├── queues/
│   │   ├── config.ts
│   │   ├── names.ts
│   │   ├── identity.ts
│   │   ├── envelope.ts
│   │   ├── payloads.ts
│   │   ├── registry.ts
│   │   └── producers/
│   ├── validation/             # Zod request schemas and envelope mapping
│   └── utils/
├── realtime/                   # only when the realtime protocol is active
│   ├── index.ts                # dedicated gateway process entry
│   ├── gateway/
│   ├── protocol/               # frame schemas, registry, close codes
│   ├── subscriptions/
│   ├── fanout/
│   └── utils/
├── workers/
│   ├── index.ts
│   ├── processors/
│   ├── schedulers/
│   └── utils/
├── shared/
│   ├── constants/
│   ├── schemas/
│   └── types/
├── drizzle/                    # reviewed generated SQL migrations
├── docs/
│   └── mock-ui/
│       ├── README.md
│       ├── shared-patterns.md
│       ├── screens/
│       └── flows/
├── design-system/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── component/
│   └── e2e/
├── docker/
│   ├── entrypoints/
│   └── healthchecks/
├── .dockerignore
├── .env.example
├── compose.yaml
├── Dockerfile
├── Makefile
├── drizzle.config.ts
├── nuxt.config.ts
└── package.json
```

Keep `server/`, `shared/`, `workers/`, `public/`, `nuxt.config.ts`, and
`drizzle.config.ts` at the repository root. Keep browser application code under
`app/`. Keep `compose.yaml`, `Dockerfile`, `.dockerignore`, `.env.example`, and
`Makefile` at the runnable project root. In a declared monorepo, place them at
the workspace root or Nuxt application root consistently and document the one
command entry point. Add `realtime/` only when `docs/realtime-protocol.md` is
active.

### 6.2 Dependency direction

```text
page/layout
  -> feature component
    -> composable or Pinia store
      -> tracked Nuxt useFetch/$fetch or approved Axios client
        -> server route
          -> service/use case
            -> repository
              -> Drizzle/PostgreSQL

process composition root
  -> strict Awilix root container
    -> HTTP/job/schedule/WebSocket-command execution scope
      -> route/processor/command entry handler
        -> service/use case

service/use case
  -> cache adapter
  -> queue producer

BullMQ worker
  -> service/use case
    -> repository

realtime gateway
  -> authenticated transport/subscription boundary
  -> service/use case
    -> repository

transactional outbox dispatcher
  -> dedicated realtime Redis Pub/Sub
    -> realtime gateways
      -> subscribed clients
```

Rules:

- Pages and layouts are composition surfaces, not business-logic containers.
- Components do not access PostgreSQL, Redis, secrets, or BullMQ.
- Awilix is server-only. `server/di/` and thin process/transport composition
  roots own registration, scope creation/disposal, and entry-handler
  resolution. Application/domain source receives ordinary typed dependencies
  and never resolves from or receives the container.
- Server routes parse input, establish request context, authorize, call a use
  case, and map the result to the API contract.
- Services own workflow and transaction orchestration.
- Repositories own durable data access.
- Queue processors call use cases; they do not duplicate domain behavior.
- Realtime durable commands call the same authorized use cases as HTTP.
  Gateways own transport, connection, subscription, and delivery concerns, not
  domain logic.
- Durable event publication starts from a committed PostgreSQL outbox record.
  Redis realtime fanout is ephemeral delivery, never the source of truth.
- `server/queues/config.ts` is the only constructor for BullMQ connections,
  prefixes, and registered queue names. `identity.ts` owns custom job,
  deduplication, durable-idempotency, and scheduler ID builders; `envelope.ts`
  owns the versioned Zod job envelope.
- `server/validation/` owns server-only Zod request schemas, issue mapping, and
  validation-result helpers.
- `shared/` contains serializable types, schemas, constants, and pure utilities
  safe for both server and client. It contains no server secrets or DB clients.
- Cross-boundary calls use explicit typed contracts.
- Enforce the dependency direction with ESLint import restrictions, documented
  path aliases, and `standards:check`. A TypeScript path alias improves naming;
  it must not create a back door around the layer boundary.
- Client code must not import from `server/`, Drizzle, BullMQ, Redis, Node-only
  modules, or private runtime configuration. Server/domain code must not import
  pages, browser-only components, Pinia UI stores, or Flutter source.
- Circular dependencies across features or layers are prohibited. A detected
  cycle is resolved by moving the shared contract to its real owner, not by
  disabling the check.

### 6.3 Feature component map

Before implementing a non-trivial feature, write a small component map:

| Component/composable | Single responsibility | Inputs | Outputs | State owner |
| --- | --- | --- | --- | --- |

The map must identify at least:

- the route/page composition root
- the feature orchestration container or composable
- focused presentational sections
- repeated row/item/card components
- form/schema ownership
- server-data owner, shared client-state owner when any, and mutation boundary
- loading, confirmation, permission, conflict, and feedback owners

A route page is normally a thin composition surface. It selects the layout and
template, resolves route/data dependencies, composes feature components, and
connects navigation. It must not also become the reusable form, table, dialog,
authorization policy, API client, and business workflow.

Split a component when it:

- owns orchestration and several substantial visual sections
- contains three or more independent UI sections
- repeats a row, item, card, or form pattern
- mixes data fetching, workflow logic, and complex presentation

CRUD features normally have a route composition page, feature container, form
or filters, list/table or item components, and action/status components.
Do not split by arbitrary line count or create wrapper components with no
semantic responsibility. Split at ownership, reuse, state, testing, or
interaction boundaries and keep props/events/contracts typed.

### 6.4 Code documentation and comment policy

Prefer clear names, explicit types, small functions, and visible contracts.
Comments explain information the code cannot express reliably; they do not
narrate syntax.

Comments are required when they preserve:

- the reason for a surprising implementation or rejected simpler alternative
- a business invariant, permission/tenant boundary, or privacy constraint
- transaction, locking, ordering, retry, idempotency, cache-invalidation, or
  concurrency behavior
- SSR/hydration, browser-only, native-platform, timezone, unit, precision, or
  lifecycle assumptions
- a non-obvious Zod refinement, SQL constraint, migration/backfill safety
  condition, queue identity rule, or external-provider limitation
- a temporary compatibility workaround with an issue/ADR, owner, removal
  condition, and review date
- public or cross-boundary API semantics that types alone do not make clear

Comment rules:

- Explain **why**, the invariant, and the consequence of changing the code.
  Do not restate **what** the next line visibly does.
- Place the comment beside the smallest boundary it governs. Keep canonical
  product rules in the project book and link a stable requirement/ADR when
  useful instead of copying paragraphs into source.
- Use TSDoc/Dart documentation comments for exported APIs only when callers need
  semantic, lifecycle, error, side-effect, or security information beyond the
  signature.
- Add short comments to Dockerfile stages and unusual build/security choices.
  Every public Make target carries a `##` help description rendered by
  `make help`.
- Update or remove a comment in the same change that invalidates it.
- Do not keep commented-out code. Source control owns history.
- A `TODO`/`FIXME` must name an issue or stable requirement, owner, and removal
  condition; do not use it as an unowned backlog.
- Never put credentials, personal data, production values, or sensitive
  incident details in comments or examples.
- Tests must prove the behavior; comments never replace an assertion.

AI-generated code follows the same policy. AI should add comments generously at
non-obvious boundaries and high-risk invariants, but must not produce line-by-
line narration, decorative section banners, stale tutorials, or comments that
claim behavior the implementation and tests do not prove.

### 6.5 Web and native-client topology

When Flutter is in scope, keep it in a separate repository or an explicit
workspace such as `apps/mobile/`. If a monorepo is chosen, place the Nuxt
application in `apps/web/` and document the changed root paths.

- Share API schemas, product vocabulary, permissions, identifiers, and event
  contracts through generated or language-neutral contracts.
- Do not share framework-specific source code across Nuxt and Flutter.
- Nuxt server APIs remain authoritative for validation, authorization, business
  state, and persistence.
- Each platform owns its UI components, navigation, local state, theme, and
  accessibility implementation.
- Keep web and mobile build, test, signing, environment, and release pipelines
  independently runnable.

### 6.6 Cross-platform blocking-activity contract

Nuxt and Flutter must expose the same user-facing contract for foreground API
requests and other heavy foreground work:

- The application master layout/page owns one viewport-wide blocking overlay.
- Every participating operation acquires one loading lease before work starts
  and releases that exact lease after every terminal path: success, handled
  non-zero business result, unexpected error, cancellation, or timeout.
- `loadingCount` is the number of active leases. The overlay is visible while
  `loadingCount > 0`; it must not disappear merely because one of several
  concurrent or chained operations finishes.
- A release starts a centrally configured 500 ms minimum-exit hold. The overlay
  disappears only after the last active or release-pending lease completes that
  hold. Do not copy page-level `setTimeout` or `Future.delayed` calls.
- Expose `runBlocking(operationName, work)` as the normal `try/finally` helper.
  Raw acquire/release actions are infrastructure APIs for request adapters and
  exceptional integrations, not a page-coding pattern.
- Use an opaque lease token or idempotent release handle rather than trusting
  unrelated integer increment/decrement calls. A duplicate or unknown release
  is a no-op with a development warning; the count can never become negative.
- Retries and token refresh must have one documented owner. Prefer one outer
  user-operation lease across all internal attempts; never count both a public
  wrapper and its interceptor for the same request.
- Default user-initiated client API requests participate. `noLoading: true` is
  an explicit escape hatch only for approved background refresh, prefetch,
  telemetry, heartbeat, or realtime recovery. It must not hide work that blocks
  the user's requested outcome.
- `silent` feedback and `noLoading` are independent policies: suppressing a
  toast must not silently suppress the blocking indicator.
- Heavy parsing, export, import preparation, cryptography, or device work that
  prevents safe interaction uses the same `runBlocking` helper even when it
  makes no API call.
- A known measurable task uses the platform's determinate progress component;
  the global spinner is for indeterminate work.
- The overlay prevents pointer/touch interaction and duplicate actions, but
  timeout, cancellation, and a stuck-operation watchdog must prevent an
  indefinite trap. A long-lived lease emits redacted `WARN` telemetry with the
  safe operation name, duration, route/screen, and correlation context, never
  secrets or full parameters.
- The activity registry is presentation state. It is not persisted, hydrated
  from storage, shared across SSR requests, or treated as remote-data state.
  Initial client/native state is always zero.

The overlay does not replace content-state modeling. A page still renders its
appropriate initial, refreshing, data, empty, handled failure, unexpected
failure, stale, and offline states. Use a local `Skeleton`, inline progress, or
refresh status when content can remain safely usable; use the global overlay
when interaction must be blocked.

The generated `docs/ui-system.md`, `docs/engineering-standards.md`,
`docs/source-file-guide.md`, `docs/test-strategy.md`, and, when active,
`docs/flutter-standards.md` must name the controller, overlay owner, adapters,
escape-hatch policy, accessibility behavior, timeout/watchdog policy, and
required concurrency tests.

### 6.7 Cross-platform mutation-confirmation contract

Every user-initiated durable create, update, or delete command must open a
confirmation dialog immediately before execution on Nuxt and Flutter. This
includes single and bulk actions, create/save, edit/update, status transition,
archive, soft delete, permanent delete, restore, and other commands that persist
a changed business state. The rule follows command semantics, not merely HTTP
verbs: a read-only search sent with `POST` is not a create, while a state change
sent through a nonstandard verb is still a mutation.

The mandatory sequence is:

1. collect input and run client validation
2. if valid, open the confirmation dialog with the exact proposed action and
   target/scope
3. on cancel or dismissal, perform no API call or durable side effect, preserve
   safe attempted values, and return focus to the invoking control
4. on explicit confirmation, close/settle the dialog, acquire one Section 6.6
   blocking-activity lease, and execute the mutation exactly once
5. map the response envelope, show the documented success/handled-failure
   feedback, refresh authoritative data, and release loading on every terminal
   path

Confirmation-dialog content must:

- use a specific localized title such as “Create menu item?”, “Save changes to
  Green Curry?”, or “Delete Green Curry?” rather than “Are you sure?”
- name the entity/action and current tenant/scope when ambiguity could affect
  the wrong record
- state the material result, irreversible effect, downstream consequence, or
  recovery/undo behavior without exposing secrets or unnecessary personal data
- show the selected count and exact selection scope for bulk actions, including
  whether “all matching results” extends beyond the current page
- provide a clear `Cancel` action and an explicit verb action such as `Create`,
  `Save changes`, `Archive`, `Restore`, or `Delete`; do not use ambiguous
  `Yes`, `OK`, or `Continue`
- use destructive semantic emphasis only for destructive actions; create and
  ordinary update confirmations use the normal primary action
- require typed re-entry or a second factor only for a separately documented
  very-high-risk action, not for routine confirmation

The dialog is required even when the operation is reversible or an undo action
is offered. Undo and post-success feedback are supplemental; they do not replace
pre-mutation confirmation. Optimistic UI must not persist or display the
mutation as committed before confirmation. Autosave is a durable update and
therefore cannot bypass this rule; do not enable autosave under this baseline
unless an approved project-specific deviation replaces this confirmation
contract and documents its safety model.

Server-side validation, authorization, tenant enforcement, concurrency checks,
idempotency, and activity logging still occur normally. Never trust a
client-supplied `confirmed` flag as authorization or proof of user intent.
Cancelled dialogs do not emit mutation activity records. Background jobs,
schedulers, integrations, migrations, and server-internal writes cannot display
a client dialog and instead follow their approved command, authorization,
idempotency, and audit contracts.

The generated `docs/product-spec.md`, `docs/ui-system.md`,
`docs/engineering-standards.md`, `docs/mock-ui/` screen/flow contracts,
`docs/test-strategy.md`, and, when active, `docs/flutter-standards.md` must make
the confirmation step, exact copy, target/scope, success/failure path, and test
IDs visible for every user-initiated mutation.
