# Doxanh Project Standards

Doxanh Project Standards is the reusable engineering and product-delivery
baseline used to start and govern new projects. It packages:

- a modular project guideline with profile and capability selection;
- strict UI/UX, API, data, security, observability, testing, and operations
  contracts;
- one discoverable user-scoped Codex skill with version-pinned external snapshots;
- a dependency-free reference-lock installer with drift-safe migration from
  older copied packages.

The standard is generic. A consuming project still owns its product truth,
actors, permissions, routes, commercial rules, data model, and deployment
decisions in its project book.

## Requirements

- Git
- Node.js 22 or newer
- pnpm 11.24.0 through Corepack for developing this repository
- Codex for skill-assisted workflows (optional for human-only use)

## Quick start

Clone a clean approved standards release and use it for the project reference
lock and user-level Codex skill:

```bash
git clone https://github.com/hungdh1405/doxanh-project-standards.git
cd doxanh-project-standards
make install \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
make skill-sync
```

`make skill-sync` creates one user-level symlink at
`${CODEX_HOME:-$HOME/.codex}/skills/project-guideline-workflow`. The link points
to a verified, version-and-content-addressed snapshot under that skills home's
hidden `.doxanh-project-standards/` directory, not the mutable Git checkout.
There is one cached snapshot per distinct package, no application-local copies.
Restart Codex after the first installation so
`$project-guideline-workflow` is discovered.

An existing recognized Doxanh skill directory is not replaced implicitly. For
the one-time migration from a copied installation, run
`make skill-sync REPLACE_SKILL=1`. The entire old skill and template must match
their own recorded digests; local edits or extra personal files stop migration.
The previous installation is retained as a reported `.bak` path. Unknown
directories and symlinks are preserved and rejected. Switching a verified
legacy checkout symlink from another checkout also requires `REPLACE_SKILL=1`;
updates between owned snapshots do not. Hashes detect drift, not maliciously
re-signed local packages.

## Apply the standard to a project

`PROJECT_ROOT` is the application workspace that owns `docs/` and `scripts/`.
`REPO_ROOT` is the Git repository root used to resolve nested application
workspaces and migrate old repository-scoped installations. They are normally
the same directory; a monorepo may place the project under the repository root.

Installation adds only `.doxanh-project-standards.json` at the project root.
The lock records the selected version, guideline-package fingerprint, and
user-skill contract; reusable guideline files remain outside the project. A
conflicting legacy guideline path, symlink, or existing installation lock stops
the operation before the lock is written. The installer never overwrites root
`AGENTS.md` or project-specific documents.

After installation, materialize
`.agents/skills/project-guideline-workflow/assets/project-template/docs/guidelines/AGENTS.template.md`
as the consuming repository's root `AGENTS.md`, replace every placeholder with
approved project truth, and create only the project-specific book described by
the selected modules.

## Plan the project guideline

From this standards checkout, the direct planning command is:

```bash
node .agents/skills/project-guideline-workflow/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --profiles nuxt-web \
  --capabilities cache,queue,realtime
```

This is the complete project-generation plan. Read every returned module
completely. Capabilities that are not selected must
still receive the explicit not-applicable decision and activation trigger
required by the project-book contract.

For a bounded existing-project task, select only its rule owners:

```bash
node .agents/skills/project-guideline-workflow/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --mode task --rules VERIFY-SCOPE-001,UI-ACTION-001
```

Pass approved profiles/capabilities as above. `--modules GDL-065` selects an
owner without a rule shortcut; with `--capabilities scheduler` its queue/Redis
dependency is included. Unknown IDs and inactive required capabilities fail
explicitly. Required reading is narrowed, not the applicable obligations.
Use `--mode project` for initial generation, profile changes and complete
reviews. Each selected instruction module is still read in full.

## Check or synchronize an installation

Verify the installed version and every managed digest:

```bash
make installed-check \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

After selecting a newer released checkout, synchronize the project and user
skill together:

```bash
make sync \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

Sync is sequential even under `make -j`. Both sides pass read-only preflight
before changes. A failed project migration restores the old lock and managed
files; a failed coordinated sync also restores the prior user skill. Previous
successful skill installations remain recoverable. Concurrent coordinated
syncs fail on an explicit lock instead of racing; after a crashed process,
inspect its state and retained backup before manually removing its empty lock
directory. Do not run standalone update/link commands concurrently with sync.

Update is deliberately conservative. It first verifies old copied files and
refuses migration if any changed locally. A successful migration removes only
verified reusable copies and empty directories, then writes the reference-only
lock. Make generic improvements here and project-specific decisions in the
consumer's project book; do not silently fork the reusable modules.

Synchronization from versions 1 or 2 verifies and removes copied guideline and
repository-skill files, writes the version-3 reference-only lock, and links the
user skill to a verified snapshot. Later synchronization updates the project
lock and discoverable link; existing snapshots remain unchanged.

Consuming repositories should expose a small `make standards-sync` facade that
refreshes a dedicated cache from this GitHub repository and calls `make sync`.
The application does not own or edit the cached skill. Pin `STANDARDS_REF` to a
release tag when a project requires explicit upgrade approval; use `main` only
where the repository policy guarantees that `main` is always releasable.

Every consuming facade must resolve its **own lock** before reading rules or
running package checks, not follow the discoverable link's current version:

```bash
make skill-resolve PROJECT_ROOT=/absolute/path/to/project
```

The command prints the exact verified skill root. Use that root's `SKILL.md`,
assets and scripts for this task. Direct equivalent:
`node <available-skill>/scripts/manage-user-skill.mjs resolve --target <project>`.
Resolution is read-only and fails if the locked snapshot is absent or has
drifted. To cache a missing older version without changing the discoverable
link, use this version's manager:
`node <available-skill>/scripts/manage-user-skill.mjs cache --source <approved-release-skill-root>`.
This also imports fingerprinted releases that predate the snapshot installer.
Do not rewrite the project lock to whatever is available.
A later upgrade in one project cannot alter another project's resolved rules.
The installed discoverable skill is only the bootstrap when versions differ.

## Prevent unrelated testing

The skill starts with six essential reminders and a task-to-rule table. The
complete UI, API, datetime, permission and audit rules remain in their owning
modules; they are mandatory when the change affects that boundary.

Before tests, the agent states the changed behavior and selected/excluded
checks. After those checks pass, it proceeds to the requested outcome. Unchanged
content after a commit or a new message does not justify another full run.

The packaged `scripts/verification-policy.mjs` checks a consuming planner's
export and returns selected `run`/`reuse` commands and exclusions. It rejects
unrelated dispatch, redundant reruns, missing mappings and unjustified full
regression. The complete export contract, runnable example and adoption
fixtures are in [the testing module](./.agents/skills/project-guideline-workflow/assets/project-template/docs/guidelines/modules/80-testing-and-verification.md).

Upgrading a lock is **not adoption proof**. Inspect and test the consumer's
actual planner and runner adapter with isolated recording commands. A legacy
runner that always invokes `full` still needs a scoped implementation change;
the package cannot silently repair another project's commands. Report package
integrity, adapter adoption and application evidence separately.

## Repository layout

```text
.
├── .agents/skills/project-guideline-workflow/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/project-template/
│   └── scripts/
│       ├── manage-user-skill.mjs
│       ├── project-standards.mjs
│       ├── sync-standards.mjs
│       └── verification-policy.mjs
├── test/project-standards.test.mjs
├── AGENTS.md
├── CHANGELOG.md
├── Makefile
└── package.json
```

The skill asset tree is the single distributable source. Consumer repositories
retain no guideline copies; they keep their project book and one version lock.
The skill is linked once at user scope and is never materialized into consumers.

## Develop and release

```bash
pnpm install --frozen-lockfile
make check
```

`make check` validates the skill package, frozen guideline baseline, installer
fixtures, task selection, evidence-reuse decisions, JSON files, documentation
links, and skill structure. These are standards-package checks: they do not
launch consumer application/browser/production suites. Before a
release, update the semantic version and changelog, run the complete check, make
one coherent commit, and create an annotated `v<version>` tag.

Generated projects use `VERIFY-SCOPE-001` to select the smallest complete
risk-scoped evidence set for ordinary changes and releases. A release compares
the accepted/deployed base with the exact candidate, runs a phase-aware
universal release baseline before and after deployment, and adds only affected
verification slices and live target proof.
Release status alone is not a full-regression trigger. Full regression is
reserved for an explicit request, an initial release or missing trusted
baseline, demonstrated cross-cutting impact, systemic evidence, or impact that
remains unbounded after investigation.
Mixed worktrees are planned per changed path: documentation contributes its
own checks and cannot select unrelated application suites simply because the
same rule also owns runtime behavior.
Changed-scope reports are bound to the complete maintained-content fingerprint,
so committing the exact verified files preserves the evidence. An actual
maintained-content change invalidates it. Candidate release evidence remains
bound to the exact Git revision, immutable image, and target environment;
local-only evidence never satisfies a production claim.
Application source changes select the changed module, affected boundaries, and
demonstrably affected direct consumers. Multiple modules use the union of those
focused slices; source code alone is never a reason to run every suite.

## Security and support boundaries

- The installer performs local file operations only; it does not contact
  production systems or mutate application data.
- Managed-file hashes detect accidental or unreviewed divergence but are not a
  code-signing system. Use Git commit/tag verification when stronger provenance
  is required.
- Installing the package does not prove project compliance. Each project must
  materialize executable gates and current evidence required by the selected
  modules.

Issues and improvements belong in this repository when they are reusable across
projects. Product-specific changes belong in the consuming repository. See
[CONTRIBUTING.md](./CONTRIBUTING.md) for the change and release protocol and
[SECURITY.md](./SECURITY.md) for private vulnerability reporting.

## License

[MIT](./LICENSE)
