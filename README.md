# Doxanh Project Standards

Doxanh Project Standards is the reusable engineering and product-delivery
baseline used to start and govern new projects. It packages:

- a modular project guideline with profile and capability selection;
- strict UI/UX, API, data, security, observability, testing, and operations
  contracts;
- a repository-scoped Codex skill that makes the workflow discoverable;
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

## Install the Codex skill

Install the skill for your user directly from this public repository:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo hungdh1405/doxanh-project-standards \
  --path .agents/skills/project-guideline-workflow
```

Restart Codex after installation so the new skill is discovered. The installed
skill is available as `$project-guideline-workflow`.

If `CODEX_HOME` is not set, its usual value is `~/.codex`. The installer
refuses to overwrite an existing skill directory; remove or rename an older
personal installation deliberately before reinstalling.

## Apply the standard to a project

Clone this repository, then run the installer from its root:

```bash
git clone https://github.com/hungdh1405/doxanh-project-standards.git
cd doxanh-project-standards
make install \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

`PROJECT_ROOT` is the application workspace that owns `docs/` and `scripts/`.
`REPO_ROOT` is the Git repository root that should receive the repository-scoped
skill. They are normally the same directory; a monorepo may place the project
under the repository root.

Installation adds:

- `docs/guidelines/` and the stable `docs/new-project-guideline.md` reference;
- `scripts/docs/manage-guideline.mjs`;
- `.agents/skills/project-guideline-workflow/` at the repository root;
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

## Check or update an installation

Verify the installed version and every managed digest:

```bash
make installed-check \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

After pulling a newer tagged release of this repository, update a consumer:

```bash
make update \
  PROJECT_ROOT=/absolute/path/to/project \
  REPO_ROOT=/absolute/path/to/repository
```

Update is deliberately conservative. It first verifies the old lock and
refuses to proceed if any managed consumer file changed locally. Make a generic
improvement here and release it, or keep a project-specific decision in the
consumer's project book; do not silently fork the reusable modules.

## Repository layout

```text
.
├── .agents/skills/project-guideline-workflow/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/project-template/
│   └── scripts/project-standards.mjs
├── test/project-standards.test.mjs
├── AGENTS.md
├── CHANGELOG.md
├── Makefile
└── package.json
```

The skill asset tree is the single distributable source. Consumer copies are
versioned materializations verified by their lock file, not additional upstream
owners.

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
