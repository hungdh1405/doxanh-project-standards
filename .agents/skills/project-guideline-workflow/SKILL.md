---
name: project-guideline-workflow
description: Install, update, or apply the Doxanh modular new-project standard; generate a project book; change reusable guideline modules; materialize AGENTS.md; or review implementation compliance. Use for projects adopting this packaged workflow. Do not treat the skill as a substitute for project truth or executable gates.
---

# Project Guideline Workflow

## Essential reminders — every task

1. Read applicable `AGENTS.md`, inspect status, and identify the requested
   outcome. Preserve unrelated work. A review is not permission to edit; an
   edit is not permission to commit, push, deploy or mutate production data.
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

## Route to the rules that matter

These reminders point to canonical owners; they do not replace those rules.
Use the project rule planner for anticipated paths and again for actual changes.
Read each selected module completely, including required references. Add owners
when source/dependency analysis reveals another affected boundary.

| Changed surface | Mandatory reminder | Owning modules |
| --- | --- | --- |
| Verification, completion, release | `VERIFY-SCOPE-001`, `VERIFY-CLAIM-001`: exact scope, evidence reuse, named live target, honest result. | GDL-080 |
| Web UI | `UI-VISUAL-001`, `UI-DENSITY-001`, `UI-RESP-001`, `UI-ACCESS-001`: default shadcn-vue, layout-only Tailwind, compact and touch-safe, mobile-first, bounded scrolling, themes and accessibility. Load applicable Vue, shadcn-vue and UI/UX skills. | GDL-050, GDL-051, GDL-052 |
| Copy, labels, choices | `UI-COPY-001`: canonical actor/scope/entity vocabulary, all locales, no raw keys or implementation narration. `UI-CONTROL-001`: long/remote/searchable catalogs use Combobox. | GDL-021, GDL-052 |
| Forms, overlays, actionable feedback | `UI-ACTION-001`, `UI-STATE-001`: readable icon/content, separate action region, consistent cancel/commit order, real handlers, confirmation before writes, failure/conflict recovery. | GDL-030, GDL-051, GDL-052 |
| Records, filters, options, counts, exports | `UI-AUDIENCE-001`: the server authorizes the whole observable surface; hiding a control is not isolation. | GDL-051, GDL-052, GDL-070 |
| Dates/times in UI, email, exports, print or input | `TIME-PRESENTATION-001`: shared Day.js boundary for the web/server profile, authoritative scope/system format and IANA zone, strict input conversion, no raw display fallback. | GDL-042 |
| API, identity, permissions | Fixed `success/code/message/data/request_id` envelope; only `data` varies by endpoint; Zod; server-resolved scoped actor, authorization and safe logging. | GDL-060, GDL-070, GDL-071 |
| Mutation or referenced data | `DATA-CONCURRENCY-001`, `DATA-REFERENCE-001`: atomic scope/state/revision enforcement, valid reference resolution, winning-only effects and durable activity. | GDL-063, GDL-071 |
| Project book or database documents | `DOC-BOOK-001`, `DATA-DOC-001`: complete affected lifecycle, actors, transitions, examples, source reconciliation, table/field explanations and executable book/data checks. | GDL-020, GDL-021, GDL-024, GDL-025 |
| Queue, scheduler, realtime, files, payment, printing, native client | Select active capability/profile owners and required dependencies. Never import another project's business decisions. | Use the module planner |

For an existing-project task or bounded reusable-rule change, use task mode:

```bash
node <locked-skill>/assets/project-template/scripts/docs/manage-guideline.mjs plan \
  --mode task --rules VERIFY-SCOPE-001,UI-ACTION-001
```

Pass the project's approved `--profiles` and `--capabilities`; use `--modules`
for owners without a stable rule mapping. Unknown IDs fail, not silently skip.
For initial project/book generation, profile changes or an explicitly complete
standard review, use `--mode project` and read the full selected profile plan.
Do not load every capability for a small existing-project edit.

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

The GitHub standards repository is the only editable reusable source. Consumers
keep a reference-only `.doxanh-project-standards.json`, their project book and
root `AGENTS.md`; never a duplicate guideline or repository skill.

Use the approved release's `make install` for a new lock and `make sync` for an
approved upgrade (`PROJECT_ROOT`, `REPO_ROOT`). Installer integrity, project
gate adoption and application behavior are three separate results. A new
version lock alone proves neither adoption nor runtime compliance.

Follow the source repository README for safe installation and version
resolution. Materialize the linked `AGENTS.template.md` only on first setup,
resolve its placeholders from project truth, and never overwrite existing
instructions automatically. Do not change application scopes, secrets, live
data or the shared installation while merely reviewing this skill.
