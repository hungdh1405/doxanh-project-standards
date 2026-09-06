
## 17. AI agent operating rules

AI working under this standard must:

- read the repository's applicable root and nested `AGENTS.md` files before
  task work; treat them as concise bootstrap instructions and follow their
  canonical links rather than expecting them to repeat the full standard
- follow the project-book generation contract in Section 4.17 for documentation
  work
- run `rules:plan` with explicit anticipated project-relative paths before
  implementation or review, use its stable rule IDs to form the acceptance
  plan, then run it again against the actual worktree after the final edit;
  stop when an applicable material rule has no implementation or evidence path
- apply `VERIFY-SCOPE-001` before starting test commands: record the change
  classification, affected boundaries and risks, selected and excluded suites
  with reasons, and the objective full-regression decision
- start with focused evidence that crosses every changed boundary and expand
  only when dependency analysis or evidence demonstrates wider impact; run full
  regression only for a Section 13.7.2 trigger
- for release or production work, run `release:plan` against the exact
  accepted/deployed base and candidate, name the target environment, retain the
  universal release baseline, and add only the union of affected slices;
  a release status alone is not a full-regression trigger and does not select
  unrelated suites
- treat a safe full-rule fallback caused by unknown or uncovered paths as an
  unresolved mapping state; inspect and correct the mapping or obtain an
  explicit full-regression decision before executing its broad command set
- follow the clarification protocol in Section 4.18, ask when a material
  requirement is missing or ambiguous, and never invent an answer merely to
  complete every chapter
- enforce the Section 1.1 genericity boundary: translate reference-project
  findings into capability/risk rules here and keep exact brands, roles, routes,
  prices, providers, locales, countries, and state names in the generated
  project's canonical chapters
- read the complete applicable chapter family and build a preservation map
  before restructuring existing documentation
- read the actual product docs, route, schema, component, and current runtime
  configuration before changing behavior
- use current official documentation for unstable framework/module facts
- apply the dated dependency acceptance gate before selecting or upgrading a
  realtime server/client library; record evidence instead of relying on this
  guideline's historical popularity
- use the installed Vue, Vue Router, shadcn-vue, Pinia, UI/UX, frontend-design,
  Vite, Vitest, and GSAP skills when they apply
- use the installed Flutter architecture, adaptive-layout, localization, Dart
  testing, and stable-language-pattern skills when the native profile applies
- treat skills as reviewed implementation guidance, not higher authority. A
  skill for a conflicting component or state system, deprecated framework
  behavior, prerelease toolchain, manual serializer, or unrelated capability
  must not override Sections 1, 3, 7, 8, or 9
- identify the target platform profile before generating code and keep its
  libraries inside that boundary
- when server DI is active, generate the strict typed Awilix root/container
  factory, explicit registrations, and execution-scope wrapper before routes,
  jobs, schedulers, or WebSocket commands resolve application handlers
- before generating protected handlers, materialize the generic actor/scope
  vocabulary into the project's exact actor catalog, authorization-scope
  catalog, closed TypeScript unions/hierarchy, authoritative resolution
  sources, context builder, consumer mapping, revocation behavior, and tests;
  ask under Section 4.18 when any material part is unknown
- state the chosen JavaScript package manager and never create a competing
  JavaScript lockfile; preserve each Flutter application's `pubspec.lock`
- apply the Section 3.8 admission gate before adding, upgrading, replacing, or
  removing a dependency; update the registry and run `deps:check` plus
  `standards:check`
- inspect shadcn-vue project context and component docs before using or updating a
  component
- preserve default shadcn-vue styling and use Tailwind only for application
  layout
- generate slot-based Nuxt master-layout components, one layout-owned loading
  overlay, and the Pinia lease controller before feature pages begin calling
  APIs
- generate the equivalent Flutter master-page/layout, Riverpod lease
  controller, root overlay, and Dio integration when the native profile applies
- generate the shared Section 6.7 confirmation component/helper and require it
  in every user-initiated create/update/delete flow on each active client
- generate the shared Section 8.11.2 web action-footer composition before
  feature forms and overlays, keep body copy above its action-only region, and
  enforce one safe-to-commit source/DOM/tab/visual order at every breakpoint
- generate the shared Section 8.11.3 actionable-feedback composition before
  rendering action-bearing notifications, alert cards, banners, inbox items, or
  pop-ups; keep icon/content readable above a separate responsive action-only
  region and test the longest supported localized content
- apply every applicable stable `UI-*` rule selected by the executable rule
  plan; none of the UI/UX contracts may be treated as optional review advice
- apply `UI-DENSITY-001` to every component and action: keep visual density
  compact, desktop actions natural width, and phone hit areas touch-safe
- apply `UI-COPY-001` to the complete rendered localized inventory; never put
  implementation details, policy narration, internal identifiers, framework or
  library language, developer instructions, or requirements prose in product UI
- apply `UI-CONTROL-001` before choosing a form control: inspect the actual
  option cardinality, loading source, and lookup behavior; document and verify
  the resulting `Select` or searchable default shadcn-vue `Combobox` contract
- apply `TIME-PRESENTATION-001` whenever temporal data is rendered, edited,
  transported, exported, printed, or reviewed; identify the authoritative
  scope/system context and run the executable raw-presentation gate
- create a component map before non-trivial Vue feature work
- create/update the screen registry before generating UI; use one canonical
  screen contract per important screen and complete every applicable
  content/data/state/responsive/table/form matrix before implementation
- materialize the audience/surface map, canonical entity-detail action owner,
  long-collection discovery model, and every visible control's handler/
  destination before rendering the screen
- when multiple/shareable entries exist, generate and verify the Section 7.8.2
  registry and keep locators separate from credentials/proofs
- use real content and remove dummy/explanation-heavy UI
- implement and verify the smallest complete vertical slice
- run `verify:changed` after the final maintained-file change, run
  `verification:check` before claiming completion, and report every pending
  manual/not-tested boundary; use the candidate's risk-scoped `release:plan`,
  `verify:automated`, applicable manual evidence, and aggregate `verify` before
  claiming release-ready
- when verified content is committed unchanged, preserve and promote its
  content-bound evidence instead of rerunning it; execute only missing
  revision-, image-, deployment-, target-readiness-, and focused live gates
- Local-only evidence cannot satisfy a production claim: never use a local
  Docker, test, screenshot, or lower-environment result as a substitute for
  deployed-version confirmation and affected live workflow proof
- test server enforcement, not only UI hiding
- generate Playwright API, end-user workflow, and accessibility projects;
  preserve the distinction between fixture/API setup and browser-driven action,
  and verify durable/downstream outcomes for critical workflows
- after every user-visible implementation or fix, run the affected workflow in
  the live Docker application as the real actor through the rendered UI; a
  unit, component, direct-API, mocked-route, or screenshot-only pass never
  replaces this focused end-user regression, and any failure must be resolved
  before moving to the next feature
- leave runnable commands, current evidence, and honest validation boundaries
- maintain chapter metadata, stable IDs, traceability, navigation, and local
  link integrity
- keep manifest-derived regions deterministic and run all documentation checks
  before claiming the book is coherent
- update affected canonical development chapters and traceability after a
  substantial work slice
- register every required durable activity with its `module_key`, `tag_type`,
  Zod-validated `data_json` contract, atomic-write rule, access policy, and test
  before implementing the emitting action
- before implementing a concurrently mutable aggregate, define and test its
  authoritative revision, atomic scope/state/revision predicate, handled stale
  result, winning-only durable effects, and explicit client refresh/reapply
  flow; do not call sequential requests concurrency proof
- generate `docs/database-schema.md` from approved product/module/permission
  truth using the complete DATA/QRY/TX/MIG, tenant, lifecycle, role, and evidence
  contracts; ask blocking data questions and run `docs:data:check` before
  calling the chapter reviewable
- generate and keep the Docker/Compose/Make/local-development contract together;
  verify `make help`, clean-clone setup, and destructive boundaries
- when realtime is active, generate both event and protocol chapters, keep the
  gateway separately scalable, and prove web/Flutter reconnect/refetch plus
  cross-replica delivery
- comment non-obvious business, security, tenancy, concurrency, SSR, migration,
  queue, and infrastructure intent according to Section 6.4
- never claim `done`, `production-ready`, or `fully verified` when critical work
  is visual-only or untested
- never treat `check:fast`, a smoke suite, an earlier revision's report, or a
  hand-checked box as proof that `verify:changed` or `verify` passed

AI must not:

- treat the existence of prose in a large guideline, conversation history, or
  an earlier task plan as proof that the rule was selected and applied to the
  current task
- let a planned-path preflight replace the final actual-worktree rule plan, or
  let either plan replace the required verification commands and live evidence
- run unrelated browser, API, database, actor, capability, or production suites
  for a reusable-standard, skill, or documentation-only change with no runtime
  contract impact
- treat “continue,” “test carefully,” habit, elapsed time, or subjective
  confidence as authorization for full regression
- treat “commit,” “push,” “deploy,” “release,” or a protected branch name as a
  full-regression trigger without an objective Section 13.7.2 reason
- satisfy a production or release claim with local-only evidence, evidence for
  another target environment, or a deployed revision/image that differs from
  the candidate
- mechanically execute the safe full-rule fallback before resolving its
  unmatched paths and recording an objective decision
- remove substantial existing requirements without a preservation action and
  reason
- copy a reference project's actors, routes, hostnames, prices, country/provider
  decisions, state labels, or visual composition into this generic standard or
  a different generated project without explicit product approval
- rely on conversation memory, a skill, or repeated guideline prose as the
  completion mechanism when an executable gate can enforce the rule
- rewrite current runtime truth as target architecture before implementation
  changes
- add a fallback, module, state store, cache, queue, or abstraction without a
  concrete need
- generate a second application/component framework, competing component CSS,
  a deprecated package, or a page-local mixture of visual systems inside the
  Nuxt profile
- add an unregistered/deprecated dependency, a duplicate package for an
  already-owned concern, a second JavaScript lockfile, or a direct Flutter
  platform implementation that application source does not use
- invent component colors or custom shadcn-vue styles
- use Tailwind as a second visual component system
- use a native/custom select or an unfilterable `Select` for a choice governed
  by the searchable `Combobox` branch of `UI-CONTROL-001`
- render an instant/date/time field directly, format business time from the
  browser or component locally, or fall back to a raw API/database/wire value
  when the shared presentation formatter fails
- use device detection to replace responsive CSS
- hand-build a product sidebar, scroll container, or pagination control when
  the corresponding default shadcn-vue component exists
- allow authenticated route data to grow the browser document instead of using
  the bounded layout-owned main `ScrollArea`, or introduce ambiguous nested
  primary vertical scrollers
- use a single boolean, page-owned raw increment/decrement pairs, global
  clear/reset, or persisted/SSR-shared state for concurrent blocking activity
- construct an untracked API client in a page/widget, count both wrapper and
  interceptor, omit terminal cleanup, or use `noLoading` merely to hide
  user-blocking work
- execute a user-initiated create/update/delete before explicit confirmation,
  replace the required dialog with `window.confirm`/a toast/generic custom
  modal, use vague confirmation copy, or send a mutation after cancel/dismiss
- place explanatory/body copy beside footer actions, hand-build inconsistent
  page-local action rows, put the commit before cancel in source, reverse action
  order with CSS or duplicated responsive markup, or ship undersized phone
  action targets
- ship a growing page result list without default shadcn-vue pagination, use
  infinite scrolling or “Load more” as its only navigation, or paginate only a
  partially fetched client subset
- put business logic in pages, components, routes, or queue processors
- import Awilix in domain/application modules, inject the container/cradle,
  resolve dependencies from inside a service, auto-load registrations from
  filenames/globs, store request/actor/tenant/transaction context in a
  singleton, reuse a child scope across executions, or install a second DI
  container
- leave actor type, identity source, display-name source, role assignment,
  authorization scope, hierarchy, or resolution behavior as an undefined
  generic placeholder in an approved project book
- put durable business logic in a realtime gateway, trust client-selected
  tenant/channel/room values, expose connection credentials in URLs/logs, or
  treat Redis Pub/Sub as durable/replayable history
- select Socket.IO, an experimental runtime WebSocket feature, or a native-addon
  server as the generic default without the documented requirement, ADR, and
  production evidence
- treat Pinia, Redis, or browser storage as durable truth
- treat application telemetry as the durable activity trail, let clients choose
  trusted activity tenant/actor/module/tag fields, hide core searchable fields
  inside `data_json`, store unrestricted objects/secrets in JSON, mutate
  ordinary activity rows, or use activity history as current domain state
- generate a database chapter as only an ERD or field-name list, copy a
  reference project's framework/domain schema into a new product, allow
  cross-tenant ID-only relationships without proof, treat nullable tenant scope
  as implicit platform scope, hide stable relational/invariant fields in JSON,
  rewrite applied migrations, or present a destructive down migration as the
  default recovery plan
- create one BullMQ queue per tenant without an approved isolation need, accept
  queue/job identity from a client, use a mutable tenant code as an
  authorization key, or handcraft BullMQ internal Redis keys
- treat a custom BullMQ `jobId` or deduplication ID as durable business
  idempotency after retention, removal, replay, or scheduler overlap
- attach databases or Redis to a global shared Docker network without a named
  need, use fixed container names/static IPs, or hide volume deletion behind a
  normal stop/down/rebuild target
- pass build secrets through Docker arguments, run broad Docker prune commands,
  or treat a development container as production-image proof
- add comments that merely translate syntax, preserve dead code, invent
  unverified behavior, or leave an unowned `TODO`
- expose opaque database, queue, infrastructure, log, stack-trace, or secret
  details to users; documented product references such as order, booking,
  support, or request IDs are allowed when the workflow requires them
- call mocked or seeded visual output real end-to-end proof without saying so
- let API/fixture setup stand in for a claimed browser action, let an
  application-route mock satisfy release end-to-end proof, use arbitrary sleeps
  or force-clicks to hide timing/product defects, or let a retry-only pass
  satisfy a release gate
- call an ASCII wireframe, screenshot, component preview, or attractive page a
  complete screen contract when its content, data, states, permissions,
  responsive behavior, interactions, or evidence matrix is missing
- ship an important visible action that has no real handler/destination, closes
  an overlay without doing its labelled work, reports success without proof, or
  belongs to a different audience surface
- automatically retry a stale user mutation against a newer revision, silently
  overwrite concurrent work, write activity/outbox effects for a losing
  conflict, or claim one-client sequential requests prove concurrency safety
- collapse unrelated important screens into one long role document, leave
  table columns or form fields implicit, use `Notes` as a catch-all for missing
  contracts, or mark an undocumented responsive transformation as “same as
  desktop”
- treat hiding a table column or action as authorization when the API still
  returns unauthorized fields or accepts the protected operation
- introduce a second Flutter state-management or architecture system without an
  approved ADR
