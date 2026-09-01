# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## [3.5.2] - 2026-09-01

### Fixed

- Changed-scope verification is bound to the complete maintained-content
  fingerprint. Committing exactly the verified content must not make that
  evidence stale or trigger an unrelated rerun merely because `HEAD` changed.
- Full release evidence remains strictly bound to the exact Git revision,
  content fingerprint, and immutable candidate image.
- Verification planners must test commit-only carry-forward, actual-content
  invalidation, documentation-only selection, and mixed-worktree selection.

## [3.5.1] - 2026-09-01

### Fixed

- Mixed documentation-and-runtime worktrees must build verification as the
  union of per-path evidence. Documentation paths cannot select unrelated UI,
  API, database-runtime, actor-flow, or production commands simply because a
  shared rule also owns related prose.
- Planner fixtures must cover both documentation-only and mixed-worktree
  selection behavior.

## [3.5.0] - 2026-09-01

### Added

- `DOC-BOOK-001` and `DATA-DOC-001` are now reserved blocking reusable
  contracts.
- Stateful workflow documentation must cover every state and transition rather
  than expanding only one exceptional status.
- Database chapters must explain every table and field in task language,
  including operational and security tables, and reconcile them with the
  canonical schema through `docs:data:check`.
- Documentation-only and reusable-standard work is explicitly bounded to
  documentation/package/contract evidence; unmatched paths block planning and
  cannot silently trigger unrelated application or production suites.

## [3.4.0] - 2026-08-29

### Added

- `UI-AUDIENCE-001` now requires one server-authorized actor, scope,
  capability, relationship, and record-state projection for the complete
  observable surface, including records, controls, option/facet catalogs,
  counts, exports, and drill-downs.
- Cross-boundary accountability may expose only a bounded actor category when
  its action affected an authorized scope; identity and unrelated activity are
  redacted unless a separate permission explicitly allows them.
- `UI-COPY-001` now requires glossary-owned canonical actor, scope, entity,
  state, and action labels across every UI surface and locale, with executable
  rejection of competing synonyms and raw or humanized technical keys.
- `VERIFY-CLAIM-001` now requires an unambiguous yes/no answer for completion,
  all-cases, production-readiness, and `100%` questions. A positive claim is
  limited to a finite declared scope with current candidate-bound evidence and
  no failed, skipped, stale, pending, not-tested, or open boundary.

## [3.3.0] - 2026-08-29

### Added

- `TIME-PRESENTATION-001` is now a reserved blocking generated-project rule
  requiring one authoritative scope/system presentation context, shared
  formatter boundaries, localized invalid output, and executable rejection of
  browser/local formatting and raw temporal display fallbacks.
- `UI-ACTION-001` now requires a shared content-led actionable-feedback
  composition for notifications, alert cards, banners, inbox items, and
  pop-ups, with a separate responsive action region and long-localization proof.

## [3.2.2] - 2026-08-28

### Fixed

- Referenced-record confirmation dialogs now require concise recovery guidance
  when no suitable replacement exists, without auto-creating, auto-selecting,
  or opening a second confirmation dialog.

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
