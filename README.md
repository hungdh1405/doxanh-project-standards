# Doxanh Project Standards

Doxanh Project Standards is the reusable engineering and product-delivery
baseline used to start and govern new projects. It packages:

- a modular project guideline with profile and capability selection;
- strict UI/UX, API, data, security, observability, testing, and operations
  contracts;
- one user-scoped Codex skill sourced from this repository;
- a dependency-free installer with drift-safe install, update, and integrity
  checks.

The standard is generic. A consuming project still owns its product truth,
actors, permissions, routes, commercial rules, data model, and deployment
decisions in its project book.

## Requirements

- Git
- Node.js 22 or newer
- pnpm 11.24.0 through Corepack for developing this repository
- Codex for skill-assisted workflows (optional for human-only use)

## Quick start

Clone one clean standards checkout and use it for both the project artifacts
and the user-level Codex skill:

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
to this checkout, so the skill is never copied into every application
repository. Restart Codex after the first installation so
`$project-guideline-workflow` is discovered.

An existing recognized Doxanh skill directory is not replaced implicitly. For
the one-time migration from a copied installation, run
`make skill-sync REPLACE_SKILL=1`. Unknown directories and symlinks are always
preserved and rejected.

## Apply the standard to a project

`PROJECT_ROOT` is the application workspace that owns `docs/` and `scripts/`.
`REPO_ROOT` is the Git repository root used to resolve nested application
workspaces and migrate old repository-scoped installations. They are normally
the same directory; a monorepo may place the project under the repository root.

Installation adds:

- `docs/guidelines/` and the stable `docs/new-project-guideline.md` reference;
- `scripts/docs/manage-guideline.mjs`;
- `scripts/docs/check-installed-standards.mjs` for offline integrity checks;
- `.doxanh-project-standards.json` at the project root, containing the installed
  version and SHA-256 digest of every managed file.

Existing identical files are adopted. A conflicting file, symlink, or existing
installation lock stops the operation before managed content is written. The
installer never overwrites root `AGENTS.md` or project-specific documents.

After installation, materialize
`docs/guidelines/AGENTS.template.md` as the repository's root `AGENTS.md`,
replace every placeholder with approved project truth, and create the project
book described by the selected modules.

## Plan the project guideline

From the application workspace, expose the guideline manager through the
project's selected package manager. The direct command is:

```bash
node scripts/docs/manage-guideline.mjs plan \
  --profiles nuxt-web \
  --capabilities cache,queue,realtime
```

Read every returned module completely. Capabilities that are not selected must
still receive the explicit not-applicable decision and activation trigger
required by the project-book contract.

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

Update is deliberately conservative. It first verifies the old lock and
refuses to proceed if any managed consumer file changed locally. Make a generic
improvement here and release it, or keep a project-specific decision in the
consumer's project book; do not silently fork the reusable modules.

The first synchronization from version 1.0 verifies and removes its old
repository-scoped skill copy, writes the version-2 project-only lock, and links
the user skill to the selected standards checkout. Later synchronization only
updates the clean checkout, project artifacts, and the same link.

Consuming repositories should expose a small `make standards-sync` facade that
refreshes a dedicated cache from this GitHub repository and calls `make sync`.
The application does not own or edit the cached skill. Pin `STANDARDS_REF` to a
release tag when a project requires explicit upgrade approval; use `main` only
where the repository policy guarantees that `main` is always releasable.

## Repository layout

```text
.
├── .agents/skills/project-guideline-workflow/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/project-template/
│   └── scripts/
│       ├── manage-user-skill.mjs
│       └── project-standards.mjs
├── test/project-standards.test.mjs
├── AGENTS.md
├── CHANGELOG.md
├── Makefile
└── package.json
```

The skill asset tree is the single distributable source. Consumer guideline
copies are generated artifacts verified by their lock file, not additional
upstream owners. The skill itself is linked once at user scope and is never
materialized into consumers.

## Develop and release

```bash
pnpm install --frozen-lockfile
make check
```

`make check` validates the skill package, frozen guideline baseline, installer
fixtures, JSON files, documentation links, and skill structure. Before a
release, update the semantic version and changelog, run the complete check, make
one coherent commit, and create an annotated `v<version>` tag.

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
