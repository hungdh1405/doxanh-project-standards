# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

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
