# Repository agent instructions

## Scope and authority

- This repository is the canonical source for the reusable Doxanh project
  standard and its Codex workflow skill.
- Keep the standard generic. Product actors, brands, routes, prices, countries,
  providers, and state names belong in each consuming project's project book.
- Preserve unrelated work. Commit and push only when explicitly authorized.

## Canonical ownership

- The distributable skill lives at
  `.agents/skills/doxanh/`.
- The materialized project template lives only under the skill's
  `assets/project-template/` directory.
- `README.md` owns installation and update guidance. `CHANGELOG.md` owns
  released package history. Do not duplicate the complete standard outside the
  skill assets.

## Change protocol

1. Inspect `git status` and identify the exact generic contract being changed.
2. Read the complete affected guideline module, manifest, templates, skill, and
   installer behavior before editing.
3. Make semantic guideline changes in the owning module only. Update its
   frozen semantic baseline and package version intentionally.
4. Keep installation fail-safe: never silently overwrite a consumer's local
   divergence, root `AGENTS.md`, or project-specific documentation.
5. Run `make check` after the final edit. For installer behavior, also exercise
   install, check, update, conflict, and nested-project fixtures.
6. Report exact evidence and untested boundaries. Do not claim that installing
   prose alone makes a consuming project compliant.

## Release protocol

- Use semantic versions and update `CHANGELOG.md` for every released behavior.
- Keep `main` releasable and tag approved releases as `v<version>`.
- Never put secrets, private project data, production evidence, or generated
  consumer lock files in this repository.
