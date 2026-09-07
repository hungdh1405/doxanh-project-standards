# Contributing

Contributions should improve a reusable cross-project contract, its installer,
or its workflow skill. Product-specific requirements belong in the consuming
project and are out of scope here.

## Before changing the standard

1. Read [`AGENTS.md`](./AGENTS.md), the complete affected module, its manifest
   entry, and every dependent template or executable check.
2. Explain the cross-project problem and why a project-book decision or ADR is
   not sufficient.
3. Preserve one canonical owner. Link from secondary documentation rather than
   repeating the rule.
4. Identify affected stable rule IDs, generated documents, profiles,
   capabilities, and verification behavior.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
make check
```

Installer changes must preserve or extend fixtures for clean install, identical
file adoption, conflicting-file rejection, local-drift rejection, nested
project roots, and symlink safety.

## Versioning

- Patch: compatible wording, validation, packaging, or installer correction.
- Minor: compatible module, capability, rule, or generated-contract addition.
- Major: incompatible paths, ownership, required profiles, or consumer update
  behavior.

For every release, update `package.json`, `CHANGELOG.md`, and
`.agents/skills/doxanh/assets/project-standards.json`,
refresh the package fingerprints, run `make check`, commit one coherent
release, and create the annotated `v<version>` tag.

Never update the frozen semantic-baseline hash merely to make a failing check
pass. Review the concatenated complete-edition diff and approve the semantic
change first.
