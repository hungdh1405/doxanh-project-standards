# New Project Guideline

> Chapter: Governance standard (outside generated project-book sequence)
> Lifecycle: Approved
> Implementation: N/A — reusable project standard
> Owner: Project owner
> Reviewers: Product, design, engineering, security, QA, and operations leads
> Profiles: Shared, Nuxt web, Flutter native
> Last reviewed: 2026-08-24
> Canonical for: Generating, reviewing, implementing, verifying, and operating a Nuxt project book with optional Flutter delivery
> Depends on: None
> Produces: `docs/book-manifest.yaml`, `docs/book-manifest.schema.json`, the project-specific chapter family, and the documentation command contract in Section 4
> Evidence: Source and document-family audit performed 2026-07-30; each generated project book requires its own implementation evidence

> Opinionated standard for Nuxt web applications and optional Flutter native
> clients.
>
> Baseline: Nuxt 4, Vue 3, TypeScript, shadcn-vue, Tailwind CSS, PostgreSQL,
> Drizzle ORM, Redis, BullMQ, GSAP, and a separately bounded Flutter client when
> native mobile delivery is required.

## 1. Purpose and authority

This standard has two platform profiles:

- **Nuxt web profile:** the required default for browser and full-stack delivery
- **Flutter native profile:** conditional, used only when an installed native
  mobile client is part of the approved product scope

Shared product, API, data, security, observability, documentation, and delivery
rules apply to both profiles. Keep platform-specific libraries and UI systems
inside their own profile.

| Scope | Sections |
| --- | --- |
| Shared product, documentation, discovery, and architecture | 1–6 |
| Nuxt web engineering and web UI/UX | 7–8 |
| Flutter native engineering and native UI/UX | 9 |
| Shared API, security, observability, testing, delivery, and governance | 10–19 |

Use this standard to move a project from product discovery through design,
implementation, verification, deployment, and operation. It applies to human
contributors and AI agents.

The order of authority is:

1. approved product requirements
2. approved project-specific decisions and ADRs
3. this guideline
4. framework and library defaults

If a project needs to deviate from this standard, record the reason, tradeoffs,
owner, and review date in `docs/adr/`. Do not create silent exceptions.

Every exception must name the exact rule, affected profile/module/routes,
evidence that the normal rule cannot satisfy the requirement, alternatives,
security/data/operational impact, compensating controls, approver, tests,
expiry/review trigger, and migration or removal plan. An exception changes only
its named scope; it does not weaken the reusable baseline or create precedent.
An ADR cannot authorize a cross-tenant leak, secret exposure, unaudited
high-risk mutation, data corruption, fabricated verification, or violation of
applicable legal/compliance obligations.

The words **must**, **should**, and **may** are intentional:

- **must** means release-blocking unless an ADR explicitly approves an exception
- **should** means the default, with a documented reason required to differ
- **may** means optional and driven by a real product need

Interpret rules by type:

| Type | Wording | Meaning |
| --- | --- | --- |
| Prohibited | `must not`, `never`, `do not` | Unsafe or unsupported behavior. Any exception needs the approval path required by its severity. |
| Required default | `must`, `use`, `keep` | The project baseline. A different implementation needs an ADR or an explicitly documented project decision. |
| Preferred default | `should`, `prefer`, `avoid` | The normal choice. A documented local reason may justify another choice. |
| Conditional | `when`, `if`, `only when`, `where applicable` | Active only when the named capability, risk, platform, or workflow exists. |
| Review heuristic | questions, examples, approximate ranges | A quality check, not a universal implementation contract. |

Do not turn a semantic or capability-dependent choice into a universal
prohibition. Release checklists should reference the canonical rule instead of
restating a stricter or weaker variant.

### 1.1 Genericity boundary and project materialization

This file defines reusable governance and engineering rules. It must not become
the product specification for the project that happened to reveal a useful
lesson.

- Keep project names, branded roles, routes, hostnames, countries, currencies,
  prices, provider choices, domain states, and operational labels in the
  generated project book.
- Express reusable lessons here as capability- or risk-based contracts. A
  payment rule applies only when payments exist; a device-session rule applies
  only when the product limits devices; a public-entry rule applies only when a
  public or shareable entry exists.
- Examples illustrate structure and are never approved project truth. A
  generator must replace every example and placeholder with the project's exact
  vocabulary, or invoke Section 4.18 when the decision is material and unknown.
- A reference project is evidence of a problem or pattern, not a schema, role
  model, route map, price model, or visual design to copy.
- Project-specific documents may be stricter than this standard when the
  product risk requires it. They must name the scope and rationale; they must
  not silently rewrite this generic source.

At project creation, maintain a capability-decision table in
`docs/product-spec.md` and mirror document activation in the book manifest:

| Capability | Active / N/A / undecided | Exact project meaning | Canonical chapter | Activation trigger | Decision owner |
| --- | --- | --- | --- | --- | --- |

An `undecided` material capability blocks the affected design and implementation
gate. It is not permission for an AI or developer to select convenient behavior.

### 1.2 Required application sequence

Apply this standard in this order:

1. select the active Nuxt/Flutter profiles and capability decisions
2. generate the complete ordered book skeleton and honest conditional stubs
3. materialize exact actors, scopes, workflows, states, permissions, routes,
   data, integrations, and operational ownership
4. approve product truth, screen/flow contracts, and system contracts through
   the Section 4 gates
5. implement one complete vertical slice through UI, server, persistence,
   authorization, activity, tests, and evidence
6. expand only through approved slices and keep the book synchronized

File existence is not completion. No broad UI generation begins before product
truth and the relevant screen/flow contracts are reviewable. No protected write
is complete before direct authorization, concurrency, durable effect, and
activity proof exist.

## 2. Non-negotiable principles

### 2.1 Product truth before implementation

- Define actors, permissions, workflows, states, outcomes, and exclusions before
  building many pages.
- Keep one canonical owner for every important decision.
- Do not let a component, route, database table, or AI-generated screen invent
  business behavior.
- Build thin vertical slices that prove visible UI, server behavior, persistence,
  permissions, and tests together.

### 2.2 Mobile-first always

- Design the phone composition first, then deliberately adapt it for tablet and
  desktop.
- Mobile-first does not mean one endless column at every viewport.
- Tablet must not be a stretched phone layout.
- Desktop must not be a widened mobile stack surrounded by dead space.
- Every important Nuxt screen must define and verify phone, tablet, desktop,
  light, and dark behavior.
- Every important Flutter screen must cover the supported adaptive sizes,
  orientations, themes, text scales, and platform behavior defined in Section 9.

### 2.3 Default platform components before custom UI

- Use the default shadcn-vue component that matches the interaction.
- Compose shadcn-vue primitives before creating custom controls.
- Use built-in variants and sizes before adding classes.
- Keep components visually close to the official shadcn-vue examples: compact,
  clear, and operational.
- Do not restyle shadcn-vue components page by page.
- In Flutter, use default Material 3 or platform-appropriate widgets before
  creating custom controls.

### 2.4 Server truth over client convenience

- Authentication, authorization, validation, state transitions, and ownership
  checks must be enforced on the server.
- Client validation and hidden controls improve UX but are not security
  boundaries.
- PostgreSQL is the durable source of truth. Redis, Pinia, and browser/mobile
  storage are not.

### 2.5 Safe and observable by default

- Sensitive actions must fail closed and be auditable.
- Background work must be idempotent because queue delivery is at least once.
- Logs, metrics, traces, audit records, health checks, backups, and restore tests
  are product requirements, not later polish.
- Product UI may display only the personal data the authorized workflow
  requires; minimize, mask, and scope it according to the privacy contract.
- Never expose secrets, tokens, internal stack traces, or unnecessary personal
  data in client responses, queue payloads, generated documentation, or
  user-visible diagnostics.
- Restricted server-side error telemetry may contain a stack trace after
  redaction. Protect it with explicit access, retention, and export controls.

### 2.6 Real content, real states, real proof

- Do not ship lorem ipsum, dummy explanation cards, fake metrics, or internal
  implementation language.
- Every important screen must handle its relevant loading, empty, error,
  permission, stale/conflict, success, and destructive-confirmation states.
- A visual screenshot proves appearance only. High-value workflows also need
  saved-state and downstream-effect proof.
