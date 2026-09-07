# New Project Guideline

> Chapter: Governance standard (outside generated project-book sequence)
> Lifecycle: Approved
> Implementation: N/A — reusable project standard
> Owner: Project owner
> Reviewers: Product, design, engineering, security, QA, and operations leads
> Profiles: Shared, Nuxt web, Nuxt API, Flutter native
> Last reviewed: 2026-09-08
> Canonical for: Human and AI entry into the modular new-project standard
> Depends on: None
> Produces: External guideline manifest, `AGENTS.md` template, active module plan, and the generated project-book contract
> Evidence: Modular complete edition is checked byte-for-byte against the manifest's versioned semantic baseline

This is the required human and AI entry point inside the installed standards
skill. The detailed rules are maintained as ordered modules under its
`docs/guidelines/modules/` asset path. Do not copy the package into each
application repository or load the complete standard for every
task.

The ordered modules are the normative complete edition. Concatenating every
module in manifest order must reproduce the current approved semantic baseline
byte-for-byte. `docs:guideline:check` enforces that invariant, the fixed API
response envelope, the genericity boundary, module registration, and the frozen
baseline hash.

## 1. Authority and invariant

The order of authority remains:

1. approved product requirements
2. approved project-specific decisions and ADRs
3. the active modules selected by this guideline
4. framework and library defaults

The detailed [authority and principles](./modules/00-authority-and-principles.md)
module owns the complete interpretation of `must`, `should`, `may`, exceptions,
genericity, and project materialization.

No module may silently change generated outputs. A semantic change requires an
intentional review of the complete-edition hash, affected rule IDs, generated
document catalog, templates, checks, and release impact.

## 2. Required reading protocol

Humans and AI agents must:

1. read this entry
2. read the adjacent `docs/guidelines/guideline-manifest.json` in the installed
   standards skill
3. determine active profiles and capabilities from approved project truth
4. run the locked package's module planner (or the consuming repository's facade):
   `--mode task --rules <ids>` / `--modules <ids>` for bounded work;
   `--mode project` for generation, profile changes or a complete review
5. read every returned module completely, in returned order
6. resolve material unknowns through the clarification protocol before design
   or implementation
7. generate the complete required book on initial setup; for maintenance,
   update the affected canonical outputs without regenerating unrelated chapters

Shared governance is required. Select `nuxt-web`, `nuxt-api`, and
`flutter-native` independently from approved product and ownership decisions.
Project mode requires an explicit platform selection and asks when it is missing.
Conditional capabilities are loaded only when active; an
inactive capability still receives the honest N/A/activation treatment required
by the project-book modules.

Example:

```bash
make standards-plan \
  PROFILES=nuxt-web,nuxt-api \
  CAPABILITIES=cache,queue,realtime,shareable-entry
```

Task mode selects the authority/verification owners plus the named rules or
modules and required dependencies. Unknown IDs or inactive required capabilities
fail explicitly. It reduces reading, not mandatory obligations. Project mode
retains the full profile inventory. Scheduler activation includes queue/Redis.
In a mixed-profile repository, `--task-profiles` narrows a task to affected
approved platforms; native UI rules select the Flutter owner. Full reusable
reviews include all registered profiles and capabilities and use Section 4.19's
requirement/output matrix. Reading all requirements does not run all tests.

The plan is an applicability index, not permission to ignore a cross-cutting
shared module or invent a missing product decision.

## 3. Module map

The machine-readable manifest is canonical for order and activation. The module
families are:

| Family | Canonical modules | Activation |
| --- | --- | --- |
| Authority, stack, and project-book generation | `GDL-000`–`GDL-030` | Shared; commercial access is conditional. |
| Nuxt, Vue, and web UI/UX | `GDL-040`–`GDL-052` | Selected web profile; GDL-042 also owns API temporal/TypeScript rules; shareable entry is conditional. |
| Flutter native | `GDL-053` | Selected native profile, independently or as a companion. |
| API, PostgreSQL, concurrency, and infrastructure | `GDL-060`–`GDL-067` | Shared API integration contract; owned data belongs to the API profile; capabilities are conditional. |
| Security, observability, testing, and operations | `GDL-070`–`GDL-100` | Shared, with conditional behavior inside the owning contracts. |
| AI execution and official references | `GDL-110`–`GDL-120` | Shared. |

Use the manifest paths rather than guessing filenames or reading modules by
numeric range alone.

## 4. Preserved generated outputs

The restructure preserves the complete requirements for:

- root `AGENTS.md` materialized from the reusable template and enforced as
  maintained policy input
- `docs/book-manifest.yaml` and its schema
- the human project-book `docs/README.md`
- product, glossary, domain, module, MVP, and traceability chapters
- conditional commercial-access documentation
- UI system, design tokens, design-system, mock-screen/flow, and UI/UX checklist
- architecture, API, database, security, permissions, activity, realtime, jobs,
  and native-platform chapters
- engineering, source, testing, observability, local-development, release,
  production, runbook, and ADR chapters
- Docker, Compose, Make, verification, and evidence command contracts

The detailed document catalog and templates remain authoritative inside the
complete modular edition. This entry does not weaken or summarize them into a
replacement contract.

## 5. Fixed API response envelope

Every first-party JSON application endpoint retains exactly five top-level
fields:

```json
{
  "success": true,
  "code": 0,
  "message": "Operation completed.",
  "data": {},
  "request_id": "req_01..."
}
```

The contract is fixed:

- `data` is the only endpoint-specific payload shape
- all five fields are required
- extra endpoint-specific top-level fields are forbidden
- real success is HTTP `200`, `success: true`, `code: 0`
- every handled validation, business, permission, conflict, or rate outcome is
  HTTP `200`, `success: false`, with a registered non-zero code and WARN log
- only an unexpected programming/system failure uses HTTP `500`, the same
  five-field envelope, a registered internal non-zero code, and ERROR log
- protocol-specific exceptions must be explicitly registered

The complete normative contract is in
[GDL-060](./modules/60-api-contract.md). The manifest duplicates only
its machine-verifiable invariant, not endpoint behavior.

## 6. Commands

Run project-book commands from the application workspace and standards-package
commands through its Make facade. Record both exact locations in the root
`README.md` and `docs/engineering-standards.md`:

The `pnpm` commands below illustrate a selected JavaScript project. Native-only
projects expose equivalent documentation/quality commands through their approved
Make/Dart tooling; do not add JavaScript just to reproduce an example spelling.

| Command | Purpose |
| --- | --- |
| `make standards-plan PROFILES=<profiles> CAPABILITIES=<capabilities>` | Print the exact ordered external modules an AI or human must read. |
| `make standards-check` | Validate the selected external package, reference lock, and user-level skill. |
| `pnpm docs:book:generate` | Generate the existing project-book derived outputs without copying reusable guideline files. |
| `pnpm docs:check` | Run the project-book checks. |
| `pnpm rules:plan -- --files <comma-separated-project-paths>` | Before editing, merge anticipated paths with maintained changes and print the risk-scoped classification, affected boundaries, applicable rules, selected/excluded commands with reasons, full-regression decision, and unresolved safe fallback; omit `--files` after editing to plan from the actual worktree. |
| `pnpm verify:changed` | Run the reviewed changed-scope plan; refuse an unresolved safe full-rule fallback. |
| `pnpm release:plan -- --base <accepted-or-deployed-revision> --candidate <candidate-revision> --target <environment>` | Build the release scope from the complete base-to-candidate diff, universal baseline, affected slices, justified exclusions, target proof, and objective full-regression decision. |

## 7. Safe editing contract

For a structural move that does not change a canonical path or documented
contract:

- preserve module bytes and order
- keep the semantic-baseline hash unchanged
- run guideline, contract, documentation, and changed-scope verification

A canonical path change is an intentional contract change and follows the rule
change process below, even when no runtime behavior changes.

For an intentional rule change:

- edit the owning module only
- identify affected stable rule IDs and generated outputs
- update dependent templates/checks without copying the rule elsewhere
- review the complete-edition diff
- update the semantic-baseline hash only after approval
- record why output behavior changed

Do not edit this generated entry in a consuming project. Change the owning
template in the standards repository, then release and synchronize the new
version.

## 8. Practical rule

If an active module leaves a material product, permission, security, data,
commercial, realtime, native, infrastructure, or operational decision unclear,
stop and ask. Do not let completeness pressure turn an assumption into project
truth.
