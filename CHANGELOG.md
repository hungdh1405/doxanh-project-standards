# Changelog

All notable changes to this project are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## [4.0.0] - 2026-09-08

### Changed

- Rename the discoverable skill and canonical package path to `doxanh`. Invoke
  it with `$doxanh` or “doxanh skill”; consumer locks now name that skill.
- Select web, API and Flutter profiles independently, with explicit ownership
  and profile-aware task routing. API-only/native-only projects do not generate
  an unrelated web UI or backend.
- Reconcile every document family, template and platform requirement; clarify
  inactive collections/runbooks, external API ownership, transport selection,
  native temporal/testing contracts, and version-compatible form integration.
- Align CI, Make and readiness checklists with focused verification; preserve
  clean-commit change discovery and capture failure traces without retries.
- Verification exports use schema 2 with explicit browser runs for each command.
  Chrome/Chromium owns functional coverage; secondary browsers and mobile
  profiles default to focused UI/UX checks even during full regression.
- Replace the repetitive AI checklist with task routing, framework-skill
  compatibility guidance and authorized commit/push follow-through.
- Review affected UI against the approved design and existing shared patterns.
  Green/sidebar choices are fallbacks; already-approved project design wins.
  Card descriptions are optional; remove implementation narration and redundant
  helper cards. Copy review follows changed scope and reuses accepted coverage.
- Use Nuxt's actual documentation index/full feed and the upstream shadcn-vue
  skill. Route all reviewed Flutter/Dart skill families by task, with explicit
  architecture, localization, serialization and SDK compatibility boundaries.

### Added

- Playwright automation skill discovery and `npx skills add microsoft/playwright`
  setup guidance, with application/contributor skill selection and official
  test-structure references that preserve focused verification.
- Complete-review coverage matrix and clarification protocol for every
  requirement and generated output, plus explicit file/media and external
  integration lifecycle contracts.
- Executable rejection of unjustified secondary-browser functional runs,
  including aggregate commands; explicit browser-risk exceptions remain scoped.
- Drift-safe migration of the old discoverable skill with recoverable backups,
  preserved old snapshots/locks, and coordinated rollback fixtures.

### Migration

- Update consumer bootstrap paths/invocations and planner exports when adopting
  4.0.0. Schema-1 verification exports require migration, not an automatic full run.
- Existing full-stack consumers explicitly select `nuxt-web,nuxt-api`; project
  plans no longer silently enable Nuxt web. Mixed projects can target a task
  with `--task-profiles` without changing their approved project profiles.
- Root `AGENTS.md`, project books and consumer test runners remain project-owned;
  package installation does not rewrite them or prove runtime compliance.

## [3.7.0] - 2026-09-07

### Changed

- Put essential task/test-scope reminders first in the skill. Detailed
  requirements stay mandatory in their canonical owners; task mode loads only
  selected owners and dependencies instead of the entire generation profile.
- Require an explicit test-dispatch checkpoint and stopping condition. Reuse
  current content-bound proof after commit; add only missing evidence.
- Separate installed-package integrity, consumer planner/runner adoption and
  application verification. A changed version lock cannot prove gate adoption.

### Added

- Read-only executable verification-policy guard with behavioral fixtures for
  documentation, mixed/module-local changes, dependencies, full-regression
  decisions, phase-aware releases, evidence freshness and proposed dispatch.
- Content-addressed external skill snapshots and per-project lock resolution,
  preserving distinct versions without repository-local skill copies.

### Fixed

- Scheduler selection includes its queue/Redis dependency, including task mode.
- Copied-skill migration validates instruction and template hashes, rejects
  local divergence and extra files, and retains a recoverable previous copy.
- Coordinated synchronization preflights both sides and runs sequentially even
  under parallel Make; migration failures restore managed files and the lock,
  and coordinated failures restore the prior user skill.

## [3.6.0] - 2026-09-07

### Changed

- Release verification now compares the accepted/deployed base revision with
  the exact candidate, runs a phase-aware universal release baseline before and
  after deployment, and adds only the union of affected verification slices and
  target-environment proof.
- A release label, protected branch, commit, push, or deployment no longer
  triggers full-system regression by itself. Full regression remains mandatory
  for explicit requests, initial releases or missing trusted baselines,
  demonstrated cross-cutting impact, systemic focused failures, or unbounded
  impact.
- Content-identical verification is promoted across a commit-only transition;
  release execution runs only missing revision-, image-, deployment-, target-,
  and affected-live gates instead of repeating unrelated suites.

### Added

- Generated projects now require a `release:plan` contract with exact base,
  candidate, target environment, complete diff, universal baseline, justified
  exclusions, and an explicit full-regression decision.
- Package validation fixtures reject release contracts that omit risk-scoped
  release selection or allow local-only evidence to satisfy production claims.

## [3.5.3] - 2026-09-01

### Clarified

- Application source changes use a dependency-closed, risk-scoped test slice:
  the changed module, its changed boundaries, and demonstrably affected direct
  consumers. Source code does not automatically trigger full regression.
- Multi-module changes use the union of those focused slices. Unrelated actors,
  modules, browsers, infrastructure, and production flows remain excluded with
  recorded reasons.
- Full regression remains limited to explicit requests, release candidates,
  demonstrated cross-cutting impact, systemic focused failures, or impact that
  cannot be bounded after dependency analysis.

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
