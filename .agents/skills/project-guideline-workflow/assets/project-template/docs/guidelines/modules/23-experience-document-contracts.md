
### 4.8 Minimum content contracts: experience design

`ui-system.md` must define:

- screen registry and information architecture
- an audience/surface map separating public, self-service, operational,
  administration, and device/display work when those surfaces exist
- master layout families, canonical master-page terminology, stable shell
  slots, top-bar/sidebar behavior, the primary scroll owner, and the one global
  blocking-loading overlay
- page-template families and copyable template checklists
- product-pattern-to-shadcn-vue component mapping
- deterministic choice-control rules, including the short-list `Select`
  boundary, searchable `Combobox` boundary, option-label/identifier search,
  remote loading, empty results, disabled options, clear behavior, and
  keyboard/touch evidence required by `UI-CONTROL-001`
- mock-screen type/component legend and shared-pattern ownership
- semantic table/list/data-grid decision rules, required column contract,
  filtering/sorting/mandatory result pagination, row/action/selection,
  responsive transformation, accessibility, and state behavior
- phone-first, tablet, desktop, light, dark, zoom, keyboard, and touch behavior
- stable executable `UI-*` ownership for visual system, density, audience,
  actions, copy, controls, collections, responsive behavior, states, and
  accessibility; every applicable web rule is blocking
- content-width and progressive-disclosure rules
- entity-detail ownership, canonical action placement, long categorized
  collection discovery, stable item/card anatomy, and active/history filtering
- loading, empty, error, validation, conflict, permission, expired, offline,
  success, and destructive states, including the decision between global
  blocking activity and local/background loading
- dialog, alert-dialog, sheet, drawer, toast, banner, and inline feedback choices
- overlay open/close/focus/pending behavior and proof that every rendered action
  has an authorized, observable outcome
- a shareable entry-point registry when the product exposes public, invitation,
  staff/operator, administration, pairing, or device/display entry flows
- the mandatory create/update/delete confirmation pattern, exact action/target
  copy, bulk-selection scope, cancel/focus behavior, and loading handoff
- the shared action-footer composition from Section 8.11.2, including its
  content boundary, semantic action order, responsive arrangement, touch
  targets, pending behavior, and permitted exceptions
- copy and localization rules
- accessibility and motion rules
- per-screen and multi-screen-flow definition formats and evidence gate

`design-tokens.md` owns exact values and semantic roles. It must provide:

- `:root` and `.dark` semantic mappings
- green primary and primary-foreground pairs
- verified contrast pairs
- type scale and data/utility typography
- spacing rhythm and content widths
- radius and elevation policy
- status and chart tokens
- motion duration/easing and reduced-motion behavior

It must not restyle default shadcn-vue components page by page.

`design-system/MASTER.md` must begin with the real product subject, audience,
and each surface's single job. Generated recommendations are critique inputs.
Reject portfolio, brochure/marketing-page, decorative domain-theme, or generic
SaaS directions that do not fit the actual product surface. Persist only the
reviewed direction.

Each page override contains only:

- applies-to routes or screens
- reason the master is insufficient
- exact deviation
- responsive and accessibility impact
- approval

The mock-UI family is an implementation contract, not a screenshot folder and
not a substitute for product/API/data documents.

`docs/mock-ui/README.md` must include:

- scope, active platform profiles, canonical upstream documents, and review
  instructions
- stable type/component legend mapping product concepts to default
  shadcn-vue components for web and native widgets for Flutter
- screen registry:

| Screen ID | Name | Route/deep link | Actors and scope | Template/shared patterns | Required state/permission coverage | Priority | Contract file | Requirement IDs | Implementation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- important workflow map:

| Flow ID | Step | Screen ID | Entry/precondition | User/system trigger | Success destination | Handled non-zero/failure destination | Back/cancel/recovery |
| --- | --- | --- | --- | --- | --- | --- | --- |

- coverage summary for required phone/tablet/desktop, light/dark, state,
  permission, keyboard/touch, and evidence combinations
- stable filename, screen-ID, route, owner, lifecycle, and last-reviewed rules

Use this type/component legend:

| Type ID | Product meaning | Default web component/pattern | Default native widget/pattern | Interaction semantics | Allowed variants/notes |
| --- | --- | --- | --- | --- | --- |

Every important routed page, full-screen native surface, consequential modal or
drawer, and substantially different permission/state variant needs a registry
entry. A small focused dialog may remain inside its owning screen contract when
its trigger, content, focus, close, action, and failure behavior are complete
there. Do not hide several unrelated screens inside one very long role file.
Optional role/module index pages may group links but must not become competing
screen contracts.

Use `SCR-<MODULE>-<NNN>` for a screen and
`scr-<module>-<nnn>-<short-slug>.md` for its file. Use
`FLOW-<MODULE>-<NNN>` for an important workflow. Chapter IDs such as `23.04`
express book order and are not screen IDs. Keep screen/flow IDs stable when
copy, route, implementation, or order changes; supersede an ID rather than
reusing it for different behavior. Item, column, field, state, action, test,
and evidence IDs are unique within the screen and stable while their semantic
meaning remains.

`docs/mock-ui/shared-patterns.md` must define and name only genuinely shared
patterns:

- shell/top-bar/sidebar/navigation/footer slots, primary `ScrollArea`, scroll
  ownership/reset/restoration, and scope display
- page-template families
- paginated list/table and mobile-alternative families
- form, detail, empty/error, feedback, mandatory create/update/delete
  confirmation, deterministic action-footer, and stale/conflict families
- shared entry/back, filter/URL-state, selection/bulk-action, and responsive
  behavior
- shared component names and exact ownership/override rule

Start with a shared-pattern registry:

| Pattern ID | Name/purpose | Applies to | Canonical contract section | Allowed extension points | Forbidden deviations | Owner |
| --- | --- | --- | --- | --- | --- | --- |

A screen references a shared pattern by stable ID and documents only its data,
copy, behavior, or layout differences. If two screens merely look similar but
have different semantics, do not force them into one pattern.

Each `docs/mock-ui/screens/<screen-code>-<slug>.md` must use the exact template
from Section 8.9 and contain:

1. stable identity, route/deep link, actors, tenant/scope, purpose, non-goals,
   entry/preconditions, success/exit destinations, upstream state, downstream
   effect, requirements, and owning module
2. selected master layout, page template, content-width strategy, referenced
   shared patterns, primary scroll owner, and default shadcn-vue/native
   component mapping
3. a phone-first structural wireframe with real product copy and visible shell
   context; add tablet/desktop wireframes whenever grouping, navigation,
   ordering, action placement, or information density changes materially
4. a complete content/control contract:

| Item ID | Exact label/copy | Type/component | Purpose and source/schema | Values/default/format | Visibility and permission | States/validation | Interaction/destination | Feedback/recovery | Keyboard/touch/a11y | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

5. data dependencies:

| Dependency | API/query/event ID | Trigger and parameters | Auth/scope | Loading mode/owner | Empty/not-found | Handled non-zero | Unexpected/offline | Stale/realtime/cache | Consumer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Every loading cell states `global blocking`, `local content`,
`background/noLoading`, or `none`, names the owning controller/component, and
justifies any `noLoading` escape.

6. state variants:

| State ID | Trigger/data condition | Visible composition and exact copy | Primary/secondary actions | Disabled/hidden behavior | Feedback/recovery | URL/pending-state preservation | Permission/activity | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

7. responsive adaptation:

| Viewport/mode | Composition and reading order | Top bar/sidebar/navigation/actions | Moved/condensed/hidden information | Scroll owner/overflow/sticky behavior | Touch/keyboard behavior | Evidence |
| --- | --- | --- | --- | --- | --- | --- |

8. every create/update/delete confirmation plus destructive/financial action,
   permission, privacy, localization, time/number/currency formatting,
   light/dark, zoom, reduced-motion, and accessibility decisions
9. test IDs, fixture/scenario requirements, implementation status, and named
   evidence expectations

Fixed choices must list their exact stored value, localized label, order,
default, disabled conditions, and retirement behavior. Dynamic choices must name
their API/query source, tenant/scope, search/pagination, loading, empty, error,
and stale behavior. Every interactive item names the exact action and screen
ID/route or state transition; “opens another page” is not sufficient. Keep
`Notes` for exceptional rationale—do not hide required behavior in an
unstructured paragraph there.

Use `N/A — <reason>` for an inapplicable required matrix, row, or mode; do not
silently omit it. Use exact user-facing copy where the copy is contractually
important. A wireframe label such as “Title”, “Lorem ipsum”, “Row 1”, “Card”,
or “Click here” is not acceptable product content.

ASCII/wireframes communicate hierarchy, order, and behavior; they are not
pixel-perfect styling evidence. Implementation screenshots, recordings, and
interactive prototypes are evidence linked from the contract, not replacements
for its fields, states, permissions, or interaction definitions.

Every important multi-screen workflow must have either a dedicated
`docs/mock-ui/flows/<flow-code>-<slug>.md` contract or an equally explicit flow
section linked from the registry. It must cover forward, back, cancel, retry,
handled non-zero result, unexpected failure, expired/session-revoked,
permission-changed, stale/conflict, offline/reconnect, and destructive branches
that apply. It must identify where durable state changes and what evidence
proves the complete workflow.

The UI/UX checklist must define severity, release blocking, viewport/theme
matrix, evidence naming, and `N/A` versus `Not tested`. It complements rather
than duplicates `ui-system.md`.

Every checklist item uses exactly one result:

- `Pass` — verified with the required evidence
- `Fail` — verified defect, with severity, owner, and release impact
- `N/A — <reason>` — outside approved scope, with activation trigger when it may
  become relevant
- `Not tested — <reason, owner, target, release impact>` — in scope but not
  verified

Do not generate or accept `Partial`, `Mostly complete`, or another ambiguous
status. Split a compound checklist item until each independently verifiable
claim can receive one allowed result.
