
### 8.7 Master layouts, master page, and application shell

This section and its responsive, scrolling, theme, zoom, keyboard, and touch
evidence are owned by `UI-RESP-001`.

Use these terms consistently:

- **Master layout** is a Nuxt layout that owns the viewport, global navigation,
  top bar, scroll regions, overlays, and stable shell slots.
- **Application master page** is the product name for the authenticated
  `default` master layout; it is not a second implementation or a copied page.
- **Page template** is the reusable content structure rendered inside the
  master layout's main `ScrollArea`.
- **Screen contract** is one route/state-specific use of a master layout and
  page template.

Do not create parallel “master layout” and “master page” implementations that
can drift. Each Nuxt file under `app/layouts/` is a thin slot-forwarding adapter
to the appropriate shared `App*Layout.vue` component. The application master
page is the `default` adapter plus `AppMasterLayout.vue`, composed from small
Vue components using `<script setup lang="ts">`. Routed pages always enter
through that slot contract.

Define only the layout families the product needs:

- `default`: authenticated application master page; mandatory for an
  authenticated web product
- `public`: public or customer-facing shell
- `auth`: constrained sign-in, recovery, and verification shell
- `workboard`: dense operational shell that retains the application navigation
  contract unless an approved focused mode explicitly suppresses it

Every authenticated routed page uses `default` or `workboard` and therefore
has:

- a top bar outside the page-content scroll region
- a default shadcn-vue `Sidebar` as the primary menu
- a `SidebarTrigger` reachable from the top bar
- one bounded main shadcn-vue `ScrollArea`
- responsive phone, tablet, desktop, keyboard, touch, light, and dark behavior

Public and authentication routes may omit the product sidebar only because
their approved layout family has different navigation semantics. A fullscreen
editor, kiosk, map, or media surface may suppress normal chrome only through a
named layout/template decision that provides an obvious exit, preserves access
to required global actions, and documents phone, tablet, desktop, keyboard,
focus, and recovery behavior.

Each master layout defines stable slots:

- skip link
- top bar/global header
- primary navigation
- current scope/account switcher when relevant
- page-level alert area
- page title and actions
- main content
- optional secondary panel
- sticky action area
- toast region
- dialog/sheet region
- global blocking-loading overlay, owned by the layout rather than supplied by
  a page
- optional footer

The outer shell and inner content width are separate decisions. A wide shell
does not justify an unstructured page.

#### 8.7.1 Default application master page

Use the default shadcn-vue composition rather than a hand-built sidebar or
scrollbar:

```text
SidebarProvider — viewport-height, overflow-bounded application root
├── AppSidebar
│   ├── SidebarHeader — product and current scope when applicable
│   ├── SidebarContent — independently scrollable navigation groups
│   └── SidebarFooter — account and infrequent global actions
└── SidebarInset — min-height zero, overflow-bounded workspace
    ├── AppTopBar — SidebarTrigger, breadcrumb/title context, global actions
    └── main — min-height zero, overflow hidden, primary landmark
        └── ScrollArea — the only primary vertical page-content scroller
            └── selected page template
AppLoadingOverlay — root/global overlay outside the routed page slot
```

The shell may use Tailwind layout utilities such as `h-dvh`, `min-h-0`,
`flex`, `grid`, `shrink-0`, `overflow-hidden`, spacing, and responsive
visibility. It must not use those classes to restyle shadcn-vue components.
Every flex/grid ancestor between the viewport-height root and `ScrollArea`
must permit shrinking; missing `min-h-0` or an unbounded intermediate wrapper
must not cause `body` or `#__nuxt` to grow with route data.

Component ownership is:

| Shell responsibility | Default component/composition | Contract |
| --- | --- | --- |
| Sidebar state/root | `SidebarProvider` | Own collapse/off-canvas state once at layout level; do not create one provider per page. |
| Primary navigation | `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarFooter` | Use route links, permission-filtered groups, active state, accessible labels, and the component's supported responsive behavior. |
| Navigation trigger | `SidebarTrigger` | Keep it in the top bar, keyboard reachable, labelled, and visible whenever the sidebar is not persistently available. |
| Top-bar controls | Semantic `header` composed with shadcn-vue `Breadcrumb`, `Button`, `DropdownMenu`, `Avatar`, `Separator`, or other default components as required | Show only real global/scope actions. Do not turn the top bar into a second page-action toolbar. |
| Main page scroll | `ScrollArea` | Own all ordinary route-content vertical scrolling inside the bounded workspace. |
| Result navigation | `Pagination` composition | Render for every page result list and follow Section 8.8.2. |
| Blocking activity | `AppLoadingOverlay` with the default `Spinner`, or `Progress` for known completion | Render once outside the routed page slot; watch the Pinia lease registry from Section 7.10 and cover the application viewport while its count is greater than zero. |
| Overlays/feedback | Default `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, `Tooltip`, `Sonner`, and related components | Remain outside the page slot when global; use the component's focus and stacking behavior. |

#### 8.7.2 Responsive shell behavior

All pages must reflow continuously; named evidence widths are samples, not the
only supported widths.

| Mode | Top bar | Sidebar/navigation | Main content |
| --- | --- | --- | --- |
| Phone | Always visible outside the main `ScrollArea`; concise context and reachable global actions | Use the default responsive/off-canvas `Sidebar` behavior opened by `SidebarTrigger`; close it after route selection and restore focus appropriately | One primary `ScrollArea`; phone-first reading order, no page-level horizontal scroll, no content hidden merely to fit |
| Tablet | Always visible; actions may condense into the correct default menu component | Deliberately choose off-canvas, collapsible icon, or persistent mode based on available width and task density | Adapt grouping and density; do not stretch the phone stack |
| Desktop | Always visible; keep global and page actions distinct | Persistent or collapsible default `Sidebar`; its open state may be persisted per user/device | Use the selected content-width strategy while keeping the main `ScrollArea` as scroll owner |
| Zoom/large text | Reflows without clipped top-bar actions | Trigger and menu remain reachable without hover | At 200% and 400% zoom, content and controls remain operable without two-dimensional page scrolling |

Responsive layout must be CSS-driven. Do not use `@nuxtjs/device`, user-agent
checks, or duplicated mobile/desktop page implementations to choose the
composition.

#### 8.7.3 Scroll ownership and navigation behavior

The master layout, not each page, creates the primary `ScrollArea`. Pages
provide content to its slot and must not add another full-height vertical
scroller. The browser document must not become longer as application result
data grows.

Use these rules:

- Keep the top bar and application sidebar outside the main page
  `ScrollArea`. `SidebarContent`, overlays, code viewers, and explicitly bounded
  secondary panels may own independent scrolling when their component contract
  requires it.
- Maintain one primary vertical scroll owner per page. Avoid nested vertical
  `ScrollArea` components because wheel, touch, keyboard, focus, and restoration
  become ambiguous.
- A table may use a deliberately bounded horizontal scroller when its approved
  phone alternative cannot preserve the task. Horizontal scrolling must never
  become document-level scrolling.
- A forward route change resets the main `ScrollArea` to the top after the new
  screen is ready and moves focus to the new main heading or primary landmark.
  Browser back/forward restores the saved position keyed by full route and
  query when that helps the workflow.
- A pagination, filter, search, sort, or page-size change scrolls the result
  region to its beginning after the result is applied. A background refresh,
  realtime patch, or non-structural row update preserves the user's position.
- For in-screen query changes, keep focus on the initiating control unless the
  documented workflow requires a focus move. Announce loading, result count,
  page changes, and failures through the appropriate accessible status region.
- Respect reduced motion for programmatic scrolling. Do not force smooth
  scrolling when reduced motion is requested.
- Expose a typed layout composable/action for reset and restoration behavior;
  feature pages must not query private `ScrollArea` DOM structure or scroll the
  browser window directly.

Every generated `docs/ui-system.md` must include a scroll-ownership table:

| Layout/template | Primary scroll owner | Allowed secondary scroll owners | Route reset | Query/data-change reset | Back/forward restoration | Focus/announcement behavior | Exception/ADR |
| --- | --- | --- | --- | --- | --- | --- | --- |

Default every routed Nuxt page to the layout-owned main `ScrollArea`. A
long-form public/document surface may use native document scrolling only when
normal browser document semantics are a product requirement and the exception
is explicit in `ui-system.md`; authenticated list, detail, form, dashboard,
settings, report, and workboard pages do not use that exception.

### 8.8 Page templates

Use a small reusable template set.

| Template | Phone | Tablet | Desktop |
| --- | --- | --- | --- |
| List/index | Essential filters, cards or compact rows, reachable primary action | Filter region plus list/table | Structured filter bar, table, pagination, bulk actions |
| Detail | Summary first, grouped sections, sticky primary action if needed | Summary plus grouped content | Summary/detail split or primary content plus secondary panel |
| Create/edit | One clear section at a time; sticky or footer actions | Grouped form sections | Constrained form or structured editor with section navigation |
| Dashboard | Highest-priority task and few key summaries | Two-zone grid | Intentional modules, wider data views, no decorative card wall |
| Settings | Grouped categories and clear save scope | Category navigation plus form | Sidebar/local navigation plus constrained content |
| Workboard | Priority queue with minimal secondary context | Multiple useful zones | Dense multi-zone operational view |
| Report | Summary and simplified chart/table | Expanded comparisons | Full data table/chart with accessible detail alternative |
| Wizard | Progress, back, save/recovery | Same workflow with wider grouping | Constrained step content; do not stretch controls |
| State screen | Message, one action, one short recovery line | Constrained | Constrained; never fill space with explanation cards |

Rules:

- Render every page template inside its selected master layout's primary scroll
  owner; do not let a page resize the application shell or create document
  scrolling.
- Choose a content-width strategy: narrow, medium, wide structured, split detail,
  or workboard.
- Give each state one obvious primary action.
- Separate summary, editing, history, notes, operations, and destructive actions
  when their purpose or risk differs.
- Do not use one giant card for a complex screen.
- Do not fragment a simple screen into decorative cards.
- Tabs switch peer sections; accordions reveal optional detail; cards group
  content; split layouts pair primary work with secondary context.
- Tab, filter, toggle, and chip rows must not clip, hide actions, or create
  accidental page-level horizontal scrolling. Choose deliberate wrapping,
  component-level scrolling, Select, or a visible More menu according to the
  interaction semantics.
- Tables need a defined phone alternative or a deliberately controlled data
  scroller.
- Every page result list is paginated with the default shadcn-vue `Pagination`;
  pagination, sorting, filtering, active-filter summary, reset, empty, loading,
  error, and bulk-action behavior must be explicit.

#### 8.8.1 Copyable page-template checklists

Use these checklists in `docs/ui-system.md` and important mock screens.

List/index:

- [ ] Route, actor, scope, and requirement IDs are named.
- [ ] Title, result count, and one primary action are defined by state.
- [ ] Search, filters, allowed filter values, active-filter summary, and reset
  behavior are defined.
- [ ] Sort fields, default order, pagination or cursor behavior, and URL-state
  behavior are defined.
- [ ] The default shadcn-vue `Pagination` remains present for zero, one, and
  multiple result pages with correct disabled/current state and result summary.
- [ ] Row/card identity, status, secondary data, row actions, and bulk actions
  are defined.
- [ ] Desktop table and phone alternative or controlled scroller are defined.
- [ ] Loading, empty-unfiltered, empty-filtered, error, permission, and stale
  states are defined.

Data table/list:

- [ ] The document states why the content is truly tabular and selects one
  deliberate pattern: semantic table, mobile list/card transformation,
  controlled horizontal scroller, or specialized data grid.
- [ ] Web uses the default shadcn-vue `Table` structure for normal tabular data.
  A data-grid abstraction is added only for required interaction complexity;
  a collection of generic `div` elements does not imitate a semantic table.
- [ ] Every displayed or available column has this contract:

| Column ID | Exact header | User meaning/source field | Format and timezone/locale | Alignment/width/overflow/null | Sort | Filter/search | Permission/privacy | Phone | Tablet | Desktop | Interaction/a11y | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- [ ] The primary row identity and stable row key are named; grouping,
  hierarchy, expansion, totals, and comparison baselines are explicit when used.
- [ ] Default sort and deterministic tie-breaker, server/client ownership,
  supported sort/filter/search fields, option sources, apply/reset behavior,
  URL persistence, result count, page/cursor size, and maximum safe result
  behavior are defined.
- [ ] Row click, explicit details link, inline actions, overflow menu,
  selection, select-all scope, bulk action, disabled action, and mandatory
  create/update/delete confirmation behavior cannot conflict.
- [ ] Hidden columns do not carry unauthorized data to the client. Field-level
  permission and export visibility match API filtering and the permissions
  matrix.
- [ ] Phone behavior identifies which information remains visible, moves into a
  secondary line/details sheet, or requires controlled scrolling. Critical
  identity, state, and primary action must not disappear merely to make the
  table fit.
- [ ] The accessible name/caption, semantic header/body/row/cell structure,
  header scope, announced sort state, keyboard order, selection label, focus
  restoration, and screen-reader meaning do not depend on color, hover, or
  tooltip-only descriptions.
- [ ] Loading skeleton, empty-unfiltered, empty-filtered/search, partial data,
  permission, offline, stale/reconnecting, unexpected failure, and pagination
  failure preserve the table/list region and provide the correct recovery.
- [ ] Sticky headers/columns, resizing, virtualization, infinite scrolling, live
  row updates, animation, and row reordering are used only when required and
  specify focus, scroll, reduced-motion, stale-update, and performance behavior.
  Infinite scrolling and “Load more” do not replace result pagination.
- [ ] Representative fixtures cover zero, one, one full page, multiple pages,
  maximum safe page, long translated text, nulls, extreme numbers/dates,
  duplicate-looking identities, restricted fields, and concurrent updates.

Detail:

- [ ] Entry/back behavior, identity, state, and primary action are defined.
- [ ] Summary, main content, secondary context, history, and audit placement are
  defined.
- [ ] Edit, destructive, conflict, expired, and permission-gated actions are
  defined.
- [ ] Phone action reachability, tablet grouping, and desktop split behavior are
  defined.
- [ ] Loading, not found, wrong scope, stale revision, and dependency failure
  states are defined.

Create/edit:

- [ ] Create versus edit copy and submit behavior are explicit.
- [ ] Field groups, labels, descriptions, types, allowed values, defaults, and
  server validation are defined.
- [ ] Required, optional, disabled, read-only, and permission-gated fields are
  distinguishable.
- [ ] Inline errors, error summary, first-invalid focus, attempted-value
  preservation, and server-error mapping are defined.
- [ ] Submit progress, double-submit protection, success destination, unsaved
  changes, conflict, and retry behavior are defined.
- [ ] Phone section flow and action reachability remain usable without turning
  the form into an explanation-heavy wizard.

Dashboard/workboard/report:

- [ ] The highest-priority task or operational state appears first.
- [ ] Every card, metric, chart, or queue answers a named user question.
- [ ] Data timestamp, scope, filters, refresh behavior, and stale state are
  visible where needed.
- [ ] Charts have accessible table or textual alternatives.
- [ ] Empty canvas space is not filled with decorative summaries or help cards.
- [ ] Tablet and desktop use intentional zones; they are not stretched phone
  stacks.

#### 8.8.2 Mandatory result-list pagination

Every route-level collection that can grow uses pagination. This includes
tables, card lists, search results, activity/history, queues, reports, and
administration indexes. A small fixed navigation menu, static choice group, or
bounded set embedded in a detail screen is not a result list.

Use the default shadcn-vue `Pagination` composition. Do not build pagination
from custom buttons or make infinite scrolling, “Load more”, virtualization,
or client slicing the default navigation model.

The contract is:

- The API owns filtering, deterministic sorting, and pagination for any
  server-backed or growing collection. Do not paginate only the subset already
  fetched by the client.
- Keep page/cursor, page size, search, filters, and sort in the route query so a
  refresh, link, and back/forward navigation reproduce the result view.
- Reset to the first page when search, filter, sort, scope, or page size changes
  unless a documented cursor contract proves a different safe behavior.
- Define allowed page sizes and a server-enforced maximum. Never offer “All”
  for an unbounded collection.
- Render result count and current position. Keep the pagination region present
  for zero or one page using correct empty/current/disabled states so the layout
  does not jump and the contract remains predictable.
- Phone uses the compact supported composition with clearly labelled previous,
  current-position, and next controls. It must not overflow horizontally or
  require tiny touch targets.
- Disable unavailable previous/next controls, expose the current page
  semantically, provide accessible names, and announce page/result changes.
- A page change retains the shell and page template, shows loading within the
  result region, prevents stale responses from replacing newer ones, and then
  scrolls the result region to its beginning according to Section 8.7.3.
- Empty, filtered-empty, out-of-range, permission-changed, stale, offline,
  handled non-zero, unexpected failure, and pagination-request failure states
  keep the result and pagination regions structurally stable and provide the
  documented recovery.
- Selection and bulk actions must define whether selection covers the current
  page or all matching results. Never imply all-results selection when only the
  visible page is selected.
- The API envelope keeps pagination metadata inside `data` according to the
  canonical API contract; the UI must not infer totals or next-page
  availability from rendered row count.

### 8.8.3 Audience separation and management information architecture

This section is the canonical contract for `UI-AUDIENCE-001`.

Every routed surface has one primary audience and one primary job. Reusing a
domain use case does not justify reusing the same page composition for people
with different goals or permissions.

- Separate public/self-service, operational, administrative, and device/display
  surfaces through the approved route and layout contracts when their tasks
  differ. Do not expose setup, onboarding, assignment, internal diagnostics, or
  staff-only controls on a public task surface.
- Show only the context the current person needs. Do not narrate their role back
  to them or explain internal security requirements as welcome-page content.
- Use the entity detail page as the canonical hub for management scoped to one
  entity: summary, status, owners/memberships, current and scheduled access,
  settings, history, and allowed actions. A list/index supports discovery,
  filtering, bulk actions, and entry to detail; it is not a disconnected second
  management system.
- Keep reusable definitions in their catalog surface and assignee-specific
  values in the assignee detail surface. For example, a reusable offering and
  one subject's effective access period are different records and actions.
- Give one logical mutation one canonical contract and server use case. A
  contextual shortcut may open that same action; it must not implement a
  competing dialog, result code, or persistence path.
- Default lifecycle lists to the state that supports the primary task, commonly
  active/current records, and provide an explicit visible filter for scheduled,
  inactive, expired, revoked, archived, or all states when authorized. Never
  make hidden historical state impossible to find.
- Use precise product nouns and verbs. Avoid vague labels such as `Access`,
  `Manage`, `Stop`, or `End` when the action actually suspends an account,
  expires an assignment, disables a resource, or revokes a credential.
- When one actor can change scope, keep the current scope visible and make
  switching deliberate. A route, store, or stale cached selection must not
  silently carry data or mutations into another scope.

Every important screen contract must show where its primary and secondary
actions live and why. A control is prohibited when its handler, permission,
result feedback, and test are undefined.

### 8.8.4 Long collections, categorized discovery, and stable item anatomy

This section is the canonical contract for `UI-COLLECTION-001`.

Pagination prevents unbounded data transfer but does not by itself make a long
collection easy to use.

- Define the collection's discovery model: search, category/group navigation,
  filters, deterministic sort, active-filter summary, reset, pagination, and
  empty/error recovery.
- For a long categorized collection, use default `Accordion`/`Collapsible`,
  category navigation, or another approved progressive-disclosure pattern so a
  person is not forced through one uninterrupted list. Preserve search results
  across categories and make collapsed result matches discoverable.
- Do not hide a small, immediately scannable collection behind unnecessary
  accordions. Progressive disclosure follows real hierarchy and volume, not a
  desire to make the first screenshot shorter.
- Keep search/filter controls reachable while browsing when the workflow needs
  repeated refinement. Sticky behavior must remain inside the documented scroll
  owner and must not cover content or the keyboard on mobile.
- Use a stable item/card anatomy for repeated content: identity, status,
  essential metadata, variable description/detail, value/summary, and actions
  occupy consistent semantic regions. Variable text must wrap, clamp with an
  accessible reveal, or reflow without moving an action into an ambiguous
  column.
- Align repeated actions and numeric values deliberately, but do not force
  equal heights by clipping required meaning. Test missing images, long titles,
  long translations, null metadata, extreme values, and different action sets.
- Sort server-backed results with a documented stable tie-breaker. Do not rely
  on database insertion order or incidental client object order.
- Preserve the current query/category/filter/page in the URL where revisit,
  refresh, and sharing are useful. A detail-back transition restores the
  collection state and main `ScrollArea` position.
- Keep primary task state, such as a selection or pending draft, visible and
  reachable without creating a second page-level scroller.

Playwright evidence for an important collection must use deliberately uneven
content and enough records to prove search, grouping, pagination, back/forward,
responsive reflow, keyboard/touch use, and stable action placement. A tidy
three-row seed is insufficient evidence.

### 8.9 Screen definition template

Use this exact structure for every important screen. Remove an optional section
only when the approved template permits it; otherwise write
`N/A — <reason>`.

````md
# <SCR-ID> <Screen name>

> Chapter: 23.xx
> Lifecycle: Draft | In review | Approved | Superseded | Deprecated
> Implementation: Proposed | Not started | In progress | Implemented | Verified | N/A
> Owner: <role/person>
> Reviewers: <roles/people>
> Last reviewed: YYYY-MM-DD
> Canonical for: <screen composition and behavior>
> Depends on: <product/UI/API/data/permission links>
> Produces: <source/test/evidence consumers>
> Evidence: <links or Not tested — reason, owner, target>

[Previous](../...) · [Mock UI](../README.md) · [Next](../...)

## 1. Contract summary

| Field | Contract |
| --- | --- |
| Screen ID | `<SCR-ID>` |
| Route/deep link | Exact route pattern |
| Primary audience/surface | Exact project actor plus public/self-service/operational/administration/device surface |
| Actors and tenant/scope | Named actors and authoritative scope source |
| Owning module | Stable module ID/name |
| Requirement/workflow IDs | Links |
| Purpose | One task/outcome statement |
| Non-goals | Behavior intentionally not on this screen |
| Entry points/preconditions | Routes, states, permissions |
| Success/exit destinations | Exact screen IDs/routes |
| Upstream state | State required before entry |
| Downstream effect | Durable or navigation effect |
| Master layout/page template | Named shared layout/template |
| Shared patterns | Stable IDs/links |
| Content-width strategy | Narrow/medium/wide/split/workboard |
| Primary scroll owner | Layout-owned `ScrollArea` or approved documented exception |
| Scroll reset/restoration | Route, query/data change, background update, and back/forward behavior |
| Primary action by state | Named action or none with reason |
| Canonical action ownership | Entity detail, list/bulk, catalog, settings, or another named owner; shortcuts link to the same contract |

## 2. Composition

### 2.1 Phone-first wireframe

```text
Show the real top bar, responsive sidebar trigger/navigation state, primary
ScrollArea boundary, heading, content order, real copy, actions, pagination,
feedback region, and sticky/footer behavior.
```

### 2.2 Tablet adaptation

Add a wireframe when structure changes; otherwise state the exact adaptation.

### 2.3 Desktop adaptation

Add a wireframe when structure changes; otherwise state the exact adaptation.

## 3. Content and controls

| Item ID | Exact label/copy | Type/default component | Purpose and source/schema | Values/default/format | Visibility/permission | States/validation | Interaction/destination | Feedback/recovery | Keyboard/touch/a11y | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Every rendered action must name a real handler/use case or exact navigation
destination. A button that merely closes an overlay is labelled as dismissal;
an action label must not close with no action, request, or visible state change.

## 4. Data dependencies

| Dependency | API/query/event ID | Trigger/parameters | Auth/scope | Loading mode/owner | Empty/not-found | Handled non-zero | Unexpected/offline | Stale/realtime/cache | Consumer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Use `global blocking`, `local content`, `background/noLoading`, or `none`;
identify the owner and justify every `background/noLoading` choice.

## 5. Table/list contract

Write `N/A — not a table/list screen` or complete all applicable rows.

### 5.1 Pattern and behavior

- Pattern: semantic table | mobile list/card | controlled scroller | data grid
- Row identity/key:
- Default sort and deterministic tie-breaker:
- Search/filter ownership and URL state:
- Pagination/cursor/page-size/count behavior:
- shadcn-vue `Pagination` zero/one/multiple-page behavior:
- Main `ScrollArea` result-reset and back/forward restoration behavior:
- Row/open/action/selection/bulk-action behavior:
- Loading/empty/error/stale/live-update behavior:
- Performance/virtualization threshold:

### 5.2 Columns

| Column ID | Exact header | User meaning/source field | Format/timezone/locale | Alignment/width/overflow/null | Sort | Filter/search | Permission/privacy | Phone | Tablet | Desktop | Interaction/a11y | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 6. Form contract

Write `N/A — not a form screen` or complete all applicable rows.

| Field ID | Exact label/help/example | Component/input mode | Source/default | Required/allowed/normalization | Client + Zod/server validation | Editable/read-only/permission | Error/result mapping | Autofill/focus/keyboard/a11y | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Define submit progress, duplicate prevention, idempotency, attempted-value
preservation, first-invalid focus, error summary, unsaved changes,
stale/conflict behavior, success copy, destination, and the exact Section 6.7
confirmation title, description, target/scope, cancel action, and confirm label.
Reference the shared Section 8.11.2 action-footer pattern and document only an
approved exception; do not redefine action order or responsive placement per
screen.

## 7. State variants

| State ID | Trigger/data condition | Visible composition and exact copy | Primary/secondary actions | Disabled/hidden behavior | Feedback/recovery | URL/pending-state preservation | Permission/activity | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Cover applicable loading, empty-unfiltered, empty-filtered, not-found,
validation, handled non-zero, unexpected, permission, expired/session-revoked,
offline/reconnecting, stale/conflict, success, create/update/delete
confirmation, destructive-confirmation, and partial-data states.

## 8. Responsive, navigation, and scroll adaptation

| Viewport/mode | Composition/reading order | Top bar/sidebar/navigation/actions | Moved/condensed/hidden information | Scroll owner/overflow/sticky behavior | Touch/keyboard behavior | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Phone | | | | | | |
| Tablet | | | | | | |
| Desktop | | | | | | |
| 200%/400% zoom | | | | | | |

## 9. Feedback, permission, privacy, and accessibility

- Feedback surfaces and exact copy:
- Permission IDs and server enforcement links:
- Field/action visibility and revocation behavior:
- Sensitive data/redaction/export behavior:
- Heading/landmark/focus order:
- Accessible names, descriptions, live regions, and error association:
- Sidebar trigger/close focus, route focus, and scroll reset/restoration:
- Light/dark/contrast and non-color meaning:
- Localization, long text, date/time/number/currency:
- User-task copy review: no role narration, internal rationale, implementation
  language, or redundant `default` wording:
- Reduced motion and animation purpose:

## 10. Verification

| Test/evidence ID | Scenario/fixture | Viewport/theme/input | Expected contract | Test path | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- |

Required evidence names the environment, actor/scope, data origin, date, and
whether it proves visual, interaction, persisted data, or end-to-end behavior.

## 11. Open questions and change history

| Question/change | Impact | Owner | Target/review date | Status/decision |
| --- | --- | --- | --- | --- |
````

An approved screen file has no unresolved placeholder text. An implemented
screen is not `Verified` until its named states, permissions, responsive modes,
and important interactions have current evidence.
