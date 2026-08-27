
### 8.10 UI copy and content

This section is the canonical contract for `UI-COPY-001`. It applies to every
rendered localized string, not only representative pages or newly edited copy.

- Product UI is not documentation.
- Use active, consistent action labels: `Save changes`, `Publish`, `Retry`.
- Keep the same action word through button, confirmation, toast, history, and
  activity-history copy.
- Write from the user's perspective, not the implementation's.
- Speak directly to the person using the current surface. Do not describe that
  person in the third person by repeating their role, such as `Customers start
  here` on a customer page or `Owners can edit` on an owner page. Name a role
  only when it distinguishes another participant or an explicitly different
  scope in the workflow.
- Write the task or outcome, not the policy rationale or system mechanism. Keep
  requirements language, security-boundary explanations, storage guarantees,
  architecture terms, and library names in the project book unless the person
  must know them to decide, act safely, or recover.
- Do not prefix normal task copy with `For safety`, `By design`, `The system
  does not`, or a similar implementation justification. State the action and
  recovery directly; show a policy explanation only when it materially changes
  informed consent or safe use.
- Show the resolved value, not the word `default`, when there is no choice to
  compare. Use `Use organization setting`, `Inherit from parent`, or equivalent
  only on a real override control whose inheritance behavior the user can
  change or needs to understand.
- Do not expose a generator's assumptions as UI labels. Country, locale,
  currency, timezone, role, and scope defaults belong in approved initialization
  and settings contracts; ordinary pages show the effective user-facing value.
- Do not add lorem ipsum, dummy paragraphs, fake instructions, or unexplained
  sample values.
- Do not add "How this works", "Before you start", step explanations, or helper
  cards above the task unless risk or genuine complexity requires them.
- Do not repeat actor or registered scope context in the page header when the
  shell already shows it.
- Do not expose database IDs, tokens, queue names, field keys, or internal status
  codes unless the workflow requires them.
- Empty states tell the user what can happen next.
- Errors state what happened and how to recover.
- One label labels; one example demonstrates. Do not make text perform several
  jobs.
- Every helper sentence must state an input constraint, material consequence,
  decision, recovery action, consent, or risk that is not already visible. If
  it only repeats a label, narrates the page, explains implementation, or
  promises a future capability, delete it.
- Before release, enumerate every rendered localized title, subtitle,
  description, helper, empty state, error, and confirmation across all roles
  and modules. Review the copy in context and add an automated rejection rule
  for recurring implementation narration; a spot check of representative
  pages is not sufficient.
- Review copy in every supported locale with real long values. A technically
  translated sentence that uses the wrong product noun, audience, or business
  meaning is a defect, not a localization success.
- Localize all user-facing product copy through the i18n system.

### 8.11 Feedback surfaces

Use the smallest surface that preserves context:

| Need | shadcn-vue surface |
| --- | --- |
| Field validation | `Field`, control, inline description/error |
| Page-level recoverable problem | `Alert` or stable inline state |
| Lightweight completed action | Sonner toast |
| Any create, update, or delete confirmation | `AlertDialog` |
| Focused short task | `Dialog` |
| Side details or desktop filters | `Sheet` |
| Mobile-first secondary task | `Drawer` |
| Contextual choice | `Popover` or `DropdownMenu` |
| Foreground API or heavy task that must block safe interaction | Layout-owned `AppLoadingOverlay` with `Spinner`, or `Progress` when completion is measurable |
| Background progress | Inline progress/status; toast only for non-critical completion |

Toasts must not carry critical information that disappears. Destructive or
financial actions must not rely on a generic browser confirm.

Overlay and action-completion rules:

- Every `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, and menu has an
  accessible title/name, documented initial focus, keyboard order, Escape/
  outside-interaction policy, close result, and focus-return target.
- A visible action button must execute its named authorized action, navigate to
  its named destination, or change the documented local state. It must not be a
  placeholder, silently do nothing, or close the overlay as if work succeeded.
- Use a clearly labelled Cancel/Close control for dismissal. Do not put an
  action verb on a button whose only effect is dismissal.
- If dismissal would lose a material draft, invoke the approved unsaved-change
  confirmation. If a mutation is already pending, disable duplicate action and
  define whether dismissal is blocked, hides only the presentation, or requests
  supported cancellation; never imply that closing a dialog rolled back a
  committed server action.
- Preserve default shadcn-vue focus and stacking behavior. Do not add manual
  overlay z-index, focus traps, backdrop handlers, or page-level color variants.
- Component tests cover focus/open/close semantics. Playwright clicks every
  important visible action and proves the expected route, request, state,
  feedback, or durable effect; merely opening the overlay is insufficient.

#### 8.11.1 Mandatory web mutation confirmation

Every web create/update/delete trigger uses the default shadcn-vue
`AlertDialog` composition:

- `AlertDialogTrigger` or an equivalent controlled open state
- `AlertDialogContent`
- `AlertDialogHeader`, `AlertDialogTitle`, and `AlertDialogDescription`
- `AlertDialogFooter`
- `AlertDialogCancel`
- `AlertDialogAction`

Use one shared typed `AppMutationConfirmDialog.vue` composition to enforce the
structure and Section 6.7 behavior while retaining the default component
styling. Its contract accepts the mutation kind, localized entity/action label,
safe target label, optional tenant/scope, optional bulk count/selection scope,
material consequence/recovery copy, and explicit confirm label. It emits a
typed confirmation result; it does not own API clients, business rules, or
arbitrary HTML.

Rules:

- validate a create/update form before opening the dialog; invalid input remains
  in the form and focuses the first error instead
- open the dialog from the actual button/menu action and keep a stable snapshot
  of the proposed command while it is being confirmed
- Cancel, Escape, close, route departure, or component disposal performs no
  mutation and restores focus appropriately
- the confirm action can execute only once; disable repeat activation, close or
  settle the dialog, then start the Section 7.10 loading lease and mutation
- use the component's normal action for create/update and its supported
  destructive composition for delete/archive or another destructive command;
  do not add page-level colors
- never use `window.confirm`, a generic `Dialog`, a toast action, or a
  custom-styled modal as the confirmation boundary
- do not generate generic “Are you sure?” copy when the screen contract knows
  the action and target

The screen contract records the trigger, exact title/description/buttons,
target/scope source, cancel behavior, confirm request, activity tag, result
feedback, focus behavior, and tests.

#### 8.11.2 Deterministic web action-footer composition

This section is the canonical contract for `UI-ACTION-001`.

Every generated Nuxt project must provide one shared typed action-footer
composition for forms and for `Dialog`, `AlertDialog`, `Sheet`, and `Drawer`
surfaces that expose actions. Build it from the applicable default shadcn-vue
footer and button components. Tailwind may adapt only layout, spacing, sizing,
and responsive composition; it must not create a second visual button or modal
system.

The shared composition enforces all of the following:

- Header, description, helper, warning, summary, and form content remain in the
  content region above the footer. The footer contains actions only. Never use
  a footer as a two-column layout with explanatory text on one side and buttons
  on the other.
- Use one semantic sequence in source, DOM, keyboard traversal, and visual
  reading order at every breakpoint: safe dismissal or navigation first,
  optional bounded secondary actions next, and the primary or destructive
  commit last. Use logical inline-start/inline-end language rather than hard-
  coded left/right placement.
- On phones, stack actions at full available width in that same order, with the
  primary or destructive commit last and nearest the block end. Every action,
  including icon-only controls, has at least a 44 by 44 CSS-pixel target and
  adjacent targets have at least 8 CSS pixels of separation.
- On tablet and desktop, keep one compact natural-width horizontal action group
  aligned to the logical inline end. Safe actions still precede the commit;
  do not stretch ordinary actions across unused width merely to fill the row.
- Never use `flex-col-reverse`, CSS `order-*`, duplicated breakpoint-specific
  action markup, or another reversal technique to repair an incorrect DOM
  sequence. Responsive CSS changes the arrangement, not the action meaning or
  traversal order.
- Expose at most one primary commit. If more than three actions would crowd a
  phone footer, move infrequent or non-commit choices to a documented menu or
  content-region control; do not create a dense button wall.
- Pending and disabled states preserve the same order and geometry. Disable the
  triggering commit immediately, expose one accessible progress state, retain
  a stable task-oriented label, and do not swap, hide, or move actions in a way
  that causes layout shift or accidental activation.

All form and overlay action rows use this shared composition. A genuine
platform or accessibility exception must be registered in `ui-system.md` with
its reason, affected screens, exact DOM/visual/focus behavior, and component,
responsive, accessibility, and Playwright evidence. Page-local preference is
not an exception.

Enforcement is mandatory:

- `standards:check` rejects reverse/order utilities in action footers,
  breakpoint-duplicated action groups, action footers containing body copy,
  ad-hoc form/dialog footers where the shared pattern applies, and a commit
  action that precedes its cancel/safe action in source
- component tests prove DOM/tab/visual order, phone and desktop arrangement,
  minimum phone targets and separation, long localized labels, disabled and
  pending stability, focus return, and light/dark rendering
- Playwright exercises representative form and confirmation footers at phone,
  tablet, and desktop widths; cancellation must send no request, confirmation
  must send exactly one request, and the expected rendered plus durable result
  must be verified

Maintain this inventory for important workflows:

| Trigger | Actor/state | Surface | Message/action | Persistence | Accessibility announcement | Requirement/test |
| --- | --- | --- | --- | --- | --- | --- |

Notification rules:

- Use an in-product notification only when information remains useful after the
  immediate interaction or must be revisited.
- Define recipient, urgency, delivery channels, deduplication, unread/read,
  dismissal, retention, deep-link destination, and permission for each
  notification type.
- Do not send a notification for every event merely because an event exists.
- A toast confirms the actor's recent action; it is not a durable notification
  inbox.
- Push or system notifications require explicit native/web permission,
  privacy, quiet-hours, and deep-link behavior.

For a security-sensitive destination, payout/receiving configuration, recovery
channel, integration endpoint, or comparable protected resource, the generated
project book must additionally apply the rules below. Protected authentication
material follows the same rules.

- define the exact material fields and state transitions that notify; cosmetic
  label, private-memo, or audience-instruction changes must not notify unless
  the product owner explicitly classifies them as material
- separate any private operator memo from audience-visible instructions; give
  it its own schema limit, encryption/retention rule, read permission, and
  projection allowlist, and exclude it from customer/user output, mutation or
  idempotency responses, activity metadata, notification content, email/push,
  outbox/job payloads, logs, traces, screenshots, and test artifacts
- identify the closed recipient actor catalog, exact scope, authoritative
  membership/contact source, recipient-resolution time, eligibility rules, and
  whether the initiating actor is included; never infer recipients from a
  display label or client-supplied scope
- persist the redacted notification in the same transaction as the material
  change and use a transactional outbox for external delivery; queued work
  carries opaque immutable IDs and reloads current scope, recipients, and safe
  display data after commit
- define the exact visible window, expiry/retention, read/dismiss/session-dedupe
  behavior, all-page versus feature-page presentation, localization,
  accessibility announcement, and safe deep link
- treat a toast/banner/pop-up as presentation of persisted server truth, never
  as the only record; a background refresh must not trigger the global blocking
  loader or replace the current page on a transient failure
- define channel retry/idempotency honestly: use a per-recipient effect ledger
  and deterministic provider key where supported, but document any provider
  acceptance/crash window that prevents exactly-once delivery
- trace the rule through `product-spec.md`, domain/module specs,
  `api-contract.md`, `database-schema.md`, `permissions-matrix.md`,
  `security-model.md`, `jobs-and-schedulers.md`, `ui-system.md`, screen/flow
  contracts, `test-strategy.md`, production readiness/runbooks, and
  requirements traceability
- prove material and non-material classification, same-transaction
  notice/outbox, scope and role denial, expiry, private-data redaction,
  duplicate/retry/partial-recipient delivery, every supported presentation
  surface, and the deep-link destination

If material fields, recipient scope/source, delivery channels, visibility
window, privacy classification, or provider guarantee is missing or ambiguous,
stop document generation and ask the product owner rather than inventing it.

### 8.12 Forms and validation

The generated project's executable gate manifest owns this section's choice-
control contract as `UI-CONTROL-001`.

- Use shadcn-vue `FieldGroup`, `Field`, labels, descriptions, and the correct
  control.
- Use `InputGroupInput`/`InputGroupTextarea` inside `InputGroup`.
- Use `FieldSet` and `FieldLegend` for related choices.
- Use `ToggleGroup` for two to seven compact peer controls only when each
  control represents a pressed/two-state choice. Use `RadioGroup` or `Select`
  for mutually exclusive form values; option count alone does not choose the
  component.
- Use `Select` only for a short, bounded list of at most nine easily scanned
  choices. Use the default shadcn-vue `Combobox` for ten or more options,
  remotely loaded catalogs, or values people must find by name or code, such
  as a country, bank, or timezone. Filtering must match the visible label and
  useful identifiers, and the screen contract must define keyboard/touch,
  loading, empty-result, disabled-option, and clear behavior. Do not use a
  native/custom select or an unfilterable `Select` for a long list.
- Keep labels visible; placeholders are examples, not labels.
- Use correct `type`, `inputmode`, `autocomplete`, and locale-aware formatting.
- Use VeeValidate with `toTypedSchema` and Zod for substantial client forms.
- Keep one canonical shared schema only when client and server meanings are
  truly identical; server rules may be stricter.
- Zod is the only approved schema-validation library on both client and server.
  Do not add Yup, Joi, Valibot, Superstruct, or another validator without an
  approved ADR.
- Validate server input with Zod at the boundary on every request.
- Validate normal fields on blur or submit, not noisily on every keystroke.
- Put errors next to fields and focus the first invalid field after submit.
- Add an error summary with links for long forms.
- Preserve attempted values when safe.
- Disable and show progress during submission to prevent double submit.
- Distinguish disabled from read-only.
- Confirm navigation or dismissal when unsaved high-value changes would be lost.
- Autosave must not bypass the Section 6.7 update-confirmation rule. Under this
  baseline, use an explicit Save action and confirmation dialog; an autosave
  exception requires an approved project-specific deviation with draft,
  recovery, conflict, feedback, audit, and safety behavior.

### 8.13 Accessibility baseline

This section is the canonical contract for `UI-ACCESS-001`.

- Meet WCAG 2.2 AA for supported flows.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and
  meaningful UI boundaries.
- Use semantic elements before ARIA.
- Keep one clear `h1` and a logical heading hierarchy.
- Provide a skip-to-main-content link in navigation-heavy layouts.
- Preserve visible focus rings.
- Match keyboard order to visual order.
- Support keyboard operation, Escape dismissal, and focus return for overlays.
- Provide accessible names for icon-only actions.
- Give meaningful images useful alt text and decorative images empty alt text.
- Never communicate state by color alone.
- Use appropriate live regions for errors, progress, and non-blocking
  notifications.
- Never disable browser zoom.
- Test text enlargement at 200% and with increased operating-system text size.
- Test WCAG reflow at a viewport equivalent to 320 CSS pixels, commonly 400%
  zoom from 1280 CSS pixels. Non-excepted content must retain information and
  functionality without two-dimensional page scrolling; document legitimate
  exceptions such as maps, diagrams, and complex data tables.
- Respect `prefers-reduced-motion`.
- Keep phone touch targets at least 44×44 CSS pixels with at least 8px separation
  where accidental taps are likely.

### 8.14 Images and icons

- Use `NuxtImg`/`NuxtPicture` for managed images.
- Declare dimensions or aspect ratio to prevent layout shift.
- Use responsive `sizes` and modern formats.
- Eager-load only critical above-the-fold imagery.
- Lazy-load below-the-fold media.
- Use one locally installed Iconify collection when possible.
- Keep the shadcn-vue configured icon library and product icon family visually
  consistent.
- Use SVG/vector icons, not emoji or raster icons, for structural controls.
- Use approved official brand assets and variants. Do not guess asset paths or
  recolor outside the brand owner's published guidance.

### 8.15 Motion decision ladder

1. Use the default shadcn-vue/Reka transition when it already expresses the
   interaction.
2. Use AutoAnimate for simple list insertion, removal, reorder, and layout
   changes.
3. Use GSAP for coordinated, interruptible, timeline, SVG, or scroll-driven
   motion that has clear product value.

Do not make AutoAnimate and GSAP own the same element or transition.

Motion rules:

- Motion explains cause, hierarchy, continuity, or feedback.
- Prefer 150–300ms for micro-interactions and keep complex UI transitions at or
  below roughly 400ms.
- Exits should usually be faster than entrances.
- Do not make an animation block unrelated input or become a prerequisite for
  understanding or completing a task. Temporarily suppressing a duplicate,
  conflicting action during a state transition is allowed.
- Prefer transforms and opacity/`autoAlpha`. Avoid width, height, top, left,
  margin, or padding when transforms can express the same result. When an
  intrinsic layout transition genuinely requires a measured dimension, keep
  the scope small and verify layout cost on low-end devices.
- Use `will-change` only on elements that actually animate.
- Test low-end mobile behavior and avoid hundreds of simultaneous tweens.
- Skip or simplify motion for reduced-motion users.

GSAP in Nuxt/Vue:

- Create animations after mount.
- Scope selectors with `gsap.context()` to a component root.
- Revert the context on unmount.
- Register common plugins once; lazy-load rare plugins.
- Use `gsap.matchMedia()` for responsive and reduced-motion conditions.
- Keep GSAP browser-only and out of SSR execution.
- Use one `gsap.timeline()` for a coordinated sequence instead of chained
  delays or unrelated tweens that compete for the same properties.
- For pointer/scroll values updated at high frequency, prefer a bounded
  `quickTo`/`quickSetter`-style owner and avoid creating a new tween for every
  event.
- Attach ScrollTrigger to the coordinated top-level animation rather than to
  competing child tweens. Choose scrub-driven or toggle-action behavior
  deliberately, and remove development markers before release.
- Refresh ScrollTrigger only after real layout changes and debounce where needed.

### 8.16 Web UI/UX release checklist

Every applicable stable `UI-*` rule from Section 13.7.1 is mandatory and
blocking. A project may split their evidence commands for speed, but it must
not downgrade them to optional advice or rely on a reviewer remembering the
checklist. `UI-STATE-001` owns the complete rendered-state contract below.

#### Product and content

- [ ] The route exists in the screen registry and the shipped screen agrees with its approved Section 8.9 contract.
- [ ] The screen's actor, job, primary action, and states are documented.
- [ ] The screen uses the correct public/self-service/operational/
  administration/device surface and exposes no controls from another audience's
  workflow.
- [ ] Real product content is used.
- [ ] No lorem ipsum, dummy metrics, explanation-heavy helper cards, internal wording, or third-person narration of the current user remains.
- [ ] Effective values are shown without redundant `default` language; policy
  rationale appears only when it is required for informed action or recovery.
- [ ] The action vocabulary is consistent through the workflow.

#### shadcn-vue and styling

- [ ] Existing shadcn-vue components and built-in variants were used first.
- [ ] Product templates use Tailwind only for layout and responsive composition.
- [ ] No page-level component recoloring, typography, shadow, radius, gradient, or manual dark-mode overrides were added.
- [ ] Green primary, neutral semantic surfaces, light mode, dark mode, and system preference work.
- [ ] Compact density remains readable and touch-safe.

#### Layout

- [ ] Reflow works at 320 CSS pixels without loss of non-excepted content or functionality.
- [ ] Phone composition is intentional at 375px.
- [ ] Tablet composition is intentional at 768px and 1024px.
- [ ] Desktop composition is intentional at 1440px.
- [ ] Authenticated pages use the canonical top bar, default shadcn-vue
  `Sidebar`/`SidebarTrigger`, and layout-owned main `ScrollArea`.
- [ ] Every Nuxt layout is a thin slot adapter to a shared master-layout
  component; routed pages do not duplicate the shell or global overlay.
- [ ] `AppLoadingOverlay` is rendered exactly once outside the routed page slot
  and covers the application viewport without changing document height.
- [ ] The viewport-height application root and all intermediate flex/grid
  wrappers are correctly bounded; route content and long lists do not increase
  `body`/`#__nuxt` height.
- [ ] The main `ScrollArea` is the only primary vertical page scroller; any
  secondary scroll owner is bounded, justified, and documented.
- [ ] There is no horizontal page scroll.
- [ ] Tabs, filters, toggles, and chips use an intentional wrap, scroll, collapse, or alternate-control strategy.
- [ ] Breakpoint boundaries and fluid resizing between evidence widths were tested.
- [ ] Long forms/details are grouped; the page is not a wall.
- [ ] Desktop actions and fields are not unintentionally full width.
- [ ] Sticky/fixed regions do not cover content.
- [ ] Every table/list column, responsive transformation, filter/sort/page rule, row/action/selection behavior, and empty/loading/error state matches its documented contract.
- [ ] Every result list uses default shadcn-vue `Pagination`, including
  zero/one-page disabled state, route-query persistence, bounded page size, and
  mobile composition.
- [ ] Long categorized collections provide deliberate search, grouping/
  progressive disclosure, deterministic order, stable item anatomy, and
  back/forward restoration using uneven-content fixtures.
- [ ] Entity-scoped management is anchored in the entity detail context;
  catalogs, lists, shortcuts, and assignment-specific actions do not create
  competing mutation surfaces.

#### States and interaction

- [ ] Relevant loading, empty, error, success, denied, expired, conflict, and destructive states exist.
- [ ] Every user-initiated create, update, delete, state transition, archive,
  restore, and bulk mutation uses the shared default shadcn-vue `AlertDialog`
  before starting the request.
- [ ] Confirmation copy names the action, target, material effect, and bulk
  selection scope; buttons use `Cancel` and an explicit verb rather than
  generic “Are you sure?”, `Yes`, `OK`, or `Continue`.
- [ ] Invalid input does not open confirmation; cancel/dismiss sends no request
  and restores focus; confirm sends exactly one request and hands off to the
  global loading overlay.
- [ ] Every form and overlay action row uses the shared Section 8.11.2 footer;
  content remains above the action-only footer, and no explanatory-text/action
  split layout remains.
- [ ] Source, DOM, keyboard, and visual order is safe/cancel first and primary/
  destructive commit last at every breakpoint; no reverse/order utility or
  duplicated responsive action markup changes that sequence.
- [ ] Phone actions are full-width, at least 44 by 44 CSS pixels, and separated
  by at least 8 CSS pixels; tablet/desktop actions form one compact natural-
  width group at the logical inline end.
- [ ] Foreground requests and heavy tasks acquire/release one opaque loading
  lease; the overlay is visible exactly while the derived count is greater than
  zero and remains for the central 500 ms final-release hold.
- [ ] Tests cover ten concurrent requests finishing out of order, chained
  requests, handled non-zero HTTP-200 results, unexpected errors, cancellation,
  timeout, retry/token refresh, duplicate release, stuck-operation warning,
  `noLoading`, and heavy non-network work without count leaks or underflow.
- [ ] Global blocking, local content loading, and background refresh are
  visibly and semantically distinct; every `noLoading` use is justified.
- [ ] Async actions show feedback and prevent duplicate submission.
- [ ] Every visible action was exercised and produced its documented route,
  request, local state, feedback, or durable effect; no inert or dismissal-only
  action is labelled as successful work.
- [ ] Errors explain recovery and focus the first invalid field.
- [ ] Every choice control satisfies `UI-CONTROL-001`: `Select` is used only
  for at most nine short, bounded, easily scanned choices; ten or more choices,
  remote catalogs, and name/code lookup use the searchable default shadcn-vue
  `Combobox` with documented loading, empty, disabled, clear, keyboard, and
  touch behavior.
- [ ] Dialogs, sheets, drawers, menus, and toasts use the correct component and focus behavior.
- [ ] Each overlay has documented open, initial-focus, Escape/outside-dismiss,
  pending, close, and focus-return behavior; closing cannot imply rollback or
  success that did not occur.
- [ ] Stale protected updates preserve the safe draft, disable repeat submission
  with the old revision, show the registered handled result, and require an
  explicit refresh/review/reapply path; the client never retries against a new
  revision automatically.
- [ ] Forward route changes and result-query changes reset the correct point
  inside the main `ScrollArea`; background updates preserve position.
- [ ] Back navigation preserves useful filter, input, pagination, and main
  `ScrollArea` position.
- [ ] Every instant is rendered through the shared Day.js presentation
  boundary using the effective IANA zone and approved preset; no component uses
  browser-local date/time formatting.
- [ ] Public SSR, successful authentication/MFA/session responses, hydration, host
  changes, and logout all resolve the expected presentation context without a
  flash, mismatch, or stale cross-scope value.
- [ ] One Zod-validated Pinia Setup Store owns the complete presentation
  context; no page ref, second `useState`, local-storage value, or client-sent
  field becomes another timezone/format authority.
- [ ] User-entered mutation requests use only `YYYY-MM-DD HH:mm:ss`,
  `YYYY-MM-DD`, or 24-hour `HH:mm:ss`; they contain no `T`, `Z`, offset,
  milliseconds, AM/PM, or client-supplied timezone.
- [ ] The client never converts local input to UTC. The protected server
  resolves the documented authoritative business scope/system timezone,
  rejects invalid or ambiguous local date-times, converts only a unique
  date-time instant to UTC, and never shifts date-only or time-only values.
- [ ] Cross-scope views, exports, prints, and notifications disclose the
  timezone when otherwise ambiguous; UTC sort/cursor order is unchanged by
  display formatting.
- [ ] Changing timezone or date/time format is a validated, confirmed,
  permission-checked, versioned mutation with an immediate preview and activity
  evidence.

#### Accessibility

- [ ] Keyboard operation and visible focus were manually tested.
- [ ] Heading order, labels, names, alt text, and live regions are correct.
- [ ] Contrast passes in light and dark mode.
- [ ] Color is not the only signal.
- [ ] Touch targets, zoom, large text, and reduced motion were tested.
- [ ] Automated accessibility tests have no unresolved critical/serious issues.

#### Evidence

- [ ] The screen contract's test/evidence matrix has no unexplained missing required scenario.
- [ ] Each important screen has current 320px reflow plus 375px, 768px, 1024px, and 1440px evidence.
- [ ] Both light and dark modes have current evidence.
- [ ] At least one important interaction or failure state is captured.
- [ ] Evidence proves wheel, touch, keyboard, route reset, back/forward
  restoration, sidebar adaptation, and pagination inside the bounded shell.
- [ ] Screenshots are treated as samples; responsive behavior was also exercised continuously across supported widths.
- [ ] High-value flows prove saved state and downstream effect, not appearance only.
- [ ] All `Not tested` items name a reason and follow-up owner.
