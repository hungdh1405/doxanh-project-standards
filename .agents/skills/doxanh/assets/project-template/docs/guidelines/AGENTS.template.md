# Repository agent instructions

> Materialize this template as root `AGENTS.md` when generating a project.
> Replace every angle-bracket placeholder with approved project truth, then
> remove this note. Keep the resulting file concise and link to canonical
> owners instead of copying their detailed rules.

## Scope

- These instructions apply to the complete repository.
- Active project workspace: `<project-root>`.
- Approved implementation profiles: `<active-profiles>`; API/data ownership:
  `<owned-services-or-external-contracts>`.
- Archived or legacy paths: `<archive-paths-or-none>`. Treat them as read-only
  evidence unless an approved requirement explicitly authorizes adaptation.
- Preserve unrelated user changes. Never discard, reset, delete, commit, push,
  deploy, or mutate production data without explicit authorization.

## Authority and required sources

Use `$doxanh` (the “doxanh skill”) for this project's work. Resolve
`.doxanh-project-standards.json` through the available skill's
`scripts/manage-user-skill.mjs resolve --target <project-root>` and read that
locked version. Do not silently upgrade the project to the discoverable version.

Use this order when instructions differ:

1. the user's current approved requirement
2. approved project-specific documents and ADRs
3. active modules selected from the installed `doxanh`
   skill
4. framework and library defaults

Read the canonical guideline entry from the installed standards skill,
`docs/README.md`, and the actual owning documents, source, schema, tests, and
runtime configuration for the requested scope. Conversation memory and
summaries are not implementation evidence.

Do not duplicate technical or product rules in this file. It is the mandatory
bootstrap and completion protocol; canonical documents own detail.

## Mandatory task protocol

Before editing or giving a source-grounded review:

1. Inspect repository status, exact target files, and existing user changes.
2. Identify actor, scope, capability, affected documents, and durable outcome.
   Ask when a missing decision could materially change the result.
3. Classify the change, affected boundaries, realistic regression risks, and
   whether an objective full-regression trigger applies.
4. Run `<rules-plan-command> FILES="<comma-separated-planned-paths>"`.
5. Read every selected canonical rule source and turn its stable IDs into the
   acceptance and verification plan.
6. For a bounded task or reusable-rule change, use the locked standard's
   `plan --mode task --rules <selected-rule-ids>` (or explicit `--modules`). For
   initial generation, profile changes or a complete review, use `--mode project`.
   Pass approved `--profiles`; for a mixed project use `--task-profiles` to name
   affected platforms. Flutter-only work selects native owners and native tests.
   Read every selected module completely; include proven affected dependencies.

For a complete review, use GDL-025 Section 4.19 to account for every applicable
requirement, book family, generated artifact and check. Ask about material
unknowns; do not invent answers or treat a template review as a consumer audit.

Before running tests, state the changed behavior, selected checks and excluded
unrelated checks. Validate the exported plan with the locked skill's
`verification-policy.mjs` or a behaviorally equivalent project gate. An absent
adapter is an adoption gap, not permission to run every test. After the selected
checks pass, stop testing and continue to the authorized outcome. A new user
message, commit or push does not invalidate identical-content evidence. Only a
changed boundary, relevant failure, stale proof or objective trigger reopens it.

During implementation:

- Work only in the approved scope and use current source contracts; do not
  invent fallbacks, DTOs, roles, permissions, or product rules.
- Keep each decision in one canonical owner and link from secondary documents.
- Update affected documentation and traceability in the same work slice.
- Comment non-obvious intent, not obvious syntax.
- Keep validation, authorization, scope isolation, concurrency, durable
  activity, and unexpected-failure handling on authoritative server paths.
- Load the relevant installed framework/UI skills using GDL-110 Section 17.1;
  check actual availability and official versioned docs instead of assuming
  every skill is installed or compatible.
- For UI edits, compare the approved design master and a comparable shipped
  screen; reuse their shell, components and action patterns. Omit descriptions
  and helper cards that do not help the user decide, act or recover.

Chrome/Chromium owns functional browser tests for the selected scope. Other
supported browsers and mobile profiles default to focused UI/UX compatibility.
GDL-080 Section 13.3 requires a named browser risk, observed failure or explicit
request before extra functional coverage. Full regression does not automatically
repeat every workflow in every browser.

If commit and push are already authorized, finish required scoped verification,
review the intended staged diff, commit, push, and verify the remote result.
Do not request the same permission again or rerun unchanged tests after commit.
Inspect hook-generated changes and refresh only the affected proof.

After the final maintained-file edit:

1. Run `<rules-plan-command>` again against the actual worktree.
2. Review the `VERIFY-SCOPE-001` decision, command reasons, exclusions, and
   unmatched paths. If a safe full-rule fallback remains unresolved, stop and
   correct the mapping or obtain an explicit full-regression decision; do not
   mechanically execute the fallback.
3. Run `<changed-verification-command>` plus focused live evidence required by
   every selected rule.
4. Run `<verification-freshness-command>` before claiming evidence is current.
5. Report what passed, what was not tested, and every external/manual boundary.
   Never claim `100%`, release-ready, or production-safe from partial, stale,
   mocked, screenshot-only, or lower-level evidence.
6. For a completion, readiness, all-cases, or `100%` question, apply
   `VERIFY-CLAIM-001` and lead with an unambiguous `Yes` or `No`. A `Yes` means
   100% of the explicitly declared finite scope passed for the named candidate
   and environment with no failed, skipped, stale, pending, not-tested, or open
   boundary; it never guarantees zero defects or unknown future cases.

For release or production work, run the `release:plan` contract through
`<release-plan-command>` with the exact accepted/deployed base, candidate, and
target environment before candidate verification.

Documentation-only work still runs changed-scope verification, but its
registered rules should select the exact documentation and contract commands,
not unrelated browser or production testing. Generated output must be
regenerated, checked, and proved idempotent.
In a mixed documentation-and-runtime worktree, build the plan as the union of
per-path evidence: documentation paths still contribute only documentation
evidence, while runtime commands require a changed runtime path or a recorded
dependency from one.
A changed-scope report remains current after committing exactly the verified
content: compare the complete maintained-content fingerprint and do not rerun
suites solely because `HEAD` changed. Any maintained-content change invalidates
the report. Candidate release evidence still requires the exact Git revision,
content fingerprint, immutable candidate image, and target environment. Promote
content-identical evidence after commit instead of rerunning it, then execute
only missing revision-, image-, deployment-, and live-target gates.

Release verification is always required, but the release label alone is not a
full-regression trigger. Compare the accepted or deployed base revision with
the exact candidate, run the universal release baseline, and add the union of
affected slices. Full regression is required only for an explicit request, an
initial release or missing accepted baseline, a demonstrated cross-cutting blast
radius, systemic focused-test evidence, or impact that remains unbounded after
investigation. “Continue,” “test carefully,” “deploy,” habit, or subjective
confidence does not broaden test scope.
Application source code does not automatically require full regression. Select
the owning module, each changed boundary, and demonstrably affected direct
consumers; for several modules, use the union of those focused slices. Record
why unrelated modules, actors, browsers, infrastructure, and production flows
are excluded.

## Scope-specific mandatory gates

- User-visible UI: apply the active platform and UI/UX skills and every
  applicable stable `UI-*` rule selected by the planner, including
  `UI-COPY-001`, `UI-CONTROL-001`, and `UI-DENSITY-001`; update screen/flow
  contracts, verify responsive/theme states, exercise the rendered workflow as
  the real actor, and verify durable/downstream outcomes.
- Canonical product vocabulary: enforce `UI-COPY-001` against the glossary and
  closed i18n registries for every actor, scope, entity, state, and action
  label; reject competing synonyms and raw or humanized technical keys.
- Audience-projected UI: enforce `UI-AUDIENCE-001` on the complete observable
  surface, including records, fields, actions, options, facets, suggestions,
  counts, summaries, existence signals, exports, and drill-downs. Use one
  server-authorized actor/scope/capability/state projection; never treat a
  shared component or client-side filtering as an authorization boundary.
- Actionable feedback: enforce `UI-ACTION-001` for notifications, alert cards,
  banners, inbox items, and pop-ups as well as forms and overlays; preserve a
  full readable content region, keep body copy out of the action region, and
  verify long localized content plus action placement on phone and desktop.
- User-visible temporal values: enforce `TIME-PRESENTATION-001`; resolve the
  authoritative scope/system context, use the shared formatter, prohibit raw
  display fallbacks, and run the executable source plus focused rendered proof.
- API, permission, or data: test validation, the canonical response contract,
  direct-request authorization, scope isolation, constraints, concurrency, and
  activity attribution as applicable.
- Project-book or database documentation: enforce `DOC-BOOK-001` and
  `DATA-DOC-001`; reconcile every documented current table and column with the
  canonical schema, require complete per-table what/why/when/how and lifecycle
  contracts, cover every persisted state and transition, update traceability,
  and run the maintained book/data checks. A schema dump, ERD, summary, or
  field-name list is not sufficient evidence.
- Mutation: verify confirmation, one authorized write, stale/conflict recovery,
  winning-only effects, and trusted durable activity context.
- Conditional capability: read and verify the owning capability module and its
  failure/recovery contract.
- Security-sensitive work: never expose secrets or sensitive values; run the
  approved security gates.
- Release or production: require explicit authorization, an exact clean
  candidate, a named target environment, the risk-scoped candidate plan plus
  universal release baseline, applicable manual evidence, recovery readiness,
  deployed-version confirmation, and focused live post-change verification.
  Local-only evidence cannot satisfy a production claim.

## Generic guideline protection

The reusable guideline is generic and external to the application repository.
Change it only in its standards repository for an approved cross-project rule.
Keep exact actors, brands, routes, prices, countries, providers, and state names
in project-specific documents. Do not copy guideline modules into the project.
