# Repository agent instructions

> Materialize this template as root `AGENTS.md` when generating a project.
> Replace every angle-bracket placeholder with approved project truth, then
> remove this note. Keep the resulting file concise and link to canonical
> owners instead of copying their detailed rules.

## Scope

- These instructions apply to the complete repository.
- Active project workspace: `<project-root>`.
- Archived or legacy paths: `<archive-paths-or-none>`. Treat them as read-only
  evidence unless an approved requirement explicitly authorizes adaptation.
- Preserve unrelated user changes. Never discard, reset, delete, commit, push,
  deploy, or mutate production data without explicit authorization.

## Authority and required sources

Use this order when instructions differ:

1. the user's current approved requirement
2. approved project-specific documents and ADRs
3. active modules selected from `docs/guidelines/README.md`
4. framework and library defaults

Read the canonical guideline entry, `docs/README.md`, and the actual owning
documents, source, schema, tests, and runtime configuration for the requested
scope. Conversation memory and summaries are not implementation evidence.

Do not duplicate technical or product rules in this file. It is the mandatory
bootstrap and completion protocol; canonical documents own detail.

## Mandatory task protocol

Before editing or giving a source-grounded review:

1. Inspect repository status, exact target files, and existing user changes.
2. Identify actor, scope, capability, affected documents, and durable outcome.
   Ask when a missing decision could materially change the result.
3. Run `<rules-plan-command> FILES="<comma-separated-planned-paths>"`.
4. Read every selected canonical rule source and turn its stable IDs into the
   acceptance and verification plan.
5. For new-project generation or reusable-guideline changes, also run the
   profile/capability plan from `docs/guidelines/README.md` and read every
   returned module completely.

During implementation:

- Work only in the approved scope and use current source contracts; do not
  invent fallbacks, DTOs, roles, permissions, or product rules.
- Keep each decision in one canonical owner and link from secondary documents.
- Update affected documentation and traceability in the same work slice.
- Comment non-obvious intent, not obvious syntax.
- Keep validation, authorization, scope isolation, concurrency, durable
  activity, and unexpected-failure handling on authoritative server paths.

After the final maintained-file edit:

1. Run `<rules-plan-command>` again against the actual worktree.
2. Run `<changed-verification-command>` plus focused live evidence required by
   every selected rule.
3. Run `<verification-freshness-command>` before claiming evidence is current.
4. Report what passed, what was not tested, and every external/manual boundary.
   Never claim `100%`, release-ready, or production-safe from partial, stale,
   mocked, screenshot-only, or lower-level evidence.

Documentation-only work still runs changed-scope verification, but its
registered rules should select the exact documentation and contract commands,
not unrelated browser or production testing. Generated output must be
regenerated, checked, and proved idempotent.

## Scope-specific mandatory gates

- User-visible UI: apply the active platform and UI/UX skills and every
  applicable stable `UI-*` rule selected by the planner, including
  `UI-COPY-001`, `UI-CONTROL-001`, and `UI-DENSITY-001`; update screen/flow
  contracts, verify responsive/theme states, exercise the rendered workflow as
  the real actor, and verify durable/downstream outcomes.
- API, permission, or data: test validation, the canonical response contract,
  direct-request authorization, scope isolation, constraints, concurrency, and
  activity attribution as applicable.
- Mutation: verify confirmation, one authorized write, stale/conflict recovery,
  winning-only effects, and trusted durable activity context.
- Conditional capability: read and verify the owning capability module and its
  failure/recovery contract.
- Security-sensitive work: never expose secrets or sensitive values; run the
  approved security gates.
- Release or production: require explicit authorization, a clean candidate,
  complete automated and manual evidence, recovery readiness, and live
  post-change verification.

## Generic guideline protection

The reusable guideline is generic. Change it only for an approved cross-project
rule. Keep exact actors, brands, routes, prices, countries, providers, and state
names in project-specific documents. Keep any historical guideline path as a
non-duplicating reference to `docs/guidelines/README.md`.
