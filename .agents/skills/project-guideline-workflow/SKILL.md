---
name: project-guideline-workflow
description: Install, update, or apply the Doxanh modular new-project standard; generate a project book; change reusable guideline modules; materialize AGENTS.md; or review implementation compliance. Use for projects adopting this packaged workflow. Do not treat the skill as a substitute for project truth or executable gates.
---

# Project Guideline Workflow

Use the repository contract as authority. This skill distributes, discovers,
and applies that contract; it does not replace project truth or verification.

## Bootstrap or update

The GitHub standards repository is the only editable skill and guideline
source. A consuming project contains only a reference-only version lock, never
copied guideline modules or a repository-scoped copy of this skill. The
user-level skill is a symlink to the selected standards checkout so same-named
skills are not duplicated.

For a project without `.doxanh-project-standards.json`, run from a released
standards checkout:

```bash
make install \
  PROJECT_ROOT=<application-workspace> \
  REPO_ROOT=<git-repository-root>
make skill-sync
```

For an existing locked installation, use `check` before work and `update` only
when the user has approved adopting the currently available standard version.
The updater verifies old copied files before removing them during migration and
must refuse local divergence. Never bypass that guard by deleting or copying
assets manually.

Use the consuming repository's `make standards-sync` facade when present. It
must refresh a dedicated clean cache from the approved GitHub repository/ref,
then call this package's `make sync`. Do not point the user skill at a mutable
application repository or retain a same-named repository skill alongside it.

After first installation, materialize the installed skill asset
`assets/project-template/docs/guidelines/AGENTS.template.md` as root
`AGENTS.md`, resolve every placeholder from approved project truth, and
register the project's executable rule gates. Do not overwrite an existing
`AGENTS.md` automatically and do not copy the remaining guideline package.

## Workflow

1. Read every applicable `AGENTS.md`, inspect repository status, run the
   reference-lock and user-skill integrity checks, and preserve unrelated work.
2. Read the canonical guideline entry and manifest from this installed skill,
   then read the project-book entry and actual owning product/source/test files
   for the requested scope.
3. Run the repository rule planner with every anticipated project-relative
   path. For new-project generation or reusable-guideline changes, also run the
   profile/capability module planner from the standards checkout and read every
   selected module completely.
4. Apply `VERIFY-SCOPE-001`: record the change classification, affected
   boundaries and risks, selected and excluded evidence with reasons, and the
   objective full-regression decision. A safe full-rule fallback is an
   unresolved mapping state; do not execute it until the mapping is fixed or an
   explicit full-regression trigger is recorded. For application source changes,
   build a dependency-closed slice from the owning module, changed interfaces or
   trust boundaries, and demonstrably affected direct consumers. Multiple
   modules contribute the union of their slices. Do not select every suite merely
   because at least one source file changed.
5. Turn selected stable rule IDs into acceptance criteria and verification.
   Apply `DOC-BOOK-001` whenever project-book chapters, manifest/navigation,
   glossary, traceability, or durable workflow explanations change. Review the
   complete affected contract, including every actor, status, transition,
   result, recovery path, and source/evidence link; do not document only the
   state or paragraph that triggered the request. Apply `DATA-DOC-001` whenever
   persisted data or its documentation changes. Reconcile every current table
   and physical column with the canonical schema and require each DATA section
   to explain what one row means, why it exists, when and how it is used and
   changed, full fields, relationships, constraints, indexes, lifecycle,
   examples, and implementation evidence. Run `docs:data:check`; a migration or
   ORM definition alone is not a human-readable database contract.
   For Nuxt/Vue UI, load the applicable Vue, shadcn-vue, and UI/UX skills and
   apply `UI-CONTROL-001` whenever a choice control is designed, implemented,
   or reviewed. Apply `UI-COPY-001` to the complete rendered-copy inventory and
   require glossary-owned canonical actor/scope/entity/state/action labels plus
   executable rejection of competing synonyms and raw/humanized keys. Apply
   `DATA-REFERENCE-001` whenever a retire, archive, disable,
   restore, or permanent-delete command can affect referenced durable records;
   require the documented dependency classification, server impact preflight,
   atomic enforcement, rendered resolution/recovery, and focused proof.
   Apply `TIME-PRESENTATION-001` whenever temporal data is rendered, edited,
   transported, exported, printed, or reviewed; require the authoritative
   scope/system presentation context, shared formatter/input boundaries, no raw
   display fallback, and executable source plus focused rendered proof.
   Apply `UI-ACTION-001` whenever a form, overlay, actionable notification,
   alert card, banner, inbox item, or pop-up exposes an action; keep message
   content in its own readable region and actions in a separate responsive
   action-only region, then prove long localized content at phone and desktop
   widths.
   Apply `UI-AUDIENCE-001` whenever a surface renders scoped records, fields,
   actions, filters, options, facets, suggestions, counts, summaries, exports,
   or drill-downs. Require one server-authorized actor/scope/capability/state
   projection for the complete observable surface; shared components and
   client-side filtering are never authorization boundaries.
6. Change each rule or product decision in its single canonical owner. Link
   from secondary documents, update traceability, and materialize applicable
   rules in the project's machine-readable gate manifest with real evidence.
7. Regenerate derived artifacts and prove idempotence. Run the final rule plan
   against the actual worktree, changed-scope verification, focused live proof
   selected by the rules, and the verification-freshness check. Bind ordinary
   changed-scope evidence to the complete maintained-content fingerprint. A
   commit-only transition with identical maintained content must preserve that
   evidence and must not trigger a rerun; an actual content change must make it
   stale. Keep full release evidence strictly bound to the exact Git revision,
   content fingerprint, and immutable candidate image.
8. Apply `VERIFY-CLAIM-001` whenever the user asks whether work is complete,
   fully tested, production-ready, safe to release, covers all cases, or is
   `100%`. Lead with an unambiguous `Yes` or `No`. Say `Yes` only for 100% of an
   explicitly declared finite acceptance scope bound to the named candidate and
   environment, with current evidence and no failed, skipped, stale, pending,
   not-tested, or otherwise open boundary. Otherwise say `No` first, then give
   the passed scope, open boundaries, and smallest closure plan. Never present a
   scope-complete claim as a guarantee of zero defects or unknown future cases.

## Boundaries

- Keep reusable guidance generic; keep actors, brands, routes, prices,
  countries, providers, and state names in the project book.
- Ask when a missing decision would materially change the result. Do not invent
  a fallback, role, permission, DTO, or business rule.
- Do not commit, push, deploy, mutate production data, or expose secrets unless
  the user explicitly authorizes that action.
- Treat bundled assets as the external reusable source, not as project-book
  chapters or proof that a consuming project's book, source, gates, or evidence
  are complete.
- Report exact passed and untested boundaries. Never claim complete, 100%,
  release-ready, or production-safe from partial or stale evidence.
- Start with the smallest complete risk-scoped evidence set. Run full regression
  only for an explicit request, release candidate, demonstrated cross-cutting
  impact, systemic focused evidence, or impact that remains unbounded after
  investigation; “continue” or “test carefully” alone does not broaden scope.
- For module-local source changes, run static checks plus the nearest tests that
  prove the changed behavior and every boundary it actually crosses. Add API,
  database, queue, realtime, rendered UI, or browser evidence only when that
  boundary or a dependent workflow is affected. Include direct consumers shown
  by imports, calls, schemas, shared contracts, or ownership; exclude unrelated
  modules, actors, browsers, infrastructure, and production flows with reasons.
- Build mixed-worktree verification as the union of per-path evidence.
  Documentation paths contribute documentation, generation, and contract
  checks only; they cannot select unrelated runtime commands merely because a
  shared rule also owns prose. Require a changed runtime path, demonstrated
  dependency, focused failure, or objective full-regression trigger for those
  commands.
- Never rerun a changed-scope suite solely because verified files were committed
  without changing their content. The freshness check must compare the complete
  maintained-content fingerprint. Exact revision equality remains mandatory
  for full release and immutable-image evidence.
