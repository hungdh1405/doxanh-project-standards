---
name: doxanh
description: Use the Doxanh skill in Codex ($doxanh) or Claude Code (/doxanh), also called "doxanh skill", to implement, review, test, and deliver changes in projects adopting Doxanh standards, or to install/update those standards and their project book. Enforces focused verification, consistent UI and product copy, relevant framework skills, and authorized commit/push follow-through. Formerly project-guideline-workflow.
---

# Doxanh skill

Invoke with `$doxanh` in Codex, `/doxanh` in Claude Code, or “use the doxanh
skill”. Both agents use this same package. The discoverable name is a bootstrap:
resolve each consuming project's lock before applying its rules.

Select approved `nuxt-web`, `nuxt-api`, and/or `flutter-native` profiles
independently. Ask when implementation ownership or the API contract is missing;
do not generate an extra frontend/backend to fill the gap.

## Essential reminders — every task

1. Read applicable `AGENTS.md` and `CLAUDE.md`, inspect status, and identify the requested
   outcome. Preserve unrelated work. A review is not permission to edit; an
   edit is not permission to commit, push, deploy or mutate production data.
   Carry forward authorization already given in this conversation. When commit
   and push were requested, finish the selected checks, inspect the intended
   staged diff, commit, push and verify the remote result without asking again.
2. Use the project's **locked standard**, approved project book, and actual
   owning source/tests. Memory, installed prose and earlier claims are not
   implementation evidence. Resolve with this skill's
   `scripts/manage-user-skill.mjs resolve --target <project-root>` and read the
   returned version's `SKILL.md` when different. Ask about material missing
   requirements; a missing cached version is not permission to upgrade its lock.
3. **Before tests, state what changed and why each selected check is needed.**
   Apply `VERIFY-SCOPE-001`. Start with the smallest complete risk-scoped evidence set.
   Build mixed-worktree verification as the union of per-path evidence.
   Documentation contributes documentation/contract checks, not unrelated
   application flows. Do not select every suite merely
   because at least one source file changed.
   Chrome/Chromium owns functional browser coverage for the affected scope.
   Firefox, Safari/WebKit and mobile profiles default to focused UI/UX checks.
   Full regression expands workflows, not functional duplication across engines;
   a browser-specific risk, observed failure or explicit browser request is needed.
4. **After selected checks pass, stop testing and continue to the requested
   outcome.** Expand only for a demonstrated dependency, relevant failure, or
   objective full-regression trigger. “Continue,” “test carefully,” commit,
   push, deploy and release are not triggers by themselves. A release label
   alone is not a full-regression trigger.
5. **Reuse current evidence.** Never rerun a changed-scope suite solely because verified files were committed.
   Recheck complete maintained-content and relevant environment/configuration
   fingerprints, not just `HEAD`. For a release, add only missing
   candidate/image/target/deployment-bound gates and the phase-aware universal
   release baseline. Local-only evidence cannot satisfy a production claim:
   prove the changed workflow on the named target.
6. **Mandatory means mandatory when applicable, not every check on every task.**
   Use the table below before implementation and at final review. Missing
   mappings fail closed; a safe full-rule fallback is an
   unresolved mapping state, not permission to run everything.

For UI work, read the approved design master and a comparable shipped screen
before editing. Reuse their shell, components, density and action placement.
Remove any helper text that does not help the user decide, act or recover;
`CardDescription` is optional, never a reason to narrate implementation. Inspect
the affected rendered screen in its relevant states before calling it complete.

For framework work, use [GDL-110's skill routing](assets/project-template/docs/guidelines/modules/110-ai-agent-rules.md#171-framework-skills-and-documentation).
Check which relevant skills are actually installed and read them. Nuxt work
uses its official [documentation index](https://nuxt.com/llms.txt) and relevant
sections of [llms-full.txt](https://nuxt.com/llms-full.txt); do not load the whole
feed for a small edit. For Playwright automation, follow GDL-110's setup guidance:
report missing relevant skills with the install command, then apply GDL-080's
test structure and scope rules. Missing optional guidance uses official docs with the
gap stated; a genuinely required missing tool blocks only its dependent step.

## Route to the rules that matter

These reminders point to canonical owners; they do not replace those rules.
Use the project rule planner for anticipated paths and again for actual changes.
Read each selected module completely, including required references. Add owners
when source/dependency analysis reveals another affected boundary.

| Changed surface | Mandatory reminder | Owning modules |
| --- | --- | --- |
| Verification, completion, release | `VERIFY-SCOPE-001`, `VERIFY-CLAIM-001`: exact scope, evidence reuse, named live target, honest result. | GDL-080 |
| Web UI | `UI-VISUAL-001`, `UI-DENSITY-001`, `UI-RESP-001`, `UI-ACCESS-001`: default shadcn-vue, layout-only Tailwind, compact and touch-safe, mobile-first, bounded scrolling, themes and accessibility. Load applicable Vue, shadcn-vue and UI/UX skills. | GDL-050, GDL-051, GDL-052 |
| Flutter UI and lifecycle | The same applicable UI rule IDs route to native widgets, adaptive design, localization, loading, navigation, platform lifecycle and focused native proof. Use Flutter/Dart tools and skills; browser automation cannot prove native behavior. | GDL-053 |
| Copy, labels, choices | `UI-COPY-001`: canonical actor/scope/entity vocabulary, all locales, no raw keys or implementation narration. `UI-CONTROL-001`: long/remote/searchable catalogs use Combobox. | GDL-021, GDL-052 |
| Forms, overlays, actionable feedback | `UI-ACTION-001`, `UI-STATE-001`: readable icon/content, separate action region, consistent cancel/commit order, real handlers, confirmation before writes, failure/conflict recovery. | GDL-030, GDL-051, GDL-052 |
| Records, filters, options, counts, exports | `UI-AUDIENCE-001`: the server authorizes the whole observable surface; hiding a control is not isolation. | GDL-051, GDL-052, GDL-070 |
| Dates/times in UI, email, exports, print or input | `TIME-PRESENTATION-001`: shared Day.js boundary for the web/server profile, authoritative scope/system format and IANA zone, strict input conversion, no raw display fallback. | GDL-042 |
| API, identity, permissions | Fixed `success/code/message/data/request_id` envelope; only `data` varies by endpoint; Zod; server-resolved scoped actor, authorization and safe logging. | GDL-060, GDL-070, GDL-071 |
| Mutation or referenced data | `DATA-CONCURRENCY-001`, `DATA-REFERENCE-001`: owned API enforces atomic scope/state/revision and effects; client profiles implement the documented confirmation, stale/reference recovery and outcome contract without claiming external internals. | API: GDL-063, GDL-071; web/native: profile owners plus GDL-060 |
| Project book or database documents | `DOC-BOOK-001`, `DATA-DOC-001`: complete affected lifecycle, actors, transitions, examples, source reconciliation, table/field explanations and executable book/data checks. | GDL-020, GDL-021, GDL-024, GDL-025 |
| Queue, scheduler, realtime, files, payment, printing, native client | Select active capability/profile owners and required dependencies. Never import another project's business decisions. | Use the module planner |

For bounded book changes, add the specific minimum-content owner: GDL-023 for
UI documents, GDL-024 for system/API/data documents, GDL-053 for native detail,
and GDL-022 for active commercial contracts. `DOC-BOOK-001` alone is the shared
book workflow, not every chapter's content contract.

For an existing-project task or bounded reusable-rule change, use task mode:

```bash
node <locked-skill>/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --mode task --profiles nuxt-web --rules VERIFY-SCOPE-001,UI-ACTION-001
```

Pass the project's approved `--profiles` and `--capabilities`; use `--modules`
for owners without a stable rule mapping. Unknown IDs fail, not silently skip.
In a mixed-profile project, add `--task-profiles flutter-native` for a native-only
edit (or the affected profile combination). It must be a subset of the approved
project profiles. Profile-specific rule owners replace web-only assumptions.
For initial project/book generation, profile changes or an explicitly complete
standard review, use `--mode project` and read the full selected profile plan.
Do not load every capability for a small existing-project edit.

## Complete standard or project-book review

When asked to review everything, inventory and read all in-scope modules,
requirements, document families, templates, manifests, generators, and checks.
A reusable-standard audit includes every supported profile and capability;
a consumer audit includes its approved profiles plus explicit inactive decisions.
Use GDL-025 Section 4.19's complete-audit coverage matrix. Account for every
cataloged output, including variable collections, generated regions and command
files. Reconcile current claims with source and evidence; file counts or headings
alone do not prove completeness. Ask concise questions for material missing
product/design/API/platform/operational decisions and continue independent work.
Distinguish review of reusable generation requirements from review of actual
generated consumer documents. A complete document audit does not itself select
all application tests; GDL-080 still owns test dispatch.

## Execution and completion

- Turn selected rule IDs into acceptance criteria before editing. Update each
  decision in its canonical owner; keep source, docs and traceability in sync.
- Before dispatching tests, validate the project's exported scope plan with
  `scripts/verification-policy.mjs`; read its `--help` contract when adopting
  the guard. Existing projects need a tested adapter from their actual
  changed-path planner. If absent, report the adoption gap and inspect the
  exact command mapping; do not claim the guard is installed.
- After final edits, regenerate derived artifacts and prove idempotence, rerun
  the actual-worktree rule plan, execute only selected missing checks and live
  evidence, then run the freshness/aggregate gate. A relevant failure reopens
  only the affected slice unless investigation proves wider impact.
- For completion/readiness/`100%` questions, `VERIFY-CLAIM-001` requires an
  unambiguous `Yes` or `No` first. `Yes` means the declared finite scope passed
  on the named candidate/environment with zero open boundaries, never zero
  defects or a guarantee about unknown future cases. Otherwise report passed
  scope, exact blockers and the smallest closure plan. Do not silently wait or
  keep running unrelated tests to manufacture confidence.

## Installation and upgrades

For agent discovery, use `make skill-sync AGENTS=both` from the approved source
release, or select `AGENTS=codex` / `AGENTS=claude`. The installed resolver infers
its shared snapshot store; invoke it through the available skill path without
hardcoding another agent's home. A Claude-only machine needs no Codex setup.
`make skill-check AGENTS=both` verifies both discovery links; pass `PROJECT_ROOT`
to additionally verify a project's lock. See the source README for custom paths.

The GitHub standards repository is the only editable reusable source. Consumers
keep a reference-only `.doxanh-project-standards.json`, their project book and
root `AGENTS.md` (with an optional `CLAUDE.md` import); never a duplicate guideline or repository skill.

Use the approved release's `make install` for a new lock and `make sync` for an
approved upgrade (`PROJECT_ROOT`, `REPO_ROOT`). Installer integrity, project
gate adoption and application behavior are three separate results. A new
version lock alone proves neither adoption nor runtime compliance.

Follow the source repository README for safe installation and version
resolution. Materialize the linked `AGENTS.template.md` only on first setup,
resolve its placeholders from project truth, and never overwrite existing
instructions automatically. Do not change application scopes, secrets, live
data or the shared installation while merely reviewing this skill.
