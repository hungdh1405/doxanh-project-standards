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
4. Turn selected stable rule IDs into acceptance criteria and verification.
   For Nuxt/Vue UI, load the applicable Vue, shadcn-vue, and UI/UX skills and
   apply `UI-CONTROL-001` whenever a choice control is designed, implemented,
   or reviewed.
5. Change each rule or product decision in its single canonical owner. Link
   from secondary documents, update traceability, and materialize applicable
   rules in the project's machine-readable gate manifest with real evidence.
6. Regenerate derived artifacts and prove idempotence. Run the final rule plan
   against the actual worktree, changed-scope verification, focused live proof
   selected by the rules, and the verification-freshness check.

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
