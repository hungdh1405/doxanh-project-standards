# Doxanh Project Standards

The workflow is called the **Doxanh skill**. Invoke it with `$doxanh` in Codex, `/doxanh`
in Claude Code, or “use the doxanh skill” in any adopted project.

The current release is **4.1.0**, published as `v4.1.0`.

Doxanh Project Standards is the reusable engineering and product-delivery
baseline used to start and govern new projects. It packages:

- a modular project guideline with profile and capability selection;
- strict UI/UX, API, data, security, observability, testing, and operations
  contracts;
- one shared skill for Codex and Claude Code with version-pinned external snapshots;
- a dependency-free reference-lock installer with drift-safe migration from
  older copied packages.

The standard is generic. A consuming project still owns its product truth,
actors, permissions, routes, commercial rules, data model, and deployment
decisions in its project book.

Select `nuxt-web`, `nuxt-api`, and `flutter-native` independently. A full-stack
web project selects the first two; API-only and Flutter-only projects need no
web UI. Client-only projects document their actual external API contracts and
ownership without generating an extra backend.

## Requirements

- Git
- Node.js 22 or newer
- pnpm 11.24.0 through Corepack for developing this repository
- Codex and/or Claude Code for skill-assisted workflows (optional for human-only use)

Framework and automation skills are separate prerequisites, selected for the
project's stack. The [skill setup guidance](.agents/skills/doxanh/assets/project-template/docs/guidelines/modules/110-ai-agent-rules.md#171-framework-skills-and-documentation)
includes the Microsoft Playwright skill installation command and selection
guidance for application tests. Doxanh's installer does not bundle those skills
or install application dependencies.

## Quick start

Clone a clean approved standards release and use it for the project reference
lock and a shared user-level skill:

```bash
git clone https://github.com/hungdh1405/doxanh-project-standards.git
cd doxanh-project-standards
make install \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
make skill-sync AGENTS=both
make skill-check AGENTS=both
```

### Copy-paste bootstrap for an AI agent on macOS

Open the target project in Codex or Claude Code and ask the agent to run the block below from
the project directory. The command checks whether the selected Doxanh skill is
already installed at user scope on this Mac, installs it only through the
verified snapshot manager when necessary, adopts an uninstalled project, and
then verifies the project lock and resolved skill.

The default release below is intentionally explicit. Change
`DOXANH_STANDARDS_REF` only after approving a newer tagged release. For a
monorepo, set `DOXANH_PROJECT_ROOT` to the application workspace and
`DOXANH_REPO_ROOT` to the Git repository root before running the block.

```bash
set -eu

DOXANH_PROJECT_ROOT="${DOXANH_PROJECT_ROOT:-$PWD}"
DOXANH_REPO_ROOT="${DOXANH_REPO_ROOT:-$(git -C "$DOXANH_PROJECT_ROOT" rev-parse --show-toplevel)}"
DOXANH_STANDARDS_REF="${DOXANH_STANDARDS_REF:-v4.1.0}"
DOXANH_AGENTS="${DOXANH_AGENTS:-both}" # codex, claude, or both
DOXANH_BOOTSTRAP_DIR="$(mktemp -d)"

cleanup_doxanh_bootstrap() {
  /usr/bin/trash "$DOXANH_BOOTSTRAP_DIR"
}
trap cleanup_doxanh_bootstrap EXIT

git clone \
  --branch "$DOXANH_STANDARDS_REF" \
  --depth 1 \
  https://github.com/hungdh1405/doxanh-project-standards.git \
  "$DOXANH_BOOTSTRAP_DIR/standards"

printf 'Selected Doxanh standards release: %s\n' "$DOXANH_STANDARDS_REF"
DOXANH_PROJECT_NEEDS_INSTALL=0
if test -f "$DOXANH_PROJECT_ROOT/.doxanh-project-standards.json"; then
  printf 'This project is already adopted; checking its existing lock without upgrading it.\n'
  make -C "$DOXANH_BOOTSTRAP_DIR/standards" installed-check \
    PROJECT_ROOT="$DOXANH_PROJECT_ROOT" \
    REPO_ROOT="$DOXANH_REPO_ROOT"
else
  DOXANH_PROJECT_NEEDS_INSTALL=1
fi

if make -C "$DOXANH_BOOTSTRAP_DIR/standards" skill-check AGENTS="$DOXANH_AGENTS"; then
  printf 'The selected user-scoped skill is already valid on this Mac.\n'
else
  printf 'The selected user-scoped skill is missing or differs; synchronizing it safely.\n'
  make -C "$DOXANH_BOOTSTRAP_DIR/standards" skill-sync AGENTS="$DOXANH_AGENTS"
fi

if test "$DOXANH_PROJECT_NEEDS_INSTALL" -eq 1; then
  make -C "$DOXANH_BOOTSTRAP_DIR/standards" install \
    PROJECT_ROOT="$DOXANH_PROJECT_ROOT" \
    REPO_ROOT="$DOXANH_REPO_ROOT"
  make -C "$DOXANH_BOOTSTRAP_DIR/standards" installed-check \
    PROJECT_ROOT="$DOXANH_PROJECT_ROOT" \
    REPO_ROOT="$DOXANH_REPO_ROOT"
fi
make -C "$DOXANH_BOOTSTRAP_DIR/standards" skill-check AGENTS="$DOXANH_AGENTS" \
  PROJECT_ROOT="$DOXANH_PROJECT_ROOT"
make -C "$DOXANH_BOOTSTRAP_DIR/standards" skill-resolve AGENTS="$DOXANH_AGENTS" \
  PROJECT_ROOT="$DOXANH_PROJECT_ROOT"
```

If the project already pins a different release, `installed-check` reports the
version difference and stops. Do not replace the lock or run an upgrade until
the project owner approves that release change. If `skill-sync` finds an
unknown directory, symlink, or locally changed skill at
any selected agent's `skills/doxanh` path, it also stops
instead of deleting or overwriting it.

After installation, start a new agent session and request:

```text
Use the doxanh skill. Resolve and follow this project's locked
Doxanh standard. Inspect the project before materializing or updating AGENTS.md,
the project book, Makefile integration, or verification gates. Do not change
application code, commit, push, deploy, or upgrade the standards lock without
my approval.
```

### Codex, Claude Code, or both

```bash
make skill-sync AGENTS=both
make skill-check AGENTS=both
make skill-check AGENTS=both PROJECT_ROOT=/absolute/path/to/project
```

Select `AGENTS=codex` (the backwards-compatible default), `AGENTS=claude`, or
`AGENTS=both`. This selects discovery locations, not different rule sets:

| Agent | Default discovery path | Explicit invocation |
| --- | --- | --- |
| Codex | `${CODEX_HOME:-$HOME/.codex}/skills/doxanh` | `$doxanh` |
| Claude Code | `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/doxanh` | `/doxanh` |

Both agents also understand “use the doxanh skill”. They read the same `SKILL.md`,
assets and scripts. `agents/openai.yaml` supplies optional Codex UI metadata;
Claude uses the standard skill entrypoint. This package targets local Codex and
Claude Code workflows with Node.js and repository access, not a claim of tested
Claude.ai/Cowork or hosted API execution.

For `AGENTS=both`, the Codex skill home owns the verified snapshots under its
hidden `.doxanh-project-standards/` directory. Claude's discovery link follows
that home's stable `doxanh` link. Later updates to the shared link reach both
agents without another copy. Claude-only installation stores the same package
under the Claude skill home and requires no Codex installation. Existing managed
links are followed to their owning store instead of creating competing copies.
The snapshots remain immutable and independent of the source Git checkout.

`SKILLS_HOME` overrides the primary store/discovery home; `CLAUDE_SKILLS_HOME`
overrides Claude's discovery location when installing both. For example:

```bash
make skill-sync AGENTS=both \
  SKILLS_HOME=/custom/codex/skills \
  CLAUDE_SKILLS_HOME=/custom/claude/skills
```

The installed resolver infers its own store, including when invoked through a
Claude link. Consumer Make facades should locate an available installed skill
and invoke its resolver without forcing a different agent's `--skills-home`.
A machine configured only for Claude must not need a Codex bootstrap path.
Use `--skills-home` only to deliberately select a store or discovery home.
Resolving a lock never downloads, installs or upgrades its version.

The installer validates every selected destination before replacing any, rejects
unknown/broken links and local divergence, and rolls back all selected discovery
entries if a coordinated project migration fails. Recognized copied installs
still require `REPLACE_SKILL=1`. Existing project locks keep their versions;
retain their snapshots until their upgrades are approved.
When joining an existing standalone agent installation, verified cached versions
are imported into the shared store so older locks still resolve. Original caches
are preserved for recovery; unrecognized or modified cache entries stop migration.

[Codex skills](https://learn.chatgpt.com/docs/build-skills) and
[Claude Code skills](https://code.claude.com/docs/en/skills) document their skill
formats and discovery behavior. Check the relevant framework skills in the
agent actually doing the work; sharing Doxanh does not install those dependencies.

For Claude startup instructions, keep one owner in root `AGENTS.md`. When setting
up a project for Claude, a root `CLAUDE.md` can import it:

```markdown
# Repository instructions

@AGENTS.md
```

Inspect and preserve existing `CLAUDE.md` before adding an import. The installer
never rewrites either instructions file. When explicitly invoked, Doxanh also
tells both agents to read applicable `AGENTS.md` and `CLAUDE.md` instructions.

### Migrating from project-guideline-workflow

The canonical source path is now `.agents/skills/doxanh/`. `skill-sync` verifies
both the `doxanh` destination and any old `project-guideline-workflow` entry
before changing either. An owned old snapshot link is moved to a reported
hidden backup; verified copied/check-out installations require the existing
`REPLACE_SKILL=1` migration flag. Unknown or locally changed entries stop the
operation. Old snapshots remain available to projects pinned to older releases.

Renaming the user-scoped skill removes the old discoverable entry. Any consuming
Make facade or bootstrap that hardcodes `project-guideline-workflow` must point
to `doxanh`, even when the project keeps its older lock. Otherwise its standards
commands fail before resolving that lock. This bootstrap change needs no rules
upgrade: the new resolver can read old locks while their cached snapshots remain
available. Remove a pinned snapshot only after approving its consumers' migration
or accepting that their locked resolution will fail.

To use the new rules in another project, run its
approved `make sync`, review its existing `AGENTS.md` invocation, and migrate its
planner/runner to verification export schema 2. Inspect real test command
expansion: declare `browser_runs: []` for non-browser commands and explicit
functional/UI-UX browser rows for browser commands and aggregates. Installation
preserves project-specific documents and cannot perform that adapter work.

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
`.agents/skills/doxanh/assets/project-template/docs/guidelines/AGENTS.template.md`
as the consuming repository's root `AGENTS.md`, replace every placeholder with
approved project truth, and create only the project-specific book described by
the selected modules.

## Plan the project guideline

From this standards checkout, the direct planning command is:

```bash
node .agents/skills/doxanh/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --profiles nuxt-web,nuxt-api \
  --capabilities cache,queue,realtime
```

This is the complete project-generation plan. Read every returned module
completely. Capabilities that are not selected must
still receive the explicit not-applicable decision and activation trigger
required by the project-book contract.

For a bounded existing-project task, select only its rule owners:

```bash
node .agents/skills/doxanh/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --mode task --profiles nuxt-web --rules VERIFY-SCOPE-001,UI-ACTION-001
```

Pass approved profiles/capabilities as above. `--modules GDL-065` selects an
owner without a rule shortcut; with `--capabilities scheduler` its queue/Redis
dependency is included. Unknown IDs and inactive required capabilities fail
explicitly. Required reading is narrowed, not the applicable obligations.
Use `--mode project` for initial generation, profile changes and complete
reviews. Each selected instruction module is still read in full.

For a native-only edit in a mixed repository, pass all approved project
`--profiles` and `--task-profiles flutter-native`. The planner selects native
rule owners and rejects an unapproved task profile. Project mode requires an
explicit platform selection; a missing decision must be clarified.

A complete reusable-standard review selects all profiles/capabilities. A
consumer-book review follows its approved applicability and accounts for every
document family and generated artifact under
[the complete-review contract](./.agents/skills/doxanh/assets/project-template/docs/guidelines/modules/25-quality-delivery-and-generation.md#419-complete-requirement-and-generated-document-review).
Package checks validate the reusable template and planner; actual consumer
documents, generators, source reconciliation, and application proof require
that project's checkout.

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
make sync AGENTS=both \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

Sync is sequential even under `make -j`. Both sides pass read-only preflight
before changes. A failed project migration restores the old lock and managed
files; a failed coordinated sync also restores the prior skill and every selected agent discovery link. Previous
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

The skill starts with essential reminders and a task-to-rule table. The
complete UI, API, datetime, permission and audit rules remain in their owning
modules; they are mandatory when the change affects that boundary.

Before tests, the agent states the changed behavior and selected/excluded
checks. After those checks pass, it proceeds to the requested outcome. Unchanged
content after a commit or a new message does not justify another full run.

The packaged `scripts/verification-policy.mjs` checks a consuming planner's
export and returns selected `run`/`reuse` commands and exclusions. It rejects
unrelated dispatch, redundant reruns, missing mappings and unjustified full
regression. The complete export contract, runnable example and adoption
fixtures are in [the testing module](./.agents/skills/doxanh/assets/project-template/docs/guidelines/modules/80-testing-and-verification.md).

Upgrading a lock is **not adoption proof**. Inspect and test the consumer's
actual planner and runner adapter with isolated recording commands. A legacy
runner that always invokes `full` still needs a scoped implementation change;
the package cannot silently repair another project's commands. Report package
integrity, adapter adoption and application evidence separately.

## Repository layout

```text
.
├── .agents/skills/doxanh/
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
