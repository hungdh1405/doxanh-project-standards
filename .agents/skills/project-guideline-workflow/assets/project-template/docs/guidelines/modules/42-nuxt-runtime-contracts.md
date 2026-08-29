
### 7.9 Day.js and Lodash

This section is the canonical contract for `TIME-PRESENTATION-001`. It is a
blocking rule for every Nuxt project that renders or accepts temporal values.

- Configure Day.js plugins once in a utility/plugin boundary.
- Enable the Day.js `utc` plugin before the `timezone` plugin. Application
  components must call one shared formatter/composable; they must not import
  Day.js, call `Intl.DateTimeFormat`, guess the browser zone, or maintain local
  format strings independently.
- The starter system presentation defaults are the IANA timezone
  `Asia/Ho_Chi_Minh` (currently UTC+07:00) and the Day.js format
  `YYYY-MM-DD HH:mm:ss`. `HH` is the unambiguous 24-hour clock, `MM` is month,
  and `mm` is minute. A 12-hour option must include `A` or `a`, for example
  `YYYY-MM-DD hh:mm:ss A`.
- Treat the IANA identifier as authoritative. A label such as `UTC+7` may be
  displayed as supporting copy but must not be persisted as the zone. Validate
  every configured zone through Zod against the runtime IANA timezone
  implementation; reject invalid input without silently using UTC or the
  browser zone.
- Store instants in PostgreSQL `timestamptz` and normalize them to UTC.
  Server responses, events, outbox payloads, and cursor source values serialize
  instants as ISO 8601 UTC strings with a terminal `Z`; responses carry raw
  instants, not server-preformatted display strings. User-entered mutation
  requests follow the separate local-value contract below and do not send UTC.
- Resolve one effective presentation context before rendering: approved
  business-scope override, then system default. Generated project documents
  must replace “business scope” with the exact project entity, identify the
  authorized setting owner and permission, and state the authoritative source.
  Viewer/browser timezone is a separate optional product feature and never an
  implicit fallback for business data.
- Define one strict presentation-context response containing at least
  `timezone`, `date_time_format`, `default_locale`, `source`, and the supported
  preset/locale catalogs. The API returns the server-resolved context from a
  public pre-login/SSR endpoint and embeds the same projection in every
  successful authentication, applicable MFA completion, and session
  refresh/restore response.
  Do not make the browser reconstruct scope precedence.
- Store that complete projection atomically in one dedicated Pinia Setup Store.
  It is the frontend source of truth for every visible date/time formatter,
  input helper, locale-default decision, export/print preview, and timezone
  label. Consumers use store getters or `storeToRefs()`; they do not copy
  timezone/format values into page refs, component props chains, local storage,
  or a second `useState` owner.
- Render every user-visible instant, calendar date, and wall-clock time through
  the shared presentation boundary with the effective authoritative context.
  A formatter failure must show a localized unavailable/invalid state; it must
  never expose the raw API, database, ISO, cursor, or canonical mutation value
  as a display fallback.
- Materialize `TIME-PRESENTATION-001` in the generated gate manifest and make
  `standards:check` reject direct rendered temporal fields, component-local or
  browser-local date/time formatting, and raw-value fallbacks after a shared
  formatter fails. Keep an explicit allowlist for non-visible wire/input
  normalization so the gate does not confuse canonical transport values with
  presentation.
- The tracked HTTP adapter must validate an authentication/session
  `presentation_context` with the shared Zod response schema, replace the whole
  Pinia value before resolving the caller, and update the active default locale
  only when the user has no valid explicit locale preference.
- A language chooser lists only actual supported languages. System, tenant,
  organization, workspace, location, or other scope defaults are initialization
  policy, not a pseudo-language option; apply the resolved default automatically
  when no valid explicit preference exists. Generated project documents must
  name the exact scope and preference persistence behavior.
- Initialize the Pinia store during SSR before the first rendered timestamp,
  preserve the serialized state through hydration, and replace it from a
  successful authentication/session response before navigation. A hostname or
  authoritative business-scope change must fetch and replace the complete
  context before rendering the new scope. Logout removes any actor-derived
  override and re-resolves the anonymous host/system context; it does not guess
  from the browser. Failed refresh keeps no stale privileged scope projection.
- A Pinia presentation context is display-only and may be client-inspected or
  modified. Server authorization, row predicates, business-day boundaries,
  scheduler decisions, validation, and activity attribution always resolve
  their own authoritative server context and never trust client-sent or
  Pinia-held timezone/format values.
- Keep configurable Day.js formats in a project-owned, Zod-validated allowlist
  of presets. Persist the approved format value or stable preset ID; do not
  accept arbitrary formatting programs. A preset defines its date-only,
  time-only, and date-time projections so screens do not split token strings.
- Use the active i18n locale for textual names and AM/PM output, while the
  effective scope setting controls the numeric order and clock convention.
- Define exactly three canonical user-entered mutation wire formats:
  date-time `YYYY-MM-DD HH:mm:ss`, date `YYYY-MM-DD`, and time `HH:mm:ss`.
  `HH` is always the zero-padded 24-hour clock. Zod strict schemas must reject
  impossible calendar values and any different representation, including
  `T`, `Z`, an offset, milliseconds, missing zero padding, or AM/PM. Native
  HTML `date`, `time`, and `datetime-local` controls may use their platform
  representation internally; one shared client boundary normalizes it to the
  canonical wire value before the request.
- A client submits no timezone with those local values and never converts them
  to UTC using the browser, device, Pinia, or display context. After
  authenticating and resolving the target resource, the server derives the
  authoritative IANA timezone from the exact project-owned business scope,
  with the documented system fallback only where that operation permits it.
  Generated project documents must replace “business scope” with the exact
  entity, source, precedence, authorization rule, and cross-scope behavior.
  A request field, header, cookie, browser zone, or display-store value cannot
  override this server decision.
- The server first validates the canonical local string with Zod, then resolves
  a date-time in the authoritative IANA zone and converts the unique accepted
  instant to UTC. A nonexistent local time in a daylight-saving gap and an
  ambiguous local time in an overlap are handled validation results unless the
  project explicitly documents a disambiguation field and policy. The server
  must never guess an offset.
- Date-only values are calendar dates: store/transport them as `YYYY-MM-DD` and
  never shift them through UTC. Time-only values are wall-clock values:
  store/transport them as `HH:mm:ss` and do not convert them to UTC until an
  operation combines them with a calendar date and the server-resolved IANA
  zone. Database column types and domain names must preserve this distinction.
- Business-day boundaries, scheduler rules, expiry decisions, reports, and
  range filters use the documented business timezone on the server. Sorting
  and cursor ordering use raw UTC instants, never formatted labels.
- SSR and the first client render must use the same resolved context. Hydration
  may not replace server time with a browser-relative value. Cache keys and
  invalidation must include or version any presentation context they cache.
- Cross-scope screens must select and label one explicit timezone or show the
  timezone per record; they must never mix local times without disclosure.
  Printouts, exports, notifications, and PDFs use the same documented context
  and state the zone when ambiguity could matter.
- Changing a persisted timezone or format is a confirmed configuration
  mutation with authorization, optimistic concurrency, and activity history.
  It changes future presentation and business-time interpretation only;
  historical UTC instants are never rewritten.
- Import Lodash functions individually; never import the full library into the
  client bundle by reflex.
- Prefer native language methods for simple map, filter, reduce, object spread,
  and optional chaining.

Every generated project book must materialize the date/time contract in:

- `product-spec.md`: system defaults, exact override scope/owner, precedence,
  business-day meaning, and exclusions;
- `api-contract.md`: public and authentication/session presentation-context
  projections, precedence, refresh/host-change behavior, exact local mutation
  schemas, server timezone resolution, UTC response/event wire format, DST
  results, and result codes;
- `database-schema.md`: instant/date/settings column types, defaults,
  constraints, indexes, and migration behavior;
- `permissions-matrix.md` and `security-model.md`: who may change the settings,
  scope isolation, activity attribution, and disclosure rules;
- `ui-system.md` and UI mock contracts: SSR-hydrated Pinia owner, atomic
  replacement lifecycle, shared formatter, settings control, timezone labels,
  responsive behavior, and export/print consistency;
- `jobs-and-schedulers.md`: timezone ownership, DST, misfire, and recalculation
  rules where scheduled business time exists;
- `test-strategy.md` and `requirements-traceability.md`: stable IDs covering
  exact local request formats, rejection of UTC/offset/`T` mutation values,
  server-side UTC conversion, date/time non-conversion, authoritative
  scope/system precedence, DST gaps/overlaps, public/login/session projection
  equality, Pinia replacement, invalid formats/zones, SSR/hydration, logout and
  host changes, cross-scope display, permissions, activity, and cache
  invalidation, plus executable rejection of direct/raw rendered temporal
  values and localized formatter-failure behavior.

### 7.10 Nuxt application shell and global loading

Use one component and state path:

```text
layouts/default.vue
  -> AppMasterLayout.vue
       ├── stable shell regions
       ├── <slot /> for the routed page/page template
       └── AppLoadingOverlay.vue outside the page slot
            -> useAppLoadingStore()

tracked $fetch/useFetch adapter or approved Axios client
  -> useBlockingActivity()
       -> useAppLoadingStore()
```

The same root-overlay composition applies to every active layout family.
`public`, `auth`, and `workboard` may change chrome, but they must not implement
independent counters or leave foreground work without an overlay.

#### 7.10.1 Pinia loading controller

`app/stores/app-loading.ts` is a Setup Store with:

- a private `Map` or `Set` of opaque active leases and their safe metadata
- readonly `loadingCount`
- readonly `isLoading`, defined exactly as `loadingCount > 0`
- an acquire action that returns a unique token or idempotent release handle
- one release action that applies the central 500 ms hold and removes only the
  matching token
- `runBlocking<T>(operationName, work): Promise<T>` implemented with
  `try/finally`
- a development-only duplicate/unknown-release warning and a production
  long-running-operation watchdog

Do not expose mutable count state. Do not let a page call a bare decrement or
clear all active work. A legacy `increaseLoadingCount()` /
`decreaseLoadingCount()` API may be adapted only inside one migration boundary;
new code uses leases so overlapping operations cannot release each other.

Acquire the store inside a Nuxt plugin, composable, component setup, or another
injection-aware call. Do not create a module-scope store or Axios singleton that
can cross SSR request contexts.

#### 7.10.2 Request integration

- Centralize foreground tracking for the selected client path. Tracked
  `$fetch`/`useFetch`/`useAsyncData` helpers and approved Axios clients must
  share the same loading policy.
- Client-side event requests participate by default. SSR data acquisition does
  not mutate a global browser loading store; client navigation/refresh behavior
  must be documented and tested separately.
- For Axios, acquire before dispatch and attach the token to
  request-local configuration or wrap the complete public request. Release it
  for the response and every error path, including cancellation and timeout.
- For `$fetch`, use one application wrapper/interceptor boundary with the same
  acquire/release semantics. Do not instrument both the wrapper and underlying
  interceptor.
- Retrofit-like SDK adapters, uploads, downloads, token refresh, and retries
  must document which layer owns the one lease.
- A returned HTTP 200 with a handled non-zero application `code` is terminal
  work and releases normally before its expected-result UI is shown.
- Loading cleanup is independent from result classification. Do not convert a
  handled non-zero envelope into a generic `Error` and then send it through the
  unexpected HTTP/network-error path. Return/map the registered expected result
  exactly once and choose one feedback owner so it cannot produce duplicate
  toasts.
- `noLoading` defaults to `false` and must be carried as typed request metadata,
  not sent to the server. Its approved background use and reason must be
  visible in code review and the screen's data-dependency contract.
- Every request has bounded timeouts and cancellation. Cleanup still runs when
  a component unmounts, a route changes, or stale work is aborted.

Direct API-client construction in pages/components is prohibited because it
can bypass authentication, response mapping, correlation, cancellation, and
loading behavior.

#### 7.10.3 Overlay presentation

`AppLoadingOverlay.vue` is rendered once by the shared master-layout root and
may use `Teleport` to the application overlay root or `body`. It:

- covers the application viewport, including the bounded main `ScrollArea`
- uses the default shadcn-vue `Spinner` without component restyling
- uses a localized concise status such as “Loading”
- exposes `role="status"`, an accessible name/live announcement, and sets the
  application content's busy state appropriately
- blocks pointer interaction and duplicate submissions while preserving a
  deterministic stacking and focus policy
- uses the default shadcn-vue `Progress` when a reliable percentage is known
- does not contain explanation cards, request details, changing technical
  messages, or arbitrary delay logic

The 500 ms exit hold reduces flashing but must not delay operation completion,
navigation, or result handling; it controls only the overlay's final removal.
Use fake timers in unit/component tests so the policy remains deterministic.

### 7.11 TypeScript, Vite, and public-boundary discipline

- Keep TypeScript `strict` enabled through the Nuxt-generated configuration.
  Do not weaken project-wide checks to make one package or file compile.
- Public component, composable, store, service, repository, request, result,
  event, and job boundaries must have explicit types. Inferred local
  implementation details may remain inferred.
- Do not use explicit `any`, broad index signatures, non-null assertions, or
  unchecked casts to bypass a boundary. Receive untrusted values as `unknown`,
  validate with the owning Zod schema, and narrow them before use.
- A TypeScript type, generated interface, Dart model, or `as` cast is never
  runtime validation.
- Model finite result/state families with discriminated unions and exhaustive
  `switch` handling. A default branch must not silently turn a newly added
  expected state into success.
- Give every finite domain/wire family one owning frozen `as const` object and
  one readonly tuple. Derive its TypeScript union, Zod enum, UI options, server
  comparisons, database defaults/checks, event payloads, and tests from those
  values. Do not repeat magic literals such as `resource.publish` across layers.
- Put a cross-client/server catalog under its bounded-context owner in
  `shared/`; keep a server-only catalog beside its registry. Prefer const
  objects/tuples to TypeScript `enum` for JSON and database wire values because
  they compose directly with Zod and serialize without enum runtime behavior.
  A TypeScript enum requires a documented integration reason.
- Committed SQL migrations and generated snapshots are immutable
  materializations and may contain literal wire values. Active Drizzle schema
  definitions and DML must consume the owning constants so a catalog change
  cannot silently diverge between validation, UI, persistence, and events.
- Use `satisfies` for typed configuration/registries when it preserves literal
  information better than a cast. Keep exported types stable and intentionally
  named.
- Generate or derive shared clients/models from approved contracts when
  practical, then contract-test them. Do not maintain several hand-written
  response-envelope definitions.
- Nuxt owns the Vite configuration and supported Vite/Rolldown version. Put
  normal build configuration in `nuxt.config.ts`; do not add a competing
  `vite.config.ts`, experimental Rolldown option, or direct Vite version
  override without a documented Nuxt-compatible need and ADR.
- Type suppression (`@ts-ignore`, disabled lint rules, or file-wide exclusions)
  requires the exact issue/ADR, smallest scope, owner, removal condition, and
  review date. `@ts-expect-error` is allowed only when the expected diagnostic
  is itself under test or documents a temporary, tracked incompatibility.
