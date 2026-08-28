# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## [3.2.1] - 2026-08-28

### Fixed

- Referenced-record impact may load before a confirmation opens or within its
  initial pending state; replacement resolution must disable commit until valid
  and does not require a redundant second modal.

## [3.2.0] - 2026-08-28

### Added

- `DATA-REFERENCE-001` requires an explicit lifecycle policy for every inbound
  durable reference, an authorized impact preflight, replacement resolution
  before confirmation, atomic server revalidation, preserved history,
  winning-only effects, and focused API/UI/concurrency proof.

## [3.1.0] - 2026-08-28

### Added

- `VERIFY-SCOPE-001` requires risk-scoped verification, explicit inclusion and
  exclusion reasons, and objective full-regression triggers.
- Unknown-path safe fallbacks are unresolved review states and cannot
  mechanically launch unrelated broad suites.

### Changed

- The skill workflow and generated `AGENTS.md` template now require impact
  classification before tests and evidence-driven expansion of test scope.

## [3.0.0] - 2026-08-27

### Changed

- Consuming repositories now keep only a reference lock and their
  project-specific documents; reusable guideline modules stay in this skill.
- Version-1 and version-2 updates verify copied files before removing them and
  refuse migration when local divergence would be lost.
- Profile planning, package checking, and `AGENTS.md` materialization resolve
  from the selected external standards checkout.

## [2.0.1] - 2026-08-27

### Fixed

- Repeated synchronization of an already-current project leaves its lock and
  worktree unchanged.

## [2.0.0] - 2026-08-27

### Added

- User-level skill synchronization and verification through Make targets.
- Offline project-lock verification without a repository-scoped skill copy.
- One-command project and user-skill synchronization for consuming projects.

### Changed

- New installations use a version-2 project-only lock.
- Updates verify and remove the version-1 repository skill before switching to
  the single user-scoped skill source.

## [1.0.0] - 2026-08-27

### Added

- Modular generic project standard with Nuxt web and optional Flutter profiles.
- Capability planning for commercial access, shareable entry, payments,
  printing, cache, queue, scheduler, realtime, and files.
- Fixed five-field API response contract and executable UI/UX rule baseline.
- Repository and personal Codex skill distribution.
- Drift-safe local install, update, and integrity-check commands.
- Node test fixtures for clean installation, adoption, conflict protection,
  local-drift rejection, nested project roots, and guideline equivalence.
