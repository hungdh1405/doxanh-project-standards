
## 7. Nuxt and Vue engineering rules

### 7.1 Vue component standard

- Use `<script setup lang="ts">`.
- Keep SFC order: `<script>` then `<template>` then `<style>`.
- Prefer no component style block. The approved component system and layout
  utilities should cover normal UI.
- Treat props as read-only.
- Use props down and typed events up.
- Use `defineModel()` only for a genuine two-way component contract.
- Type `defineProps`, `defineEmits`, slots, injection keys, and exposed APIs.
- Keep components closed by default. Use `defineExpose()` only for a small,
  documented imperative parent contract that cannot be expressed by props,
  events, or a composable.
- Build reusable layout and page-template components with a typed default slot
  and only the named slots their contract genuinely supports. Render an
  optional slot wrapper only when the slot exists.
- Every Nuxt layout file is a thin adapter that renders one shared master-layout
  component and forwards its page slot. Pages provide page content; they do not
  copy the top bar, sidebar, viewport shell, global loading overlay, or global
  feedback regions.
- Use PascalCase component filenames and template names.
- Keep props down and typed events up as the default. Use a typed symbol-based
  provide/inject context only for stable cross-tree dependencies that would
  otherwise require deep prop drilling; keep mutation in the provider and
  expose explicit actions.
- Keep route components and layout adapters thin. Apply the Section 6.3 map
  before implementing any non-trivial page; do not postpone decomposition until
  a page becomes difficult to test.
- Keep ordinary pure transformation/formatting logic in utilities. Use a
  composable for reusable reactive state, lifecycle, or side-effect ownership,
  and return readonly state plus explicit actions when consumers must not
  mutate it directly.
- Use stable primitive keys in `v-for`.
- Do not combine `v-if` and `v-for` on the same element.
- Never render untrusted content with `v-html`.
- Use `useTemplateRef()` for Vue 3.5+ DOM/component refs.
- Do not introduce application-owned `<Suspense>` as a generic loading wrapper.
  Nuxt already coordinates asynchronous route rendering, while Vue documents
  the direct component API as experimental. Use the Section 7.3 data states and
  Section 7.10 loading contract. A narrow direct use requires a documented need,
  SSR/hydration/error/fallback tests, warning review, and an ADR that accepts the
  upstream stability boundary.

### 7.2 Reactivity

- Keep source state minimal and derive with `computed`.
- Use `ref` as the conventional default for primitive and replaceable local
  state.
- Use `shallowRef` deliberately for opaque external instances or large
  structures updated by root replacement when deep reactivity is unnecessary;
  do not expect nested mutation to trigger updates.
- Use `reactive` for stable objects mainly updated by property mutation.
- Do not destructure a reactive object without `toRefs` or an equivalent.
- Keep computed getters pure.
- Use watchers for side effects, not derived state.
- Cancel stale async effects and clean up listeners, observers, and timers.
- Move reusable, stateful, or side-effect-heavy logic to a focused composable.
- Keep pure formatters and transformers as normal utilities, not composables.
- Return readonly state plus explicit actions when callers should not mutate
  composable state directly.

### 7.3 Nuxt data fetching

- Use `useFetch` for SSR-aware route data.
- Use `useAsyncData` when fetching needs custom orchestration or non-HTTP work.
- Use `$fetch` for event-driven requests and internal server API calls.
- Make URLs, query options, and other request inputs reactive when data identity
  depends on route params or filters.
- Let `useFetch` derive its key by default. Provide an explicit stable key only
  for intentional cross-component sharing or custom `useAsyncData`
  orchestration, and keep the handler and material options consistent for every
  use of that key.
- Handle pending, error, refresh, dedupe, and cancellation states deliberately.
- Do not call plain `$fetch` in page setup when it causes duplicate SSR and
  hydration requests.
- Keep server-only credentials in runtime config private keys.
- Expose only intentionally public values through `runtimeConfig.public`.

### 7.4 Axios boundary

Axios is approved, but it is not the default replacement for Nuxt data
composables.

Use Axios when a real integration needs:

- an existing Axios SDK or adapter
- specialized interceptors
- upload/download progress
- a separate external-service client with a defined error mapper

Rules:

- Create clients in server services or request-safe plugins.
- Do not use one mutable global SSR client that can leak headers between users.
- Do not duplicate the same endpoint through both Axios and `$fetch`.
- Normalize external errors before they cross into product code.
- Never log authorization headers or full request/response bodies by default.

### 7.5 Pinia decision

The interactive Nuxt profile uses Pinia for the required application-shell
blocking-activity controller in Section 7.10 and the server-resolved
presentation context in Section 7.9. Those requirements do not make Pinia the
default owner of every kind of state.

Use additional Pinia stores only when state:

- is shared across unrelated component branches or routes
- must outlive one page component
- represents client workflow/session state with coordinated actions
- is difficult to model cleanly with route state, `useState`, or a composable

Do not use Pinia for:

- a local form
- one component's open/closed state
- a second copy or cache of server data already owned by
  `useFetch`/`useAsyncData`
- filter state that belongs in the URL
- a cache that should live on the server

When Pinia is used:

- use `@pinia/nuxt`
- prefer Setup Stores for complex logic
- call stores inside request/injection-aware functions, not at module scope
- use `storeToRefs()` when destructuring state or getters
- call actions directly
- use `callOnce()` for appropriate SSR-aware store initialization
- keep sensitive server state out of the serialized store
- add HMR support and tests with `@pinia/testing`
- keep the app-loading store client-owned, non-persisted, and initialized with
  no active leases; never serialize in-flight request state as durable session
  state
- keep the presentation-context store SSR-hydrated, non-sensitive, and
  non-persisted; it is a presentation projection, not a browser-owned settings
  cache or an authorization source
- when a store deliberately owns shared normalized remote entities or a
  cross-route workflow, document it as the single client-side owner and define
  its SSR hydration, refresh, invalidation, and error behavior

### 7.6 VueUse

- Check VueUse before writing a browser-event, media-query, storage, focus,
  observer, network, or lifecycle composable.
- Confirm SSR behavior before use.
- Do not use a client-only composable during SSR without a guard or client
  boundary.
- Prefer CSS media queries for layout; use reactive viewport state only when
  behavior, not layout, truly changes.

### 7.7 Routing and middleware

- Use Nuxt file-based routing and route middleware.
- Keep authorization enforced on the server even when middleware improves UX.
- Key data by route params and respond to param changes; do not assume a component
  remount when only params change.
- Return navigation outcomes from middleware; do not use the legacy `next`
  callback style or mix callback and return control paths.
- Await asynchronous middleware decisions, give network-dependent checks a
  bounded timeout/failure policy, and do not let a never-settling guard freeze
  navigation.
- Keep guards limited to navigation decisions. Fetch page data in the page/data
  boundary unless the data is strictly required to decide the redirect.
- Prevent self-redirect and mutual-redirect loops with an explicit destination
  comparison and tests.
- Preserve useful filter, pagination, and back-navigation state in URLs.
- Give every important screen a stable, deep-linkable route.
- Move focus to the main content heading after meaningful route changes.

### 7.8 SSR and hydration

- Do not read `window`, `document`, local storage, media queries, or DOM
  measurements during server rendering.
- Use `.client.ts`, `onMounted`, or a narrow `<ClientOnly>` boundary when a
  browser API is genuinely required.
- Do not make an entire page client-only to fix one component.
- Keep server and first client render deterministic.
- Configure an SSR width only for components that need it and verify phone and
  desktop hydration behavior.
- Do not branch responsive markup with `@nuxtjs/device`; CSS owns responsive
  layout.

### 7.8.1 Browser QR scanning when required

- A permanent printed QR, short code, or public URL can be photographed and
  copied. Treat it as a resource locator, not proof of current authority, when
  remote replay would expose or mutate protected state. Pair it with an
  explicitly approved short-lived visit/transaction proof: either a
  high-entropy opaque token or a tightly rate-limited human-entered code.
- Define proof purpose, scope, entropy/length, TTL, issuance, single-current or
  one-time semantics, rotation, revocation, closure behavior, and concurrency.
  Store only purpose-separated hashes; never put raw proofs in logs, activity,
  outbox/realtime payloads, analytics, idempotency records, or database JSON.
  Return a raw proof only at its intentional issuance boundary.
- When a browser QR carries a proof, prefer a strictly validated URL fragment
  and remove it with `history.replaceState` before any HTTP request. Existing
  authenticated sessions must have their own explicit lifetime and revocation
  contract rather than silently inheriting later QR rotation.
- If a web workflow depends on QR entry, provide both camera scanning and local
  image selection. The image path is the required desktop/no-camera/permission
  fallback; an instruction to scan an external code is not an implemented
  workflow.
- Keep camera access in a narrow client-only component, request permission only
  from a clear user action, stop the stream when its dialog closes or navigation
  begins, and define denied, missing-device, insecure-context, unsupported,
  timeout, unreadable-image, no-code, and multiple-code recovery states.
- Treat decoded content as untrusted input. Define the exact allowed scheme,
  origin, path, token schema, query/fragment policy, file types, file count, and
  byte limit. Fail closed before navigation; the destination server endpoint
  must still authenticate/authorize the capability and exact resource scope.
- Prefer a maintained framework-compatible scanner with camera and image support.
  Pin its decoder/WASM version, bundle runtime assets with the application, and
  do not make core scanning depend on a public CDN. Record package maintenance,
  browser/secure-context requirements, CSP/assets, and removal/upgrade evidence
  in engineering standards.
- Verify with a real generated valid QR image, foreign-origin and malformed
  values, no/multiple codes, permission/no-camera behavior where the browser
  harness supports it, keyboard/focus restoration, axe, phone/desktop bounds,
  and light/dark screenshots. Showing buttons without decoding and navigating is
  not end-to-end evidence.
